'use strict';

// [START import]
const functions = require('firebase-functions');
//const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
const cors = require('cors')({
  origin: true
});

const login = require('./src/login.js');
const gifticon = require('./src/gifticon.js');
const client = require('./src/client.js');
const token = require('./src/token.js');
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
exports.adminlogin = login.adminlogin;
exports.getApiKey = login.getApiKey;
exports.checkadmin = login.checkadmin;

exports.duplicate = client.duplicate;
exports.nickname = client.nickname;
exports.signup = client.signup;
exports.recommend = client.recommend;
exports.gifticonMain = client.gifticonMain;
exports.createWallet = client.createWallet;
exports.lookupWallet = client.lookupWallet;
exports.checkBalance = client.checkBalance;
exports.getGifticonTypes = client.getGifticonTypes;
exports.getGifticonDetail = client.getGifticonDetail;
exports.findNickname = client.nicknamebywaddr;

exports.webtoservergift = gifticon.webtoservergift;
exports.servertowebgift = gifticon.servertowebgift;
exports.gtype = gifticon.gtype;
exports.gdelete = gifticon.gdelete;

exports.debug_transactioncheck = token.debug_transactioncheck;