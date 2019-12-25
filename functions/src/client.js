const functions = require('firebase-functions');
const admin = require('firebase-admin');
const token = require('./token.js');
const {
  auth,
  db,
} = require('./admin.js');
const gifticon = require('./gifticon.js');

module.exports = {
  // a function to check if email is already used for account(HTTP)
  duplicate: functions.https.onRequest(async (req, res) => {
    var obj = {
      result: false,
      data: {}
    };
    if (req.method === 'POST') {
      var body = req.body;
      var email = body.email;
      try {
        var snapshot = await db.collection('login').where('email', '==', email).select('email').get(); // find account with email
        if (!snapshot.empty) {
          obj.data.message = "Already registered email.";
          res.status(400).send(obj);
        } else {
          obj.result = true;
          res.send(obj);
        }
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  // a function returning nickname of given email(HTTP)
  nickname: functions.https.onRequest(async (req, res) => {
    var obj = {
      result: false,
      data: {}
    };
    if (req.method === 'POST') {
      var body = req.body;
      var email = body.email;
      try {
        var snapshot = await db.collection('login').where('email', '==', email).select('nickname').get(); // get nickname using email
        if (snapshot.empty) {
          obj.data.message = "No such email.";
          res.status(400).send(obj);
        } else {
          obj.result = true;
          obj.data.nickname = snapshot.docs[0].data().nickname;
          res.send(obj);
        }
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  // a function for client signup(HTTP)
  signup: functions.https.onRequest(async (req, res) => {
    var body = req.body;
    var reqemail = body.email;
    var reqwaddress = body.waddress;
    var reqnickname = body.nickname;
    var error_code = 0;
    var obj = {
      "result": false,
      "data": {}
    }
    try {
      var snapshot = await db.collection('login').where('email', '==', reqemail).select('nickname').get(); // check if email exists
      if (!snapshot.empty) {
        error_code |= 1;
      }

      snapshot = await db.collection('login').where('nickname', '==', reqnickname).select('nickname').get(); // check if nickname exists
      if (!snapshot.empty) {
        error_code |= 2;
      }

      if (error_code === 0) {
        await db.collection('login').add({ // add new account
          email: reqemail,
          nickname: reqnickname,
          w_address: reqwaddress,
          recommender: false
        });
        obj.result = true;
        var sendtoken = await token.adminSendToken(reqemail, true, 1); // bonus 1 token
        res.send(obj);
      } else {
        obj.data.error_code = error_code;
        res.status(400).send(obj);
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  }),

  // a function for recommender input(HTTP)
  recommend: functions.https.onRequest(async (req, res) => {
    var body = req.body;
    var signup_waddress = body.s_waddress;
    var re_waddress = body.r_waddress;
    var obj = {
      "result": false,
      "data": {}
    }
    var check = 0;
    let loginRef = db.collection('login');

    var snapshot = await loginRef.where('w_address', '==', re_waddress).select('nickname').get(); // find recommender's account
    if (snapshot.empty) {
      check |= 2;
    }

    snapshot = await loginRef.where('w_address', '==', signup_waddress).select('recommender').get(); // find newly registered user's account
    if (snapshot.empty) {
      check |= 1;
    }
    if (check === 0) {
      var doc = snapshot.docs[0];
      if (doc.data().recommender === false) {
        try {
          var sendtoken = await token.adminSendToken(signup_waddress, false, 1); // bonus 1 token
          var sendtoken1 = await token.adminSendToken(re_waddress, false, 1); // bonus 1 token
        } catch (err) {
          res.status(500).send(err.message);
        }

        await doc.ref.set({
          recommender: true
        }, {
          merge: true
        });

        obj.result = true;
        res.send(obj);
      } else {
        check |= 4;
      }
    }
    if (check !== 0) {
      obj.data.error_code = check;
      res.status(400).send(obj);
    }
  }),

  // a function for users buying gifticons(HTTP)
  gifticonMain: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      var obj = {
        "result": false,
        "data": {}
      }
      var valid_hash = await db.collection('transaction').where('transaction_hash', '==', body.txhash).get(); // check if TX is already used for buying gifticons
      if (!valid_hash.empty) {
        obj.data.error_code = 5;
        res.status(400).send(obj);
      }
      try {
        var snapshot = await db.collection('gifticon').where('menu', '==', body.name).where('category1', '==', body.category1).where('category2', '==', body.category2).where('used', '==', false).select('price', 'image').get(); // find gifticon with given condition
        if (snapshot.empty) {
          obj.data.error_code = 4;
          res.status(400).send(obj);
        } else {
          var doc = snapshot.docs[0];
          var giftprice = doc.data().price;
          console.error(body.txhash);
          var s = await token.transactioncheck(body.txhash, giftprice); // check transferred amount of token and compare with target value
          if (s === 'Target value matches') {
            let encodedimage = doc.data().image;
            obj.data.image = encodedimage;

            await doc.ref.set({
              used: true
            }, {
              merge: true
            });

            obj.result = true;
            await db.collection('transaction').add({ // check as used TX
              transaction_hash: body.txhash
            });
            res.send(obj);
          } else if (s === 'Too small amount') {
            obj.data.error_code = 2;
            res.status(400).send(obj);
          } else if (s === 'Too big amount') {
            obj.data.error_code = 3;
            res.status(400).send(obj);
          } else if (s === 'Tx find error') {
            obj.data.error_code = 1;
            res.status(400).send(obj);
          }
        }
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  // a function for creating new wallet(HTTP)
  createWallet: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      try {
        var address = await token.createWallet(body.privateKey);
        var obj = {
          result: true,
          address: address
        };
        res.send(obj);
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  // a function for finding wallet with private key(HTTP)
  lookupWallet: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      try {
        var address = await token.findWallet(body.privateKey);
        var obj = {
          result: true,
          address: address
        };
        res.send(obj);
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  // a function for checking balance of given wallet(HTTP)
  checkBalance: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      try {
        var balance = await token.checkBalance(body.address);
        var obj = {
          result: true,
          balance: balance
        };
        res.send(obj);
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  // a function returning list of gifticon types(HTTP, Android)
  getGifticonTypes: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var obj = {
        result: false,
        data: {}
      };
      try {
        obj.data = await gifticon.gifticonlistuser();
        obj.result = true;
        res.send(obj);
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  // a function returning detailed information of gifticon(HTTP)
  getGifticonDetail: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var obj = {
        result: false,
        data: {}
      };
      try {
        obj.data = await gifticon.gifticondetail();
        obj.result = true;
        res.send(obj);
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  // a function returning nickname with wallet address(HTTP)
  nicknamebywaddr: functions.https.onRequest(async (req, res) => {
    var obj = {
      result: false,
      data: {}
    };
    if (req.method === 'POST') {
      var body = req.body;
      var waddr = body.w_address;
      try {
        var snapshot = await db.collection('login').where('w_address', '==', waddr).select('nickname').get(); // get nickname using wallet address
        if (snapshot.empty) {
          obj.data.message = "No such email.";
          res.status(400).send(obj);
        } else {
          obj.result = true;
          obj.data.nickname = snapshot.docs[0].data().nickname;
          res.send(obj);
        }
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  })
};