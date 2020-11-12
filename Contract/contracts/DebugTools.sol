pragma solidity 0.5.8;

// Contract for storing modular debugging features.
contract DebugTools
{
    uint ENABLE_DEBUG_TOOLS = 0;                                // Not a constant so child classes can modify their verbose level.

    // List of events that a Dapp can listen for and console.log() output from.
    event alertFailure(string errorMessage);
    event debugPrint(string _text);
    event debugPrintUInt(string _label, uint _value);
    event debugPrintBool(string _label, bool _value);
    event debugPrintAddress(string _label, address _address);

    // Console.logs and fires an alert dialog box.
    function AlertFailure(string memory errorMessage) internal
    {
        if(1 == ENABLE_DEBUG_TOOLS)
        {
            emit alertFailure(errorMessage);
        }
    }

    // Console.logs a message.
    function DebugPrint(string memory _text) internal
    {
        if(1 == ENABLE_DEBUG_TOOLS)
        {
            emit debugPrint(_text);
        }
    }

    // Console.logs a message and uint value.
    function DebugPrintUInt(string memory _label, uint _value) internal
    {
        if(1 == ENABLE_DEBUG_TOOLS)
        {
            emit debugPrintUInt(_label, _value);
        }
    }

    // Console.logs a message and bool value.
    function DebugPrintBool(string memory _label, bool _value) internal
    {
        if(1 == ENABLE_DEBUG_TOOLS)
        {
            emit debugPrintBool(_label, _value);
        }
    }

    // Console.logs a message and a address.
    function DebugPrintAddress(string memory _label, address _address) internal
    {
        if(1 == ENABLE_DEBUG_TOOLS)
        {
            emit debugPrintAddress(_label, _address);
        }
    }
}
