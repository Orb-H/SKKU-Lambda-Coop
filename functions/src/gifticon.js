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
      var gprice = body.cost;
      try {
        var query = await db.collection('gifticon').where('menu', '==', gname).where('category1', '==', gcategory1).where('category2', '==', gcategory2).get();
        if (query.docs.length !== 0) {
          gprice = query.docs[0].data().price;
        }
        /* eslint-disable no-await-in-loop */
        for (var i = 0; i < glength; i++) {
          await db.collection('gifticon').add({
            category1: gcategory1,
            category2: gcategory2,
            menu: gname,
            image: body.images[i],
            price: gprice,
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
        obj.data = await module.exports.gifticonlist();

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
        obj.data = await module.exports.gifticondetail();
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
        res.send(JSON.stringify(obj));
      } catch (err) {
        res.status(500).send(err.message);
      }
    } else {
      res.status(404).send('');
    }
  }),

  gifticonlist: function() {
    return new Promise(async (resolve, reject) => {
      try {
        var obj = {
          content: []
        };
        var query = await db.collection('gifticon').get();

        for (var doc of query.docs) {
          var temp = false;
          var data = doc.data();
          for (var i = 0; i < obj.content.length; i++) {
            var content = obj.content[i];
            if (content.name === data.menu && content.category1 === data.category1 && content.category2 === data.category2) {
              temp = true;
              obj.content[i].count++;
              break;
            }
          }
          if (temp === false) {
            obj.content.push({
              name: data.menu,
              category1: data.category1,
              category2: data.category2,
              cost: data.price,
              count: 1
            });
          }
        }

        resolve(obj);
      } catch (err) {
        reject(err);
      }
    })
  },

  gifticondetail: function() {
    return new Promise(async (resolve, reject) => {
      try {
        var obj = {
          content: []
        };
        var dbquery = await db.collection('gifticon').where('menu', '==', body.name).where('category1', '==', body.category1).where('category2', '==', body.category2).get();
        for (var doc of dbquery.docs) {
          let encodedimage = doc.data().image;
          obj.content.push({
            id: doc.id,
            image: encodedimage,
            used: doc.data().used
          });
        }
        resolve(obj);
      } catch (err) {
        reject(err);
      }
    })
  }
};
