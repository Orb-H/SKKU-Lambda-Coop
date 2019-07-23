const functions = require('firebase-functions');
const {
  auth,
  db,
} = require('./admin.js');

module.exports = {
  adminlogin: functions.https.onRequest((req, res) => {
    var body = req.body;
    if (req.method === 'POST') {
      module.exports.checkadmin(body.token).then((admin) => {
        if (admin) {
          res.send("true");
        } else {
          res.send("false");
        }
        return admin;
      }).catch((error) => {});
    }
  }),

  getApiKey: functions.https.onRequest((req, res) => {
    var body = req.body;
    if (req.method === 'POST') {
      module.exports.checkadmin(body.token).then((admin) => {
        if (admin) {
          res.send(process.env.luniverse);
        } else {
          res.status(401).send('');
        }
        return admin;
      }).catch((error) => {});
    }
  }),

  checkadmin: function(token) {
    return new Promise((resolve, reject) => {
      auth.verifyIdToken(token).then((decodedToken) => {
        let uid = decodedToken.uid;
        if (uid === process.env.system) {
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
