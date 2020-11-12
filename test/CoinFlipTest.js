const CoinFlip = artifacts.require("CoinFlip");
const truffleAssert = require("truffle-assertions");

contract("CoinFlip", async function(accounts)
{
    let instance;

    // If you add a before function in your test contract then this function will run at the start of ANY test in the contract.
    /*before(async function()
    {
        instance = await CoinFlip.deployed();
    });*/

    // If you add a beforeEach function in your test contract then this function will run at the start of EVERY test in the contract.
    // After using this, you could go through each test and remove the let instance = await People.deployed(); line to clean up the test contract code.
    beforeEach(async function()
    {
        instance = await CoinFlip.new();
        instance.fundContract({value: 100, from:accounts[0]});
    })

    // There is also after() which runs once after all of the tests are done and afterEach() which runs after each test is done.

    // This test will PASS if you call createPerson with an age over 150 years,
    // because we are testing if the require statements in the createPerson() function fail properly with bad values.
    it("shouldn't allow coinflip with no bet", async function()
    {
        // BEFORE EACH function runs here at the start of each test.
        await truffleAssert.fails(instance.triggerCoinFlip({value: web3.utils.toWei("0", "ether")}), truffleAssert.ErrorType.REVERT);
    });
    /*it("should have a balance greater than the bet times 2", async function()
    {
        let balance = await instance.balance();
        let floatBalance = parseFloat(floatBalance);
        console.log("Balance: " + floatBalance);
        await truffleAssert.fails(instance.createPerson("Bob", 50, 190, {value: 1000}), truffleAssert.ErrorType.REVERT);
    });*/
    it("balance in contract should match balance on blockchain", async function()
    {
        let beforeBalance = await instance.balance();
        console.log("Before Balance: " + parseFloat(beforeBalance));
        console.log("Before Sending 10 Wei: " + web3.utils.toWei("10", "wei"));
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")}).then(async function()
        {
            let currentBalance = await instance.balance();
            let currentFloatBalance = parseFloat(currentBalance);
            console.log("Current Balance: " + currentFloatBalance);
            let blockchainBalance = await web3.eth.getBalance(instance.address);
            console.log("Blockchain Balance: " + blockchainBalance);
            assert(currentFloatBalance == blockchainBalance, "Balance in contract does not match balance on blockchain!");
        });
    });
    it("should allow users to withdraw all winnings", async function()
    {
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")});
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")});
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")});
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")});
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")});
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")});
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")});
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")});
        await instance.triggerCoinFlip({value: web3.utils.toWei("10", "wei")});
        let currentBalance = await instance.balance();
        let currentFloatBalance = parseFloat(currentBalance);
        console.log("Current Balance: " + currentFloatBalance);
        let beforeWinnings = await instance.getWinnings();
        console.log("Before Winnings: " + beforeWinnings);
        if(beforeWinnings > 0)
        {
            var totalWithdrawnWinnings = await instance.withdrawAllProfits();
            let afterBalance = await instance.balance();
            let afterFloatBalance = parseFloat(afterBalance);
            console.log("After Balance: " + afterFloatBalance);
            let totalWinnings = await instance.getWinnings();
            console.log("After Winnings: " + totalWinnings);
        }
    });
});
