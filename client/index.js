/* globals web3 */

let Web3 = require('web3')
let contract = require('truffle-contract');

let abi = require('../build/contracts/Billboard.json');

let Contract;
let contractAddr = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';

const toWei = eth => eth * Math.pow(10, 18);

let _id = 0;
const forceMine = (cb) => {
  cb = cb || function(){};
  return web3.currentProvider.sendAsync({
    jsonrpc: "2.0",
    method: "evm_mine",
    params: [],
    id: ++_id
  }, cb);
}

const _getMessage = (contract) => () => contract.getMessage();
const _getAvailable = (contract) => () => contract.isAvailable();
const _getTimeLeft = (contract) => () => contract.getTimeLeft();
const _bid = (contract, account) => (value, message) => {
  return contract.bid.sendTransaction(message, {
    value: toWei(value),
    to: contract.address,
    from: account
  });
}

async function runner(){
  const messageEl = document.querySelector('[data-hook="message"]');
  const emptyMessageEl = document.querySelector('[data-hook="empty-message"]');
  const dateEl = document.querySelector('[data-hook="date"]');
  const debugEl = document.querySelector('[data-hook="debug"]');
  const form = document.querySelector('[data-hook="form"]');
  const submit = document.querySelector('[data-hook="bid-button"]');

  const mmWeb3 = window.web3;
  const web3 = new Web3(mmWeb3.currentProvider)
  Contract = contract(abi);
  Contract.setProvider(mmWeb3.currentProvider);

  const accounts = await web3.eth.getAccounts();
  const instance = await Contract.at(contractAddr);

  const bid = _bid(instance, accounts[0]);
  const getMessage = _getMessage(instance);
  const getTimeLeft = _getTimeLeft(instance);
  const getAvailable = _getAvailable(instance);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = form.querySelector('[name="message"]').value;
    const value = form.querySelector('[name="value"]').value;
    if(msg && value) bid(value, msg).then(a => {
      debugEl.textContent = a;
    }, err => {
      debugEl.textContent = err;
      throw err;
    })
  });

  getAvailable().then(available => {
    if(available){
      submit.disabled = false;
    } else {
      submit.disabled = true;
    }
  });
  getMessage().then((msg) => {
    if(msg === ''){
      emptyMessageEl.style.display = 'block';
      messageEl.style.display = 'none';
    } else {
      emptyMessageEl.style.display = 'none';
      messageEl.style.display = 'block';
      messageEl.textContent = msg;
    }
  });

  getTimeLeft().then(date => {
    dateEl.textContent = `Expires: ${date}`;
  });



window.onload = runner;
window.forceMine = forceMine;
