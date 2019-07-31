const functions = require('firebase-functions');
const admin = require('firebase-admin');
const token = require('./token.js');
const {
  auth,
  db,
} = require('./admin.js');
//클라이언트 ==================================================================
module.exports = {
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
      var snapshot = await db.collection('login').where('email', '==', reqemail).get();
      if (!snapshot.empty) {
        error_code |= 1;
      }

      snapshot = await db.collection('login').where('nickname', '==', reqnickname).get();
      if (!snapshot.empty) {
        error_code |= 2;
      }

      if (error_code === 0) {
        await db.collection('login').add({
          email: reqemail,
          nickname: reqnickname,
          w_addresss: reqwaddress
        })
        obj.result = true;
        var sendtoken = await token.adminSendToken(reqemail, 1);
        res.send(JSON.stringify(obj));
      } else {
        obj.data.error_code = error_code;
        res.status(400).send(JSON.stringify(obj));
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

    var snapshot = await loginRef.where('w_address', '==', re_waddress).get();
    if (snapshot.empty) {
      check = 2;
    }

    snapshot = await loginRef.where('w_address', '==', signup_waddress).get();
    if (snapshot.empty) {
      check |= 1;
      obj.data.error_code = check;
      res.send(400).send(JSON.stringify(obj));
    } else {
      var doc = snapshot.docs[0];
      if (doc.data().recommender === false) {
        //존재하는 추천인이 있을때 해당하는 waddress 각각에 추천토큰 지급
        var sendtoken = await token.adminSendToken(signup_waddress, 1);
        var sendtoken1 = await token.adminSendToken(re_waddress, 1);

        let setWithOptions = doc.set({
          recommender: true
        }, {
          merge: true
        });

        obj.result = true;
        res.send(JSON.stringify(obj));
      } else {
        obj.data.error_code |= 4;
        res.send(400).send(JSON.stringify(obj));
      }
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
      try {
        var dbquery = db.collection('gifticon')
          .where('name', '==', data.name)
          .where('category1', '==', data.category1)
          .where('category2', '==', data.category2)
          .get()
          .then(async snapshot => {
            if (snapshot.empty) {
              //해당 기프티콘이 업을 때
              obj.data.error_code = 4;
              res.send(400).send(JSON.stringify(obj));
            } else {
              var giftprice = dbquery.doc.price;
              if (token.transactioncheck(body.txhash, giftprice) === 'Target value matches') {
                for (var doc of snapshot.docs) {
                  if (doc.data().used === false) {
                    let encodedimage = doc.data().image.toString('base64');
                    obj.data.image.push({
                      image: encodedimage,
                    });

                    let setWithOptions2 = doc.set({
                      recommend: true
                    }, {
                      merge: true
                    });

                    obj.result = true;
                    break;
                  }
                }
                await db.collection('transaction').add({
                  transaction_hash: txhash
                });
                res.send(JSON.stringify(obj));
              } else if (token.transactioncheck(body.txhash, giftprice) === 'Too small amount') {
                obj.data.error_code = 2;
                res.send(400).send(JSON.stringify(obj));
              } else if (token.transactioncheck(body.txhash, giftprice) === 'Too big amount') {
                obj.data.error_code = 3;
                res.send(400).send(JSON.stringify(obj));
              } else if (token.transactioncheck(body.txhash, giftprice) === 'Tx find error') {
                obj.data.error_code = 1;
                res.send(400).send(JSON.stringify(obj));
              }
            }
            return 1;
          });
      } catch (err) {
        res.status(500).send(err.message);
      }
    }
  })
};
