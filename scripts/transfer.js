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
  web3 = new Web3(new Web3.providers.HttpProvider("http://192.168.0.12:7545"));
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

async function setAllocation() {
  console.log(`--------------------------------------------
    ---------Performing allocations ------------
    --------------------------------------------`);

  let accounts = await web3.eth.getAccounts();

  let evoDistribution = await EvoDistribution.at(evoDistributionAddress);

  let evotokenAddress = await evoDistribution.EVO({from:accounts[0]});
  let evoToken = await EvoToken.at(evotokenAddress);

  // Adrian (): Let's approve the transaction
  /**let gPrice2 = 20000000000;
  var appr = await evoToken.approve('0x9Ce5129b8BB7cD86288d292856cD04c3F453e7EC', 10, {from:'0x8616788B2329d800e49dF70d863A40D753f6d714', gas:6721975, gasPrice: gPrice2});
  console.log(appr);

  // Adrian (): Transfer from
  var events = await evoToken.transferFrom('0x8616788B2329d800e49dF70d863A40D753f6d714', '0x7D2c42C4Bf9b24a46A280512a7Bd9a81e27191af', 50, {from:'0x9Ce5129b8BB7cD86288d292856cD04c3F453e7EC', gas:6721975, gasPrice: gPrice2});
  console.log(events);**/

  // Adrian (): Regular transfer
  try{
    let amountToSend = 50 * 1e18;
    let gPrice2 = 20000000000;

    var events = await evoToken.transfer('0x2b9936C587C022b6aEE49DD9785640E35f5E7abe', amountToSend, {from:accounts[0], gas:6721975, gasPrice: gPrice2});
    console.log(events);
  } catch (err){
    console.log("ERROR: ", err);
  }
}

setAllocation();
