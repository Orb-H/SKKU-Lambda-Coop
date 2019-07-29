const functions = require('firebase-functions');
const admin = require('firebase-admin');
const token = require('./token.js');
//클라이언트 ==================================================================
module.exports = {
  //1. 최초 가입 : 이메일address, 닉네임, wallet address 를 받고 db와 확인후 token 지급
  signup: functions.https.onRequest(async(req, res) => {
    var body = req.body;
    var reqemail = body.email;
    var reqwaddress = body.waddress;
    var reqnickname = body.nickname;
    try{
      let query = db.collecion('login').where('emali','==',reqemail).get()
        .then(snapshot => {
          if(snapshot.empty){
            await db.collection('login').add({
              email: reqemail,
              nickname: reqnickname,
              w_addresss: reqwaddress
            })      
          res.send("true");
          var sendtoken = await token.adminSendToken(reqemail,1);
          }
          else {
            res.send("false");
          }
        }); 
    }catch(err) {
      res.status(500).send(err.message);
    }
  }),
  //2. 추천인 입력 : 추천인 입력 받아 확인 후에 맞을 시 토큰 지급
  recommend: functions.https.onRequest(async( req, res) => {
  //가입자 waddress, 추천인 waddress을 받아 db에 존재하고 본인이 아닐 경우에 각각의 사람에게 token 지급
  //U.I 쪽에서 같은 w_address 입력 못하도록 막아준다. 
    var body =req.body;
    var signup_waddress = body.s_waddress;
    var re_waddress = body.r_waddress;
    var obj = {
      "result" : "false",
      "data" : {}
    }
    let loginRef = db.collection('login');
    let query = await loginRef.where('w_address','==', re_waddress).get()                      
          .then(snapshot =>{
              if(snapshot.empty){
                obj.data.push({
                  error_code : 2
                })
                res.send(400).send(JSON.stringify(obj));
              }
              else{
                let loginRef = db.collection('login');
                let query2 = await loginRef.where('w_address','==', signup_waddress).get()
                .then(snapshot=>{
                  if(snapshot.empty){
                    obj.data.push({
                      error_code : 1
                    })
                    res.send(400).send(JSON.stringify(obj));
                  }
                  else{
                    if(query2.doc.rvalid === 0){
                      //존재하는 추천인이 있을때 해당하는 waddress 각각에 추천토큰 지급
                      var sendtoken = await token.adminSendToken(signup_waddress,1);
                      var sendtoken = await token.adminSendToken(re_waddress,1);
                      res.send("true");
                      query.doc.rvalid = 1;
                      obj.result = "true";
                      res.send(JSON.stringify(obj));
                    }
                    else {
                      obj.data.push({
                        error_code : 4
                      })
                      res.send(400).send(JSON.stringify(obj));
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
  //인풋값 : txhash , name, category1, category2
  //RESPONSE :
        //tx hash 가 존재하지 않음 = 1
        //토큰값이 기프티콘 가격보다 적을 경우 =2 
        //토큰값이 기프티콘 가격보다 클경우 =3
        //기프티콘의 종류가 존재하지 않을 때 =4 
  gifticonMain: functions.https.onRequest(async (req, res) => {
    //클라이언트로부터 해시를 받아서 검색한다
    if ( req.method === 'POST'){
      var body = req.body;
      var obj = {
        "result" : "false",
        "data" : {}
      }
      try {
            var dbquery =  db.collection('gifticon')
            .where('name', '==', data.name)
            .where('category1', '==', data.category1)
            .where('category2', '==', data.category2)
            .get()
            .then(snapshot=>{
              if(snapshot.empty){
                obj.data.push({
                  error_code : 4
                })
                res.send(400).send(JSON.stringify(obj));
              }
              else{ 
                var giftprice = dbquery.doc.price;
                if (token.transactioncheck(body.txhash,giftprice)){
                  for ( var doc of query.docs){
                    if ( doc.used === 'false'){
                      var giftprice = doc.price;
                      let encodedimage = doc.data().image.toString('base64');
                      obj.data.image.push({
                          image: encodedimage,
                      });
                      doc.used = 'true';
                      obj.result = "true";
                      await db.collection('transaction').add({
                        transaction_hash : txhash
                      });      
                      break;
                    }
                  }
                }
                else{
                  res.status(400).send(obj);
                }
              }
            });
          }catch(err){
            res.status(500).send(err,message);
          }
    }
  })
};

    /*
    request : txhash, name , categoryt1 ,category2
    response : result , data
    */



    //클라이언트에서 받은 해시를 검색하여 유효한지 판단
    
    //그 검색한 해시는 db에 저장 
