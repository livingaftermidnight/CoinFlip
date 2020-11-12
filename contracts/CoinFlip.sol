pragma solidity 0.5.8;

import "./Ownable.sol";
import "./DebugTools.sol";
//import "./provableAPI.sol";
import "./provableAPI_0.5.sol";
//import "github.com/provable-things/ethereum-api/provableAPI.sol";
//import "https://github.com/provable-things/ethereum-api/blob/master/provableAPI_0.5.sol";

contract CoinFlip is Ownable, usingProvable, DebugTools
{
    uint constant DISABLE_ORACLE = 0;           // Set this to 1 if you want to test locally (non-Ropsten).
    uint constant QUERY_EXECUTION_DELAY = 0;
    uint constant NUM_RANDOM_BYTES_REQUESTED = 1;
    uint constant GAS_FOR_CALLBACK = 200000;

    struct Bet
    {
        address player;
        uint256 betAmount;
    }

    mapping (bytes32 => Bet) private Betting;     // Map of players and their bet amounts that are waiting for a random number from the oracle.
    mapping (address => bool) private Waiting;    // Map of player addresses that are waiting to get bet results.
    mapping (address => uint) private Winnings;   // Map of player addresses and their earnings.
    uint public balance;                          // Total liquidity of the contract.
    uint public latestNumber;
    event generatedRandomNumber(bytes32 _queryId, uint _randomNumber);

    constructor() public
    {
        ENABLE_DEBUG_TOOLS = 1;                   // Set this to 1 if you want to see DebugTools debugPrints
        if(0 == DISABLE_ORACLE)
        {
            provable_setProof(proofType_Ledger);
        }
        balance = 0;
    }

    function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public
    {
        bool allowContinue = true;

        if(0 == DISABLE_ORACLE)
        {
            require(msg.sender == provable_cbAddress());
            if(provable_randomDS_proofVerify__returnCode(_queryId, _result, _proof) != 0)
            {
                // Proof verification failed.
                AlertFailure("Proof verification failed. Please try again.");
                Bet memory currBet = Betting[_queryId];
                Waiting[currBet.player] = false;
                delete Betting[_queryId];

                allowContinue = false;
            }
        }

        if(allowContinue)
        {
            // Final result of random number creation (0-255 % 2 == 0 || 1)
            uint randomNumber = uint256(keccak256(abi.encodePacked(_result))) % 2;
            latestNumber = randomNumber;
            handleFlippedResult(_queryId, randomNumber);
            emit generatedRandomNumber(_queryId, randomNumber);
        }
    }

    function random() public view returns (uint)
	{
		// Takes block timestamp found in keyword "now" and mods by 2.
        // Completely predictable and not great for production code.
        // TODO: Replace with oracle solution in Phase 2. ;)
		return now % 2;
	}

    // Need owner to send money to contract at start.
    function fundContract() public payable onlyOwner
    {
        balance += msg.value;
    }

    // Trigger the coin flip and store the betting information so we can retrieve it later after
    // the oracle gives us a random number.
    function triggerCoinFlip() public payable
    {
        DebugPrintUInt("triggerCoinFlip() msg.value: ", msg.value);
        DebugPrintUInt("triggerCoinFlip() balance: ", balance);
        // User has to bet something.
        require(msg.value >= 1 wei, "User has to bet something.");

        // Contract needs to have a non-zero balance.
        require(balance > 0, "Contract needs to have a non-zero balance.");

        // Contract needs to have a balance greater than the incoming bet times 2.
        require(balance >= (msg.value * 2), "Contract needs to have a balance greater than the incoming bet times 2.");

        // User has to not already be in the middle of a bet to play.
        bool isWaiting = Waiting[msg.sender];
        DebugPrintBool("isWaiting: ", isWaiting);
        require(false == isWaiting, "User has to not already be in the middle of a bet to play.");
        if(false == isWaiting)
        {
            // Start of bet so add bet amount to our balance.
            balance += msg.value;

            // Phase 1: Inadequate randomization solution.
            //uint randomizeInt = random();

            // Start the oracle process to provide a randomized number.
            bytes32 queryId = 0;
            if(1 == DISABLE_ORACLE)
            {
                // Phase 2: Inadequate local randomization solution.
                // Senders address will always be unique so hash it and use it as our queryId.
                queryId = bytes32(keccak256(abi.encodePacked(msg.sender)));
            }
            else
            {
                // Phase 2: Adequate oracle randomization solution
                // Call upon the mighty oracle and receive your penance... Or just a queryId.
                queryId = provable_newRandomDSQuery(
                    QUERY_EXECUTION_DELAY,
                    NUM_RANDOM_BYTES_REQUESTED,
                    GAS_FOR_CALLBACK
                );
            }

            //emit LogNewProvableQuery("Provable query was sent, standing by for result");
            Betting[queryId] = Bet( { player: msg.sender, betAmount: msg.value } );

            if(Winnings[msg.sender] != 0)
            {
                DebugPrintUInt("triggerCoinFlip() Welcome Back old Friend! Your previous winnings are: ", Winnings[msg.sender]);
            }

            Waiting[msg.sender] = true;

            DebugPrintUInt("betAmount: ", msg.value);

            if(1 == DISABLE_ORACLE)
            {
                __callback(queryId, "0", bytes("test"));
            }
        }
    }

    // This function is meant to be called once the random number from the Oracle is known.
    function handleFlippedResult(bytes32 id, uint result) public
    {
        DebugPrintUInt("flipResult: ", result);
        DebugPrintUInt("balance before: ", balance);
        //emit debugPrintUInt("address(this).balance before: ", address(this).balance);
        Bet memory currBet = Betting[id];

        DebugPrintAddress("handleFlippedResult() currBet.player: ", currBet.player);
        DebugPrintUInt("handleFlippedResult() currBet.betAmount: ", currBet.betAmount);
        require(currBet.betAmount >= 1 wei, "User has to bet something.");

        Waiting[currBet.player] = false;

        // User doubled their money!
        if(result == 1)
        {
            // msg.value contains the bet amount so double it and send it back to the user.
            uint doubledBet = currBet.betAmount * 2;

            // Balance cannot go negative.
            require((balance - doubledBet) >= 0, "Balance cannot go negative.");

            // Subtract winnings from total balance.
            balance -= doubledBet;

            // Balance cannot go negative.
            require(balance >= 0, "Balance cannot go negative.");

            // Store the players winnings in a mapping.
            uint currentWinnings = Winnings[currBet.player];
            currentWinnings += doubledBet;
            Winnings[currBet.player] = currentWinnings;

            DebugPrintUInt("balance after: ", balance);
            //emit debugPrintUInt("address(this).balance after: ", address(this).balance);
            DebugPrintUInt("currentWinnings: ", currentWinnings);
            DebugPrintUInt("Winnings[currBet.player]: ", Winnings[currBet.player]);
        }
        else
        {
            // User lost all bet money.
        }

        delete Betting[id];
    }

    function getWinnings() public view returns(uint)
    {
        return Winnings[msg.sender];
    }

    // The following function must return string over uint because these are big numbers and the
    // result ends up being [object Object] when returning uint
    function withdrawAllProfits() public
    {
        uint toTransfer = Winnings[msg.sender];
        require(toTransfer > 0, "Transfer amount must be greater than zero.");
        Winnings[msg.sender] = 0;
        require(Winnings[msg.sender] == 0, "Winnings should now be zero.");

        // TODO: maybe hide transfer() call under toTransfer > 0 checks. Then try hitting Withdraw Winnings with no balance and see if it still brings up Metamask.
        // Maybe alert("You have no balance") on that?

        // transfer() hardcodes the gas amount (a response due to the DAO hack back in the day - the fixed 2300 gas amount was thought to reduce the number of operations that could be run after transferring)
        msg.sender.transfer(toTransfer);

        // The following transfer method is preferred because gas is NOT constant so 2300 gas isn't always enough.
        // WARNING: Higher chance of reentrancy with this approach so make sure you guard your code when you use this.
        //(bool success, ) = msg.sender.call.value(toTransfer)(" ");
        //require(success, "Transfer failed.");
    }
}
