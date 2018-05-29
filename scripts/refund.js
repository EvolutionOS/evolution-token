var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');

const evoDistributionArtifacts = require('../build/contracts/EvoDistribution.json');
const contract = require('truffle-contract');
let EvoDistribution = contract(evoDistributionArtifacts);
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

let evoDistributionAddress = process.argv.slice(2)[0]; // EVO Token contract address

async function setAllocation() {
    console.log(`--------------------------------------------
        ---------Performing transfer ------------
        --------------------------------------------`);

    let accounts = await web3.eth.getAccounts();

    let evoDistribution = await EvoDistribution.at(evoDistributionAddress);

    let recipient = '0xc43c3fb077dcda97c18989c3929dc53a5b78acdd'; // This is the address of the recipient or holding account that will be used to redistribute the tokens
    let token = '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0'; // Contract address of the token that should be refunded

    try{
        let gPrice = 40000000000;

        console.log("Attempting to send EOS tokens to address: ", recipient, "\n\n");

        let r = await evoDistribution.refundTokens(recipient, token, {from:accounts[0], gas:500000, gasPrice: gPrice});

        console.log("---------- ---------- ---------- ----------");
        console.log("Transfer was successful. ", r.receipt.gasUsed, " gas used. Spent: ", r.receipt.gasUsed * gPrice, "wei");
        console.log("---------- ---------- ---------- ----------\n\n")
    } catch (err){
        console.log("ERROR: ", err);
    }
}

setAllocation();
