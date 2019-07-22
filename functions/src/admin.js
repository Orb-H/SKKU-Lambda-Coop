const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();

module.exports = {
  auth,
  db,
}
