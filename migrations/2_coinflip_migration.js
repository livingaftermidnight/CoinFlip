const CoinFlip = artifacts.require("CoinFlip");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(CoinFlip).then(function(instance)
  {
      instance.fundContract({value: 10000000000000000, from: /*"0x241402AcdbE635355b2aA37D266d954A7551244B"*/ accounts[0]}).then(async function()
      {
          console.log("Success");
          let currentBalance = await instance.balance();
          let currentFloatBalance = parseFloat(currentBalance);
          console.log("currentBalance: " + currentFloatBalance);

      }).catch(function(err)
      {
          console.log("error: " + err);
      });
  })
};
