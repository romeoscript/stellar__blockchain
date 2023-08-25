const Blockchain = require('./blockchain');

// Initialize blockchain
const myBlockchain = new Blockchain();

// Test creating a new transaction
myBlockchain.createNewTransaction(100, 'ADDRESS1', 'ADDRESS2');

// Test mining a block
const lastBlock = myBlockchain.getLastBlock();
const previousBlockHash = lastBlock['hash'];
const currentBlockData = {
    transactions: myBlockchain.pendingTransactions,
    index: lastBlock['index'] + 1
};
const nonce = myBlockchain.proofOfWork(previousBlockHash, currentBlockData);
const blockHash = myBlockchain.hashBlock(previousBlockHash, currentBlockData, nonce);
const newBlock = myBlockchain.createNewBlock(nonce, previousBlockHash, blockHash);

console.log("New Block mined: ", newBlock);

// Test issuing Stellar Asset
myBlockchain.issueStellarAsset();
