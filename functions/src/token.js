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
  adminSendToken: function(email, amount) {
    return new Promise(async (resolve, reject) => {
      var query = await db.collection('login').where('email', '==', email).select("w_address").get();
      if (query.docs.length === 0) {
        reject(new Error('No such email'));
      }

      var data = query.docs[0].data();
      var body = {
        "inputs": {
          "receiverAddress": data.w_address,
          "valueAmount": amount
        }
      };

      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.0/transactions/adminSend",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, (res) => {
        res.on('data', (body) => {
          resolve(body.data.txId);
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
        path: "/tx/v1.0/transactions/clientSend",
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
            path: "/tx/v1.0/transactions/clientSend",
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

  transactioncheck: function(txId, targetAmount) {
    return new Promise((resolve, reject) => {
      var req = https.request({
        hostname: "api.luniverse.io",
        path: "/tx/v1.0/histories/" + txId,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.auth.luniverse
        }
      }, res => {
        res.on("data", body => {
          try {
            var data = body.data.history.txReceipt.logs[0].inputs.value;
            var amount = parseInt(data);
            var target = parseInt(targetAmount);
            if (amount === target) {
              resolve("Target value matches");
            } else if (amount < target) {
              resolve("Too small amount");
            } else {
              resolve("Too big amount");
            }
          } catch (err) {
            reject(err);
          }
        });
        req.on("error", () => {
          resolve("TX find error");
        });
        req.end();
      });
    })
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
  })
}
