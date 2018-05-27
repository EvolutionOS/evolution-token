var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');

const evoDistributionArtifacts = require('../build/contracts/EvoDistribution.json');
const evoTokenArtifacts = require('../build/contracts/EvoToken.json');
const contract = require('truffle-contract');
let EvoDistribution = contract(evoDistributionArtifacts);
let EvoToken = contract(evoTokenArtifacts);
const Web3 = require('web3');


if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

EvoDistribution.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof EvoDistribution.currentProvider.sendAsync !== "function") {
  EvoDistribution.currentProvider.sendAsync = function() {
    return EvoDistribution.currentProvider.send.apply(
      EvoDistribution.currentProvider, arguments
    );
  };
}

EvoToken.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof EvoToken.currentProvider.sendAsync !== "function") {
  EvoToken.currentProvider.sendAsync = function() {
    return EvoToken.currentProvider.send.apply(
      EvoToken.currentProvider, arguments
    );
  };
}

let evoDistributionAddress = process.argv.slice(2)[0];
let BATCH_SIZE = process.argv.slice(2)[1];
if(!BATCH_SIZE) BATCH_SIZE = 80;
let distribData = new Array();
let distribData2 = new Array();
let allocData = new Array();
let allocData2 = new Array();
let fullFileData = new Array();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function doTransfers() {
  console.log(`
    --------------------------------------------
    ---------Performing transfers ------------
    --------------------------------------------
  `);

  let accounts = await web3.eth.getAccounts();
  let userBalance = await web3.eth.getBalance(accounts[0]);
  let evoToken = await EvoToken.at(evoDistributionAddress);
  let evoDistribution = await EvoDistribution.at(evoDistributionAddress);

  for(var i = 0;i< distribData.length;i++){
    try{
      let gPrice = 12000000000;
      console.log("Attempting to transfer EVOs to accounts:",distribData[i],"\n\n");
      let r = await evoToken.transfer(distribData[i],distribData2[i],{from:accounts[0], gas:5000000, gasPrice: gPrice});
    } catch (err){
      console.log("ERROR:",err);
    }
  }

}

function readFile() {
  var stream = fs.createReadStream("data/transfers.csv");

  let index = 0;
  let batch = 0;

  console.log(`
    --------------------------------------------
    --------- Parsing transfer.csv file ---------
    --------------------------------------------
    ******** Removing beneficiaries without tokens or address data
  `);

  //console.log("QQQ",distribData);

  var csvStream = csv()
      .on("data", function(data){
          let isAddress = web3.utils.isAddress(data[0]);
          if(isAddress && data[0]!=null && data[0]!='' ){
             allocData.push(data[0]);
             allocData2.push(data[1]); // this will have second column value .. expected token to transfer
             fullFileData.push(data[0]);

            index++;
            if(index >= BATCH_SIZE)
            {
              distribData.push(allocData);
              distribData2.push(allocData2);
            //  console.log("DIS",distribData);
              allocData = [];
              allocData2 = [];
            //  console.log("ALLOC",allocData);
              index = 0;
            }

          }
      })
      .on("end", function(){
           //Add last remainder batch
           distribData.push(allocData);
           distribData2.push(allocData2);
           allocData = [];
           allocData2 = [];
           doTransfers();
      });

  stream.pipe(csvStream);
}

if(evoDistributionAddress){
  console.log("Processing transfers.");
  readFile();
}else{
  console.log("Please run the script by providing the address of the EvoDistribution contract");
}
