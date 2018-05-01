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
let allocData = new Array();
let fullFileData = new Array();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function setAllocation() {

  console.log(`
    --------------------------------------------
    ---------Performing allocations ------------
    --------------------------------------------
  `);

  let accounts = await web3.eth.getAccounts();
  let userBalance = await web3.eth.getBalance(accounts[0]);

  let evoDistribution = await EvoDistribution.at(evoDistributionAddress);

  //console.log("%%%%%%%%%%%%%%%",distribData);
  //console.log(evoDistribution);
  for(var i = 0;i< distribData.length;i++){

    try{
      let gPrice = 10000000000;
      console.log("Attempting to allocate 250 EVOs to accounts:",distribData[i],"\n\n");
      let r = await evoDistribution.airdropTokens(distribData[i],{from:accounts[0], gas:4500000, gasPrice: gPrice});
      console.log("---------- ---------- ---------- ----------");
      console.log("Allocation + transfer was successful.", r.receipt.gasUsed, "gas used. Spent:",r.receipt.gasUsed * gPrice,"wei");
      console.log("---------- ---------- ---------- ----------\n\n")
    } catch (err){
      console.log("ERROR:",err);
    }

  }

  console.log("Distribution script finished successfully.")
  console.log("Waiting 2 minutes for transactions to be mined...")
  await delay(90000);
  console.log("Retrieving logs to inform total amount of tokens distributed so far. This may take a while...")

  let evotokenAddress = await evoDistribution.EVO({from:accounts[0]});
  let evoToken = await EvoToken.at(evotokenAddress);

  var sumAccounts = 0;
  var sumTokens = 0;

  var eventData = new Array();

  var events = await evoToken.Transfer({from: evoDistribution.address},{fromBlock: 0, toBlock: 'latest'});
  events.get(function(error, log) {
      event_data = log;
      //console.log(log);
      for (var i=0; i<event_data.length;i++){
          //let tokens = event_data[i].args.value.times(10 ** -18).toString(10);
          //let addressB = event_data[i].args.to;
          sumTokens += event_data[i].args.value.times(10 ** -18).toNumber();
          sumAccounts +=1;
          eventData.push(event_data[i].args.to);
          //console.log(`Distributed ${tokens} EVO to address ${addressB}`);

      }

      console.log(`A total of ${sumTokens} EVO tokens have been distributed to ${sumAccounts} accounts so far.`);
      var eventData_s = new Set(eventData);
      let missingDistribs = fullFileData.filter(x => !eventData_s.has(x));

      if(missingDistribs.length >0){
          console.log("************************");
          console.log("-- No Transfer event was found for the followign accounts. Please review them manually --")
          for(var i = 0; i<missingDistribs.length;i++){
              console.log('\x1b[31m%s\x1b[0m',`No Transfer event was found for account ${missingDistribs[i]}`);
          }
          console.log("************************");
      }

      //console.log(`Run 'node scripts/verify_airdrop.js ${evoDistribution.address} > scripts/data/review.csv' to get a log of all the accounts that were distributed the airdrop tokens.`)


  });

}


function readFile() {
  var stream = fs.createReadStream("data/airdrop.csv");

  let index = 0;
  let batch = 0;

  console.log(`
    --------------------------------------------
    --------- Parsing distrib.csv file ---------
    --------------------------------------------
    ******** Removing beneficiaries without tokens or address data
  `);

  //console.log("QQQ",distribData);

  var csvStream = csv()
      .on("data", function(data){
          let isAddress = web3.utils.isAddress(data[0]);
          if(isAddress && data[0]!=null && data[0]!='' ){
            allocData.push(data[0]);
            fullFileData.push(data[0]);

            index++;
            if(index >= BATCH_SIZE)
            {
              distribData.push(allocData);
            //  console.log("DIS",distribData);
              allocData = [];
            //  console.log("ALLOC",allocData);
              index = 0;
            }

          }
      })
      .on("end", function(){
           //Add last remainder batch
           distribData.push(allocData);
           allocData = [];

           setAllocation();
      });

  stream.pipe(csvStream);
}

if(evoDistributionAddress){
  console.log("Processing airdrop. Batch size is",BATCH_SIZE, "accounts per transaction");
  readFile();
}else{
  console.log("Please run the script by providing the address of the EvoDistribution contract");
}
