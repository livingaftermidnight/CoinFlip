var web3 = new Web3(Web3.givenProvider);
var contractAddress = "0x6A51C86B9af606A06B126d0062B7709474762d07";
var contractInstance;

$(document).ready(function() {
    // This will bring up a window in Metamask asking for permission for the website to access your Metamask information (not private keys).
    window.ethereum.enable().then(function(accounts)
    {
        // abi string is a template of the specification of what the contract is (i.e. what type of functions it has, what the functions are called, what type of arguments those functions take, what they return)
        // This is so the Javascript knows what arguments and types it's going to send to the contract and what to expect in return.
        // You get the abi from the truffle project as long as you have compiled and deployed the contract first.
        // Go into your truffle project's build/contracts folder and look for <nameofcontract>.json (so People.json in this PeopleProject example) this is a generated file created by truffle when you deploy your contract
        // Copy the entire abi array that shows up at the very top of the function and paste it into a new file (called abi.js).
        // Inside abi.js set a new var abi = []; that entire array.
        //
        // address is the address of the contract so it knows where to send these requests/transactions.
        //contractInstance = new web3.eth.Contract(abi, address);
        contractInstance = new web3.eth.Contract(abi, contractAddress, {from: accounts[0]});
        console.log(contractInstance);
        console.log(contractInstance.methods);
        console.log(contractInstance.events);
        updateMetrics();

        console.log("accounts[0]: " + accounts[0]);

        // Listen for output events from the contract so you can more easily see moments execute in the code.
        contractInstance.events.debugPrint({}, function(error, printResult)
        {
            console.log("" + printResult.returnValues._text);
        });

        // Listen for uint output events from the contract so you can more easily see the value of variables in Solidity.
        contractInstance.events.debugPrintUInt({}, function(error, printResult)
        {
            console.log("" + printResult.returnValues._label + printResult.returnValues._value);
        });

        // Listen for bool output events from the contract so you can more easily see the value of variables in Solidity.
        contractInstance.events.debugPrintBool({}, function(error, printResult)
        {
            console.log("" + printResult.returnValues._label + printResult.returnValues._value);
        });

        // Listen for address output events from the contract so you can more easily see the value of variables in Solidity.
        contractInstance.events.debugPrintAddress({}, function(error, printResult)
        {
            console.log("" + printResult.returnValues._label + printResult.returnValues._address);
        });


        // Listen for errors and alert the user.
        contractInstance.events.alertFailure(function(error, details)
        {
            console.log("" + details.returnValues.errorMessage);
            alert("" + details.returnValues.errorMessage);
        });
    });
    $("#start_bet_button").click(startBet)
    $("#withdraw_button").click(withdrawMoney)
});

async function startBet(accounts)
{
    console.log("startBet clicked!");
    var wager = $("#wager_input").val();
    let prevWinnings = await contractInstance.methods.getWinnings().call();
    console.log("getWinnings() prevWinnings: " + prevWinnings);
    let formattedPrevWinnings = web3.utils.fromWei(prevWinnings.toString(), "ether");

    // TODO: We should make sure wager is in ETH.
    // TODO: Figure out how to tell if user won the coin flip.
    // TODO: Maybe store winnings in mapping and then allow the user to view winnings and provide a means to withdraw balance.

    $("#result_output").text("Waiting for Result!");
    console.log("wager: " + wager);
    console.log("web3.utils.toWei(wager.toString(), ether): " + web3.utils.toWei(wager.toString(), "ether"));
    contractInstance.methods.triggerCoinFlip().send({value: web3.utils.toWei(wager.toString(), "ether")})
    .on("transactionHash", function(hash)
    {
        console.log("Hash: " + hash);
    })
    .on("confirmation", function(confirmationNumber)
    {
        // 12 is the recommend number of confirmations on the mainnet
        // Once it reaches that we can treat the transaction as being finished and can notify the user or execute some code at that moment.
        //if(confirmationNmr > 12)
        //{
            // notify the user that the transaction has finished.
        //}
        console.log("confirmationNumber: " + confirmationNumber);
    })
    .on("receipt", async function(receipt)
    {
        // NOTE: Don't print it out like this or else you'll see [object Object] instead of the actual data in the object.
        //console.log("Receipt: " + receipt);
        console.log(receipt);
        //alert("Done");
    })
    .on("error", function(error)
    {
        console.log("triggerCoinFlip() error: ");
        console.log(error);
    });

    // First start listening for generatedRandomNumber events.
    // Listen for the event only once. This way is preferred here because everytime
    // the user places a bet, it will otherwise add another listener so then
    // after 4 bets you see the callback fire 4 times.
    //contractInstance.events.generatedRandomNumber({}, function(error, randResult)     // <-- adds event listener each time startBet() is called. This could lead to multiple of the same callback firing for one event.
    contractInstance.once('generatedRandomNumber', {}, function(error, randResult)
    {
        console.log("generatedRandomNumber event fired!");
        console.log(randResult);
        console.log("id: " + randResult.returnValues._queryId);
        console.log("result: " + randResult.returnValues._randomNumber);

        updateMetrics();

        if(randResult.returnValues._randomNumber == 1)
        {
            $("#result_output").text("You won!");
        }
        else
        {
            $("#result_output").text("You lost!");
        }
    });
}

async function updateMetrics()
{
    let currWinnings = await contractInstance.methods.getWinnings().call();
    console.log("currWinnings: " + currWinnings);
    let formattedCurrWinnings = web3.utils.fromWei(currWinnings.toString(), "ether");
    console.log("formattedCurrWinnings: " + formattedCurrWinnings);
    $("#winnings_output").text(formattedCurrWinnings);

    let blockchainBalance = await web3.eth.getBalance(contractAddress);
    console.log("blockchainBalance (wei): " + blockchainBalance);
    let formattedBalance = web3.utils.fromWei(blockchainBalance.toString(), "ether");
    console.log("blockchainBalance (eth): " + formattedBalance);
    $("#total_balance_output").text(formattedBalance);
}

async function withdrawMoney(accounts)
{
    let currWinnings = await contractInstance.methods.getWinnings().call();
    console.log("currWinnings: " + currWinnings);
    let formattedCurrWinnings = web3.utils.fromWei(currWinnings.toString(), "ether");
    console.log("Before Winnings: " + formattedCurrWinnings);

    // Since the following function (withdrawAllProfits) transfers ether to an address, you must use .send(addressToSendTo)
    // .call() is used when you are querying a function that returns a value (such as a getter)
    // You can also get accounts via web3.eth.getAccounts() which returns an array of accounts.
    await contractInstance.methods.withdrawAllProfits().send(accounts[0]).then(async function(result)
    {
        console.log(result);
        let afterWinnings = await contractInstance.methods.getWinnings().call();
        console.log("After Winnings (wei): " + afterWinnings);
        let formattedAfterWinnings = web3.utils.fromWei(afterWinnings.toString(), "ether");
        console.log("After Winnings (eth): " + formattedAfterWinnings);
        $("#winnings_output").text(formattedAfterWinnings);
        alert("Done");
    })
    .catch(function(err)
    {
        console.log("withdrawAllProfits() error: " + err);
    });
}
