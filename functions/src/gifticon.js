const functions = require('firebase-functions');
const admin = require('firebase-admin');
//클라이언트 ==================================================================

module.exports = {
  //2. 웹->서버 기프티콘 전달 요청주소 POST/gifticons/register
  webtoservergift: functions.https.onRequest((req, res) => {

  }),
  //3. 서버->웹 기프티콘 리스트 전달 요청주소 POST/gifticons/list
  servertowebgift: functions.https.onRequest((req, res) => {

  }),
  //4. 기프티콘 특정 Type 정보 전달 요청주소 POST/gifticons/detail
  gtype: functions.https.onRequest((req, res) => {

  }),
  //5. 기프티콘 삭제 요청 요청주소 POST/gifticons/remove
  gdelete: functions.https.onRequest((req, res) => {

  })
};
