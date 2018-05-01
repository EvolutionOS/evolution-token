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

async function listAllocations() {
    let accounts = await web3.eth.getAccounts();
    let evoDistribution = await EvoDistribution.at(evoDistributionAddress);

    let evotokenAddress = await evoDistribution.EVO({from:accounts[0]});

    let evoToken = await EvoToken.at(evotokenAddress);
    //console.log(evoToken);
    let count = 0;
    let bal = await evoToken.balanceOf(evoDistribution.address);

    var events = await evoToken.Transfer({from: evoDistribution.address},{fromBlock: 0, toBlock: 'latest'});
    events.get(function(error, log) {
        event_data = log;
        console.log("Retrieving logs to inform total amount of tokens distributed so far. This may take a while...")

        //console.log(log);
        for (var i=0; i<event_data.length;i++){
            let tokens = event_data[i].args.value.times(10 ** -18).toString(10);
            let addressB = event_data[i].args.to;
            //console.log(`Distributed ${tokens} EVO to address ${addressB}`);
            count++;
        }
        console.log(`Successfully airdropped ${count*250} EVO to ${count} addresses`);
    });

}

if(evoDistributionAddress){
  listAllocations();
}else{
  console.log("Please run the script by providing the address of the EvoDistribution contract");
}
