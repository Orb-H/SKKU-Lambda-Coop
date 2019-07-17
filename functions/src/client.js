const functions = require('firebase-functions');
const admin = require('firebase-admin');
//클라이언트 ==================================================================

module.exports = {
  //1. 최초 가입 : wallet address, 닉네임, wallet address 를 받고 db와 확인후 token 지급
  signup: functions.https.onRequest((req, res) => {

  }),
  //2. 추천인 입력 : 추천인 입력 받아 확인 후에 맞을 시 토큰 지급
  recommend: functions.https.onRequest((req, res) => {

  }),
  //3. 기프티콘 구매 부분.
  gifticonMain: functions.https.onRequest((req, res) => {

  })
};
