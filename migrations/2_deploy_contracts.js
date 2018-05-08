var EvoToken = artifacts.require('./EvoToken.sol');
var EvoDistribution = artifacts.require('./EvoDistribution.sol');

module.exports = async (deployer, network) => {
  let _now = Date.now();
  let _fromNow = 60 * 60 * 1000; // Start distribution in 1 hour
  let _startTime = (_now + _fromNow) / 1000;
  await deployer.deploy(EvoDistribution, _startTime);
  console.log(`
    ---------------------------------------------------------------
    --------- EVOLUTION (EVO) TOKEN SUCCESSFULLY DEPLOYED ---------
    ---------------------------------------------------------------
    - Contract address: ${EvoDistribution.address}
    - Distribution starts in: ${_fromNow/1000/60} minutes
    - Local Time: ${new Date(_now + _fromNow)}
    ---------------------------------------------------------------
  `);
};
