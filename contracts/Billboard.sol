pragma solidity ^0.4.15;

contract Billboard {
  struct Message {
    string content;
    address owner;
  }

  Message current;
  uint timelimit;
  address fundsWallet;

  function Billboard() public {
    current = Message("example message", msg.sender);
    timelimit = now + 5;
    fundsWallet = msg.sender;
  }

  function isAvailable() public view returns (bool){
    return now > timelimit;
  }

  modifier expired() {
    require(isAvailable());
    _;
  }

  function bid(string _message) payable public expired {
    current.content = _message;
    timelimit = now + calcTime(msg.value);
    // transfer to wallet
    fundsWallet.transfer(msg.value);
  }

  function calcTime(uint _value) internal pure returns (uint){
    return (_value / 10**18) * 1 minutes;
  }

  function getTimeLeft() public view returns (uint){
    if(isAvailable()){
      return 0;
    } else {
      return timelimit - now;
    }
  }

  function getMessage() public view returns (string){
    if(isAvailable()){
      return "";
    } else {
      return current.content;
    }
  }

  function getMessageHash() public view returns (bytes32){
    return keccak256(current.content);
  }

}
