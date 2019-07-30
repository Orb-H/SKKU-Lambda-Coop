const functions = require('firebase-functions');
const {
  auth,
  db,
} = require('./admin.js');
const login = require('./login.js');
module.exports = {
  //2. 웹->서버 기프티콘 전달 요청주소 POST/gifticons/register
  webtoservergift: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      var isadmin = await login.checkadmin(body.token);
      var obj = {
        "result": false,
        "data": {}
      }
      if (!isadmin) {
        res.send(401).send(JSON.stringify(obj));
      }
      obj.result = true;
      var gname = body.name;
      var gcategory1 = body.category1;
      var gcategory2 = body.category2;
      var glength = body.length;
      try {
        /* eslint-disable no-await-in-loop */
        for (var i = 0; i < glength; i++) {
          var decodedImage = new Buffer(body.images[i], "base64");
          await db.collection('gifticon').add({
            category1: gcategory1,
            category2: gcategory2,
            menu: gname,
            image: decodedImage,
            price: 0,
            used: false
          });
        }
        /* eslint-enable no-await-in-loop */

        res.send(JSON.stringify(obj));
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(405).send('');
    }
  }),
  //3. 서버->웹 기프티콘 리스트 전달 요청주소 POST/gifticons/list
  servertowebgift: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      var isadmin = await login.checkadmin(body.token);
      var obj = {
        "result": false,
        "data": {}
      }
      if (!isadmin) {
        res.status(401).send('');
      }

      obj.result = true;
      obj.data.content = [];

      try {
        var query = await db.collection('gifticon').get();
        for (var doc of query.docs) {
          var temp = false;
          var data = doc.data();
          for (var i = 0; i < obj.data.content.length; i++) {
            if (obj.data.content[i].name === data.name && obj.content[i].category1 === data.category1 && obj.content[i].category2 === data.category2) {
              temp = true;
              obj.data.content[i].count++;
              break;
            }
          }
          if (temp === 0) {
            obj.data.content.push({
              name: data.name,
              category1: data.category1,
              category2: data.category2,
              cost: data.price,
              count: 1
            });
          }
        }

        obj.data.length = obj.data.content.length;
        res.send(JSON.stringify(obj));
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),
  //4. 기프티콘 특정 Type 정보 전달 요청주소 POST/gifticons/detail
  gtype: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      var isadmin = await login.checkadmin(body.token);
      var obj = {
        "result": false,
        "data": {}
      }
      if (!isadmin) {
        res.status(401).send(JSON.stringify(obj));
      }
      obj.result = true;
      obj.data.content = [];
      try {
        var dbquery = db.collection('gifticon')
          .where('name', '==', data.name)
          .where('category1', '==', data.category1)
          .where('category2', '==', data.category2)
          .get();
        for (var doc of query.docs) {
          let encodedimage = doc.data().image.toString('base64');
          obj.data.content.push({
            id: doc.id,
            image: encodedimage,
            used: doc.data().used
          });
        }
        obj.data.length = obj.data.content.length;
        res.send(JSON.stringify(obj));
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),
  //5. 기프티콘 삭제 요청 요청주소 POST/gifticons/remove
  gdelete: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      var isadmin = await login.checkadmin(body.token);
      var obj = {
        "result": false,
        "data": {}
      }
      if (!isadmin) {
        res.status(401).send(JSON.stringify(obj));
      }
      obj.result = true;
      try {
        var did = body.id;
        await db.collection('gifticon').doc(did).delete();
        obj.data.success = true;
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  })
};
