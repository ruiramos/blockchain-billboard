var Billboard = artifacts.require("./Billboard.sol");
const ethBalance = (address) => web3.eth.getBalance(address).toNumber();
const ethToWei = (e) => web3.toWei(e, "ether");
const timeController = (() => {
  const addSeconds = (seconds) => new Promise((resolve, reject) =>
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [seconds],
      id: new Date().getTime()
    }, (error, result) => error ? reject(error) : resolve(result.result)));

  const addDays = (days) => addSeconds(days * 24 * 60 * 60);
  const currentTimestamp = () => web3.eth.getBlock(web3.eth.blockNumber).timestamp;

  return {
    addSeconds,
    addDays,
    currentTimestamp
  };
})();
const forceMine = () => new Promise((resolve, reject) => {
  return web3.currentProvider.sendAsync({
    jsonrpc: "2.0",
    method: "evm_mine",
    params: [],
    id: new Date().getTime()
  }, (error, result) => error ? reject(error) : resolve(result.result));
});

contract('Billboard', function(accounts) {
  const fundsWallet = accounts[0];
  const anotherWallet = accounts[2];

  console.log('funds', fundsWallet);
  console.log('second', anotherWallet);

  const deployContract = () => Billboard.new();

  it("should initialize the contract with the default message", async function() {
    const instance = await deployContract();

    const message = await instance.getMessage.call();
    assert.equal(message.valueOf(), "example message", "the message was not correctly initialized");

    const available = await instance.isAvailable.call();
    assert.equal(available, false, "the billboard is available");

    const timeleft = await instance.getTimeLeft.call();
    assert.ok(+timeleft.valueOf() > 0, "timedif is not > 0");
    assert.ok(+timeleft.valueOf() === 5, "timedif is not === 5 secs");
  });

  it("should reject transactions when the billboard is not available yet", async function(){
    const instance = await deployContract();

    try {
      const result = await instance.bid.sendTransaction("test", {
        from: anotherWallet,
        value: ethToWei(1),
        to: instance.address
      });
      assert.ok(false, "the transaction didn't fail as it was supposed to");
    } catch(e){
      assert.ok(true, "transaction succeeded");
    }

  });

  it("should free up the billboard after 5 seconds", async function(){
    const instance = await deployContract();

    await timeController.addSeconds(10);
    await forceMine();

    const message = await instance.getMessage.call();
    const available = await instance.isAvailable.call();
    const timeleft = await instance.getTimeLeft.call();

    assert.equal(message.valueOf(), "", "the message was not correctly cleared");
    assert.equal(available, true, "the billboard is not available");
    assert.ok(timeleft.valueOf() == 0, "timedif is not == 0");
  });

  it("should accept a new message after the billboard is free", async function(){
    const instance = await deployContract();
    const initialBalance = ethBalance(fundsWallet);

    await timeController.addSeconds(10);
    await forceMine();

    try {
      const result = await instance.bid.sendTransaction("this new thing", {
        from: anotherWallet,
        value: ethToWei(1),
        to: instance.address
      });
      assert.ok(true, "the transaction didn't succeed");
    } catch(e){
      assert.ok(false, "transaction failed");
    }

    const message = await instance.getMessage.call();
    const available = await instance.isAvailable.call();
    const timeleft = await instance.getTimeLeft.call();
    const balance = ethBalance(fundsWallet);

    assert.equal(message.valueOf(), "this new thing", "the message was not correctly set");
    assert.equal(available, false, "the billboard is available");
    assert.ok(+timeleft.valueOf() == 60, "timedif is not == 5");

    assert.equal(initialBalance + +ethToWei(1), balance, "balance doesnt match");

  });
});
