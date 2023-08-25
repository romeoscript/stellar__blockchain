const sha256 = require("sha256");
const config = require("../config");
const StellarSdk = require("stellar-sdk");

// Blockchain constructor
function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];

    // Initializing with the genesis block
    this.createNewBlock(100, "0", "0");
}

// Creates a new block and adds it to the chain
Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, Hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timeStamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: Hash,
        previousBlockHash: previousBlockHash,
    };
    this.pendingTransactions = [];
    this.chain.push(newBlock);
    return newBlock;
};

// Returns the last block in the chain
Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
};

// Creates a new transaction and adds it to pendingTransactions
Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
    };
    this.pendingTransactions.push(newTransaction);
    return this.getLastBlock()["index"] + 1;
};

// Computes the hash for a block
Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
    const dataAsString =
        previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
};

// Implements the proof of work algorithm
Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== "0000") {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        console.log(hash);
    }
    return nonce;
};

Blockchain.prototype.issueStellarAsset = function() {
  const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
  
  const issuingKeys = StellarSdk.Keypair.fromSecret(config.accounts.issuer.secret);
  const receivingKeys = StellarSdk.Keypair.fromSecret(config.accounts.distributor.secret);
  
  const romeoscript = new StellarSdk.Asset("Romeoscript", issuingKeys.publicKey());
  console.log("Initialized the asset and server configurations.");

  // First, the receiving account must trust the asset
  console.log("Loading receiving account...");
  server.loadAccount(receivingKeys.publicKey())
      .then(function (receiver) {
          console.log("Building trust transaction...");
          const transaction = new StellarSdk.TransactionBuilder(receiver, {
              fee: 100,
              networkPassphrase: StellarSdk.Networks.TESTNET,
          })
          .addOperation(StellarSdk.Operation.changeTrust({
              asset: romeoscript,
              limit: "1000",
          }))
          .setTimeout(100)
          .build();
          transaction.sign(receivingKeys);
          console.log("Submitting trust transaction...");
          return server.submitTransaction(transaction);
      })
      .then(function (response) {
          console.log("Trust transaction result:", response);
          console.log("Loading issuing account...");
          return server.loadAccount(issuingKeys.publicKey());
      })
      .then(function (issuer) {
          console.log("Building payment transaction...");
          const transaction = new StellarSdk.TransactionBuilder(issuer, {
              fee: 100,
              networkPassphrase: StellarSdk.Networks.TESTNET,
          })
          .addOperation(StellarSdk.Operation.payment({
              destination: receivingKeys.publicKey(),
              asset: romeoscript,
              amount: "10",
          }))
          .setTimeout(100)
          .build();
          transaction.sign(issuingKeys);
          console.log("Submitting payment transaction...");
          return server.submitTransaction(transaction);
      })
      .then(function (response) {
          console.log("Payment transaction result:", response);
      })
      .catch(function (error) {
          console.error("Error!", error);
      });
}



module.exports = Blockchain;
