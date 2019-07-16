'use strict';

// [START import]
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp()
//const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
const db = admin.firestore();
//const cors = require('cors')({origin: true});
// [END import]

// [START generateThumbnail]
// * When an image is uploaded in the Storage bucket We generate a thumbnail automatically using
// * ImageMagick.
// [START generateThumbnailTrigger]
/*exports.generateThumbnail = functions.storage.object().onFinalize(async (object) => {
// [END generateThumbnailTrigger]
  // [START eventAttributes]
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.
  const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.
  // [END eventAttributes]

  // [START stopConditions]
  // Exit if this is triggered on a file that is not an image.
  if (!contentType.startsWith('image/')) {
    return console.log('This is not an image.');
  }

  // Get the file name.
  const fileName = path.basename(filePath);
  // Exit if the image is already a thumbnail.
  if (fileName.startsWith('thumb_')) {
    return console.log('Already a Thumbnail.');
  }
  // [END stopConditions]

  // [START thumbnailGeneration]
  // Download file from bucket.
  const bucket = admin.storage().bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const metadata = {
    contentType: contentType,
  };
  await bucket.file(filePath).download({destination: tempFilePath});
  console.log('Image downloaded locally to', tempFilePath);
  // Generate a thumbnail using ImageMagick.
  await spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath]);
  console.log('Thumbnail created at', tempFilePath);
  // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
  const thumbFileName = `thumb_${fileName}`;
  const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
  // Uploading the thumbnail.
  await bucket.upload(tempFilePath, {
    destination: thumbFilePath,
    metadata: metadata,
  });
  // Once the thumbnail has been uploaded delete the local file to free up disk space.
  return fs.unlinkSync(tempFilePath);
  // [END thumbnailGeneration]
});*/


//1. 관리자 로그인 요청주소 : POST/login
exports.adminlogin = functions.https.onRequest((req, res) => {

  var body = req.body;
  if (req.method === 'POST') {
    admin.auth().verifyIdToken(body.token)
      .then(function(decodedToken) {
        let uid = decodedToken.uid;
        if (uid === '73cxqheH7nMwI2Gj91ojCEfm1j73') {
          res.send("true");
        } else {
          res.send("false");
        }
      }).catch(function(error) {
        res.send("false");
      });
  }

});
//2. 웹->서버 기프티콘 전달 요청주소 POST/gifrticons/register
/*
exports.webtoservergift =functions.https.onRequest((req, res) => {



});
//3. 서버->웹 기프티콘 리스트 전달 요청주소 POST/gifticons/list
exports.servertowebgift =functions.https.onRequest((req, res) => {



});
//4. 기프티콘 특정 Type 정보 전달 요청주소 POST/gifticons/detail
exports.gtype =functions.https.onRequest((req, res) => {



});
//5. 기프티콘 삭제 요청 요청주소 POST/gifticons/remove
exports.gdelete =functions.https.onRequest((req, res) => {



});
//클라이언트 ==================================================================

//1. 최초 가입 : wallet address, 닉네임, wallet address 를 받고 db와 확인후 token 지급
exports.signup  =functions.https.onRequest((req, res) => {



});
//2. 추천인 입력 : 추천인 입력 받아 확인 후에 맞을 시 토큰 지급
exports.recommend =functions.https.onRequest((req, res) => {



});
//3. 기프티콘 구매 부분.
exports.gifticonMain =functions.https.onRequest((req, res) => {



});

*/
