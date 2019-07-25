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
      req.write(JSON.stringify(body))
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
              return "success";
            });
          });
          new_req.on("error", (err) => {
            throw err;
          });
          new_req.write(JSON.stringify(new_data));
        });
      });
      req.on("error", (err) => {
        throw err;
      });
      req.write(JSON.stringify(data));
    });
  }
}
