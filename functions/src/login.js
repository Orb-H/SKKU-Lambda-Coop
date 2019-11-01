const functions = require('firebase-functions');
const {
  auth,
  db,
} = require('./admin.js');
const config = functions.config();

module.exports = {
  adminlogin: functions.https.onRequest(async (req, res) => {
    var body = req.body;
    if (req.method === 'POST') {
      try {
        var obj = {
          "result": true,
          "data": {}
        };
        var isadmin = await module.exports.checkadmin(body.token);
        obj.result = isadmin;
        if (isadmin) {
          res.status(200);
        } else {
          obj.data.message = "Not an authorized user.";
          res.status(401);
        }
        res.send(JSON.stringify(obj));
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send();
    }
  }),

  getApiKey: functions.https.onRequest(async (req, res) => {
    var body = req.body;
    if (req.method === 'POST') {
      try {
        var obj = {
          "result": true,
          "data": {}
        }
        var isadmin = await module.exports.checkadmin(body.token);
        obj.result = isadmin;
        if (isadmin) {
          obj.data.key = config.auth.luniverse;
          res.status(200);
        } else {
          obj.data.message = "Not an authorized user.";
          res.status(401);
        }
        res.send(JSON.stringify(obj));
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  checkadmin: function(token) {
    return new Promise((resolve, reject) => {
      auth.verifyIdToken(token).then((decodedToken) => {
        let uid = decodedToken.uid;
        if (uid === config.auth.system) {
          resolve(true);
        } else {
          throw new Error("Invalid uid");
        }
        return uid;
      }).catch((error) => {
        resolve(false);
      });
    });
  }
}
