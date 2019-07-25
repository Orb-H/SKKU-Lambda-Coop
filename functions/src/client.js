const functions = require('firebase-functions');
const admin = require('firebase-admin');
const token = require('./token.js');
//클라이언트 ==================================================================

module.exports = {
  //1. 최초 가입 : 이메일address, 닉네임, wallet address 를 받고 db와 확인후 token 지급
  signup: functions.https.onRequest((req, res) => {
    var body = req.body;
    var reqemail = body.email;
    var reqwaddress = body.waddress;
    var reqnickname = body.nickname;
    try{
      await db.collection('login').add({
        email: reqemail,
        nickname: reqnickname,
        w_addresss: reqwaddress
      }).then(ref=>{
        res.send("true");
        var sendtoken = await token.adminSendToken(reqemail,1);
      
      })
    }catch(err) {

      res.status(500).send(err.message);
    }
  }),
  //2. 추천인 입력 : 추천인 입력 받아 확인 후에 맞을 시 토큰 지급
  recommend: functions.https.onRequest((req, res) => {
  //가입자 waddress, 추천인 waddress을 받아 db에 존재하고 본인이 아닐 경우에 각각의 사람에게 token 지급
  //U.I 쪽에서 같은 w_address 입력 못하도록 막아준다. 
  var body =req.body;
    var signup_waddress = body.s_waddress;
    var re_waddress = body.r_waddress;
    let loginRef = db.collection('login');
    let query = await loginRef.where('w_address','==', re_waddress).get()                      
          .then(snapshot =>{
              if(snapshot.empty){
                res.status(404).send("false");
              }
              else{
                let loginRef = db.collection('login');
                let query2 = await loginRef.where('w_address','==', re_waddress).get()
                .then(snapshot=>{
                  if(snapshot.empty){
                    res.status(404).send("false");
                  }
                  else{
                    if(query2.doc.rvalid === 0){
                      //존재하는 추천인이 있을때 해당하는 waddress 각각에 추천토큰 지급
                      var sendtoken = await token.adminSendToken(signup_waddress,1);
                      var sendtoken = await token.adminSendToken(re_waddress,1);
                      res.send("true");
                      query.doc.rvalid = 1;
                    }
                    else {
                      res.send("false")
                    }
                  }
                });
              }
           })
          .catch(err => {
            res.status(500).send(err.message);
          });
  }),
  //3. 기프티콘 구매 부분.
  gifticonMain: functions.https.onRequest((req, res) => {
    //
  })
};
