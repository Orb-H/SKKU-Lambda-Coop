const functions = require('firebase-functions');
const {
  auth,
  db,
} = require('./admin.js');
const config = functions.config();
const login = require('./login.js');
const https = require('https');
const ethereumTx = require('ethereumjs-tx');

module.exports = {
  adminSendToken: function(target, isemail, amount) {
    return new Promise(async (resolve, reject) => {
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
          "valueAmount": amount
        }
      };

      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.1/transactions/adminSend",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, (res) => {
        res.on('data', (body) => {
          resolve(body.result);
        });
      });
      req.on("error", (err) => {
        reject(err);
      });
      req.write(JSON.stringify(body));
      req.end();
    });
  },

  clientSendToken: function(privateKey, from_address, to_address, amount) {
    return new Promise((resolve, reject) => {
      const pKey = Buffer.from(privateKey, "hex");
      var data = {
        "from": from_address,
        "inputs": {
          "receiverAddress": to_address,
          "valueAmount": amount
        }
      };

      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.1/transactions/clientSend",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, (res) => {
        res.on("data", (body) => {
          const tx = new EthereumTx(body.data.rawTx);
          tx.sign(pKey);

          var new_data = {
            "signedTx": tx.serialize().toString("hex")
          }

          var new_req = https.request({
            hostname: "api.luniverse.io",
            path: "/tx/v1.1/transactions/clientSend",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + config.auth.luniverse
            }
          }, (new_res) => {
            new_res.on("data", (new_body) => {
              resolve(new_body.data.txId);
            });
          });
          new_req.on("error", (err) => {
            reject(err);
          });
          new_req.write(JSON.stringify(new_data));
          new_req.end();
        });
      });
      req.on("error", (err) => {
        reject(err);
      });
      req.write(JSON.stringify(data));
      req.end();
    });
  },

  debug_transactioncheck: functions.https.onRequest(async (req, res) => {
    var body = req.body;
    var txid = body.txid;
    var result = await module.exports.transactioncheck(txid, 0);
    res.send(result);
  }),

  transactioncheck: function(txId, targetAmount) {
    return new Promise((resolve, reject) => {
      console.error(txId + " " + targetAmount);
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
        res.on("data", body => {
          result += body;
        });
        res.on("close", () => {
          try {
            console.error(result);
            var body = JSON.parse(result);
            var data = body.data.history.txReceipt.logs[0].inputs.value;
            var to = body.data.history.txReceipt.logs[0].inputs.to;
            var amount = parseInt(data);
            var target = parseInt(targetAmount);
            if (to.toLowerCase() !== "0x04a4103cb990ecc28c6dd882b08a64f1bdb6ffc2") {
              resolve("Receiver is not system.");
            } else {
              if (amount === target) {
                resolve("Target value matches");
              } else if (amount < target) {
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
      req.on("error", () => {
        resolve("TX find error");
      });
      req.end();
    });
  },

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

  createWallet: function(privateKey) {
    return new Promise(async (resolve, reject) => {
      var data = {
        walletType: "LUNIVERSE",
        userKey: privateKey
      };

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
        res.on("data", body => {
          result += body;
        });
        res.on("close", () => {
          try {
            var body = JSON.parse(result);
            if (body.result === true) {
              var address = body.data.address;
              resolve(address);
            } else {
              throw new Error(body.message);
            }
          } catch (err) {
            reject(err);
          }
        })
      });
      req.on("error", () => {
        resolve("TX find error");
      });
      req.write(JSON.stringify(data));
      req.end();
    });
  },

  findWallet: function(privateKey) {
    return new Promise(async (resolve, reject) => {
      var data = {
        walletType: "LUNIVERSE",
        userKey: privateKey
      };

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
        res.on("data", body => {
          result += body;
        });
        res.on("close", () => {
          try {
            var body = JSON.parse(result);
            if (body.result === true) {
              var address = body.data.address;
              resolve(address);
            } else {
              throw new Error(body.message);
            }
          } catch (err) {
            reject(err);
          }
        })
      });
      req.on("error", () => {
        resolve("TX find error");
      });
      req.write(JSON.stringify(data));
      req.end();
    });
  },

  checkBalance: function(address) {
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
        res.on("data", body => {
          result += body;
        });
        res.on("close", () => {
          try {
            var body = JSON.parse(result);
            if (body.result === true) {
              var address = body.data.balance;
              resolve(address);
            } else {
              throw new Error(body.message);
            }
          } catch (err) {
            reject(err);
          }
        })
      });
      req.on("error", () => {
        resolve("TX find error");
      });
      req.end();
    });
  }
}
