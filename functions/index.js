const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.adminLogin = functions.https.onRequest((request, response) => {
  var id = request.body.id;
  var pw = request.body.pw;

  if (id === 'admin' && pw === 'admin321') {
    response.send('S');
  } else if (id !== 'admin') {
    response.send('I');
  } else if (pw !== 'admin321') {
    response.send('P');
  }
  response.send('?');
});
