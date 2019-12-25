const functions = require('firebase-functions');
const {
  auth,
  db,
} = require('./admin.js');
const config = functions.config();
const login = require('./login.js');
const https = require('https');
const ethereumTx = require('ethereumjs-tx');
const bignumber = require('bignumber.js');

const convertConstant = new bignumber.BigNumber("1000000000000000000");

module.exports = {
  // A function for admin or web page to send token to other users
  adminSendToken: function (target, isemail, amount) {
    return new Promise(async (resolve, reject) => {
      // input type can be two types, email or wallet address. if isemail is true, target is email, or target is wallet address
      if (isemail === true) {
        var query = await db.collection('login').where('email', '==', target).select("w_address").get();
        if (query.docs.length === 0) {
          reject(new Error('No such email'));
        }
        target = query.docs[0].data().w_address;
      }
      var body = {
        "inputs": {
          "receiverAddress": target,
          "valueAmount": module.exports.convertUnitToMT(amount)
        }
      };

      // call luniverse API to request adminSend
      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.1/transactions/adminSend",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, (res) => {
        result = "";
        res.on('data', (body) => result += body);
        res.on("close", () => {
          console.error(result); //LOG
          var body = JSON.parse(result);
          resolve(body.data.result);
        });
      });
      req.on("error", (err) => reject(err));
      req.write(JSON.stringify(body));
      req.end();
    });
  },

  // A function for normal users to send token to other users
  clientSendToken: function (privateKey, from_address, to_address, amount) {
    return new Promise((resolve, reject) => {
      // senders private key
      const pKey = Buffer.from(privateKey, "hex");
      var data = {
        "from": from_address,
        "inputs": {
          "receiverAddress": to_address,
          "valueAmount": module.exports.convertUnitToMT(amount)
        }
      };

      // call luniverse API to request clientSend
      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.1/transactions/clientSend",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, (res) => {
        result = ""
        res.on("data", (body) => result += body)
        res.on("close", () => {
          var body = JSON.parse(result);
          // sign transaction with sender
          const tx = new EthereumTx(body.data.rawTx);
          tx.sign(pKey);

          var new_data = {
            "signedTx": tx.serialize().toString("hex")
          }

          // call luniverse API to send signed TX
          var new_req = https.request({
            hostname: "api.luniverse.io",
            path: "/tx/v1.1/transactions/clientSend",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + config.auth.luniverse
            }
          }, (new_res) => {
            new_result = '';
            new_res.on('data', (new_body) => new_result += new_body);
            new_res.on('close', () => {
              var new_body = JSON.parse(new_result)
              resolve(new_body.data.txId);
            });
          });
          new_req.on("error", (err) => reject(err));
          new_req.write(JSON.stringify(new_data));
          new_req.end();
        });
      });
      req.on("error", (err) => reject(err));
      req.write(JSON.stringify(data));
      req.end();
    });
  },

  // check if transferred token amount is same with targetAmount
  transactioncheck: function (txId, targetAmount) {
    return new Promise((resolve, reject) => {
      console.error(txId + " " + targetAmount); // LOG
      // call luniverse API for tx histories
      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.1/histories/" + txId,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, res => {
        var result = "";
        res.on("data", body => result += body);
        res.on("close", () => {
          try {
            console.error(result);
            var body = JSON.parse(result);
            var data = body.data.history.txReceipt.logs[0].inputs.value;
            var to = body.data.history.txReceipt.logs[0].inputs.to;
            var amount = new bignumber.BigNumber(data);
            var target = new bignumber.BigNumber(targetAmount).multipliedBy(convertConstant);
            console.error(amount + " ? " + target);
            if (to.toLowerCase() !== "0x04a4103cb990ecc28c6dd882b08a64f1bdb6ffc2") { // sys address
              resolve("Receiver is not system.");
            } else { // compare target value with transferred tokens in transaction
              if (amount.isEqualTo(target)) {
                resolve("Target value matches");
              } else if (amount.comparedTo(target) < 0) {
                resolve("Too small amount");
              } else {
                resolve("Too big amount");
              }
            }
          } catch (err) {
            reject(err);
          }
        })
      });
      req.on("error", () => resolve("TX find error"));
      req.end();
    });
  },

  // a function for normal users to send tokens to other users(HTTP function)
  sendFromClient: functions.https.onRequest(async (req, res) => {
    var body = req.body;
    var pKey = body.privateKey;
    var f_address = body.from_address;
    var t_address = body.to_address;
    var amount = body.amount;

    try {
      var tx = await module.exports.clientSendToken(pKey, f_address, t_address, amount);
      res.status(200).send(tx);
    } catch (err) {
      res.status(500).send(err.message);
    }
  }),

  // a function for creating a new wallet
  createWallet: function (privateKey) {
    return new Promise(async (resolve, reject) => {
      var data = {
        walletType: "LUNIVERSE",
        userKey: privateKey // using user's own private key
      };

      // call luniverse API for creating a new wallet
      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.1/wallets",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, res => {
        var result = "";
        res.on("data", body => result += body);
        res.on("close", () => {
          try {
            var body = JSON.parse(result);
            if (body.result === true) {
              var address = body.data.address;
              resolve(address); // return address of a new wallet
            } else {
              throw new Error(body.message);
            }
          } catch (err) {
            reject(err);
          }
        })
      });
      req.on("error", () => resolve("TX find error"));
      req.write(JSON.stringify(data));
      req.end();
    });
  },

  // a function for finding wallet created by given private key
  findWallet: function (privateKey) {
    return new Promise(async (resolve, reject) => {
      var data = {
        walletType: "LUNIVERSE",
        userKey: privateKey
      };

      // call luniverse API for finding wallet
      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.1/wallets/bridge",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, res => {
        var result = "";
        res.on("data", body => result += body);
        res.on("close", () => {
          try {
            var body = JSON.parse(result);
            if (body.result === true) {
              var address = body.data.address;
              resolve(address); // return result
            } else {
              throw new Error(body.message);
            }
          } catch (err) {
            reject(err);
          }
        })
      });
      req.on("error", () => resolve("wallet find error"));
      req.write(JSON.stringify(data));
      req.end();
    });
  },

  // a function for checking balance of wallet
  checkBalance: function (address) {
    return new Promise(async (resolve, reject) => {
      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.1/wallets/" + address + "/FT9754/SKK/balance",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, res => {
        var result = "";
        res.on("data", body => result += body);
        res.on("close", () => {
          try {
            var body = JSON.parse(result);
            if (body.result === true) {
              var balance = module.exports.convertUnitToSkkoin(body.data.balance);
              resolve(balance); // return balance
            } else {
              throw new Error(body.message);
            }
          } catch (err) {
            reject(err);
          }
        })
      });
      req.on("error", () => resolve("wallet find error"));
      req.end();
    });
  },

  // convert SKKOIN unit to MT(transfer unit) unit
  convertUnitToMT: function (x) {
    var y = new bignumber.BigNumber(x);
    return y.multipliedBy(convertConstant).toFixed();
  },

  // convert MT(transfer unit) unit to SKKOIN unit
  convertUnitToSkkoin: function (x) {
    var y = new bignumber.BigNumber(x);
    return y.dividedBy(convertConstant).toFixed();
  }
}