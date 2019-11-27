const functions = require('firebase-functions');
const admin = require('firebase-admin');
const token = require('./token.js');
const {
  auth,
  db,
} = require('./admin.js');
const gifticon = require('./gifticon.js');
//클라이언트 ==================================================================
module.exports = {
  duplicate: functions.https.onRequest(async (req, res) => {
    var obj = {
      result: false,
      data: {}
    };
    if (req.method === 'POST') {
      var body = req.body;
      var email = body.email;
      try {
        var snapshot = await db.collection('login').where('email', '==', email).select('email').get();
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

  nickname: functions.https.onRequest(async (req, res) => {
    var obj = {
      result: false,
      data: {}
    };
    if (req.method === 'POST') {
      var body = req.body;
      var email = body.email;
      try {
        var snapshot = await db.collection('login').where('email', '==', email).select('nickname').get();
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

  //1. 최초 가입 : 이메일address, 닉네임, wallet address 를 받고 db와 확인후 token 지급
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
      var snapshot = await db.collection('login').where('email', '==', reqemail).select('nickname').get();
      if (!snapshot.empty) {
        error_code |= 1;
      }

      snapshot = await db.collection('login').where('nickname', '==', reqnickname).select('nickname').get();
      if (!snapshot.empty) {
        error_code |= 2;
      }

      if (error_code === 0) {
        await db.collection('login').add({
          email: reqemail,
          nickname: reqnickname,
          w_address: reqwaddress,
          recommender: false
        });
        obj.result = true;
        var sendtoken = await token.adminSendToken(reqemail, true, 1);
        res.send(obj);
      } else {
        obj.data.error_code = error_code;
        res.status(400).send(obj);
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  }),
  //2. 추천인 입력 : 추천인 입력 받아 확인 후에 맞을 시 토큰 지급
  recommend: functions.https.onRequest(async (req, res) => {
    //가입자 waddress, 추천인 waddress을 받아 db에 존재하고 본인이 아닐 경우에 각각의 사람에게 token 지급
    //U.I 쪽에서 같은 w_address 입력 못하도록 막아준다.
    var body = req.body;
    var signup_waddress = body.s_waddress;
    var re_waddress = body.r_waddress;
    var obj = {
      "result": false,
      "data": {}
    }
    var check = 0;
    let loginRef = db.collection('login');

    var snapshot = await loginRef.where('w_address', '==', re_waddress).select('nickname').get();
    if (snapshot.empty) {
      check |= 2;
    }

    snapshot = await loginRef.where('w_address', '==', signup_waddress).select('recommender').get();
    if (snapshot.empty) {
      check |= 1;
    }
    if (check === 0) {
      var doc = snapshot.docs[0];
      if (doc.data().recommender === false) {
        //존재하는 추천인이 있을때 해당하는 waddress 각각에 추천토큰 지급
        try {
          var sendtoken = await token.adminSendToken(signup_waddress, false, 1);
          var sendtoken1 = await token.adminSendToken(re_waddress, false, 1);
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
  //3. 기프티콘 구매 부분.
  //인풋값 : txhash , name, category1, category2
  //RESPONSE :
  //tx hash 가 존재하지 않음 = 1
  //토큰값이 기프티콘 가격보다 적을 경우 =2
  //토큰값이 기프티콘 가격보다 클경우 =3
  //기프티콘의 종류가 존재하지 않을 때 =4
  gifticonMain: functions.https.onRequest(async (req, res) => {
    //클라이언트로부터 해시를 받아서 검색한다
    if (req.method === 'POST') {
      var body = req.body;
      var obj = {
        "result": false,
        "data": {}
      }
      var valid_hash = await db.collection('transaction').where('transaction_hash', '==', body.txid);
      if (!valid_hash.empty) {
        console.error("txid: " + body.txid);
        obj.data.error_code = 5;
        res.status(400).send(obj);
      }
      try {
        var snapshot = await db.collection('gifticon').where('menu', '==', body.name).where('category1', '==', body.category1).where('category2', '==', body.category2).where('used', '==', false).select('price', 'image').get();
        if (snapshot.empty) {
          obj.data.error_code = 4;
          res.status(400).send(obj);
        } else {
          var doc = snapshot.docs[0];
          var giftprice = doc.data().price;
          var s = await token.transactioncheck(body.txid, giftprice);
          if (s === 'Target value matches') {
            let encodedimage = doc.data().image;
            obj.data.image = encodedimage;

            await doc.ref.set({
              used: true
            }, {
              merge: true
            });

            obj.result = true;
            await db.collection('transaction').add({
              transaction_hash: body.txid
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

  checkBalance: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      try {
        var address = await token.checkBalance(body.address);
        var obj = {
          result: true,
          balance: address
        };
        res.send(obj);
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  getGifticonTypes: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var obj = {
        result: false,
        data: {}
      };
      try {
        obj.data = await gifticon.gifticonlist();
        obj.result = true;
        res.send(obj);
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

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
  })
};
