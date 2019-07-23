const functions = require('firebase-functions');
const {
  auth,
  db,
} = require('./admin.js');
const login = require('./login.js');

module.exports = {
  //2. 웹->서버 기프티콘 전달 요청주소 POST/gifticons/register
  webtoservergift: functions.https.onRequest((req, res) => {
    /*var body = req.body;
    if (req.method === 'POST') {
      admin.auth().verifyIdToken(body.token)
        .then(function(decodedToken) {
          let uid = decodedToken.uid;
          var obj = {
            result: string,
            data: {

            }
          };
          if (uid === '73cxqheH7nMwI2Gj91ojCEfm1j73') {
            var gname = body.name;
            var gcategory1 = body.category1;
            var gcategory2 = body.category2;
            var glength = body.length;
            for (var i = 0; i < glength; i++) {
              var decodedImage = new Buffer(body.images[i], "base64");
              let addDoc = db.collection('gifticon').add({
                category1: gcategory1,
                category2: gcategory2,
                menu: gname,
                image: decodedImage,
                price: 0,
                used: "false"
              })
            }
            obj.result = "true"
            obj.data, push({
              success: "true"
            });
          } else {


            obj.result = "false"
            obj.data.push({
              success: "false"
            });
          }
          return uid;
        }).catch(function(error) {
          obj.result = "false"
          obj.data.push({
            success: "false"
          });
        });

      var json = JSON.stringify(obj);
      res.send(json);

    }*/
  }),

  //3. 서버->웹 기프티콘 리스트 전달 요청주소 POST/gifticons/list
  // name , category1, category2, price ,count json 형식으로 보내죽 ㅣ
  servertowebgift: functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
      var body = req.body;
      var isadmin = await login.checkadmin(body.token);
      var obj = {
        "result": "false",
        "data": {}
      }
      if (!isadmin) {
        res.send(401).send('');
      }

      obj.result = "true";
      obj.data.content = [];

      try {
        await db.collection('gifticon').get().then((snapshot) => {
          snapshot.forEach(async (doc) => {
            var temp = 0;
            var temp2 = 1;
            var data = doc.data();
            for (var i = 0; i < obj.data.content.length; i++) {
              if (obj.data.content[i].name === data.name && obj.content[i].category1 === data.category1 && obj.content[i].category2 === data.category2) {
                temp = 1;
                temp2 = i;
                break;
              }
            }
            if (temp === 1) {
              obj.data.content[i].count++;
            } else if (temp === 0) {
              obj.data.content.push({
                name: data.name,
                category1: data.category1,
                category2: data.category2,
                cost: data.price,
                count: 1
              });
            }
            return obj;
          });

          obj.data.length = obj.data.content.length;
          res.send(JSON.stringify(obj));

          return snapshot;
        }).catch((err) => {
          res.status(500).send(err.message);
        });
      } catch (err) {
        res.status(500).send(err.message);
      }
    }
  }),
  //4. 기프티콘 특정 Type 정보 전달 요청주소 POST/gifticons/detail
  gtype: functions.https.onRequest((req, res) => {

    //요청받은 name ,category1, categoryt2 에 대해서 문서 이름을 꺼내와서 image와 used 보내줌
    /*var body = req.body;
    if (req.method === 'POST') {
      admin.auth().verifyIdToken(body.token)
        .then(function(decodedToken) {
          let uid = decodedToken.uid;
          var obj2 = {
            result: string,
            data: {
              content: []
            }
          };
          if (uid === '73cxqheH7nMwI2Gj91ojCEfm1j73') {
            var gname = body.name;
            var gcategory1 = body.category1;
            var gcategory2 = body.category2;

            //이미지 인코딩 부분 let encodedimage = body.image.toString('base64');

            let gifticonsRef = db.collection('gifticon');
            var query = gifticonsRef.where.where('name', '==', gname).where('category1', '==', gcategory1).where('category2', '==', gcategory2).get()
              .then(snapshot => {
                if (snapshot.empty) {
                  obj2.result = "true";
                  obj2.push({
                    length: -1
                  });
                }
                snapshot.forEach(doc => {
                  let encodedimage = doc.data().image.toString('base64');
                  obj2.data.content.push({
                    id: doc.id,
                    image: encodedimage,
                    used: doc.data().used
                  });

                });
                var glength = Object.keys(obj2.data).length;
                obj2.push({
                  length: glength
                });
                obj2.result = "true"
              })
              .catch(err => {
                //error getting documents
              });

            var json = JSON.stringify(obj2);
            res.send(json);

          } else {
            //관리자가 아닌경우
            obj2.result = "false"
            var json = JSON.stringify(obj2);
            res.send(json);

          }
          return uid;
        }).catch(function(error) {
          res.send("false");
        });
    }*/


  }),
  //5. 기프티콘 삭제 요청 요청주소 POST/gifticons/remove
  gdelete: functions.https.onRequest((req, res) => {
    //id 를 받아 해당 id 에 해당하는 문서 제거
    /*var body = req.body;
    if (req.method === 'POST') {
      admin.auth().verifyIdToken(body.token)
        .then(function(decodedToken) {
          let uid = decodedToken.uid;
          var obj3 = {
            result: string,
            data: {}
          }
          if (uid === '73cxqheH7nMwI2Gj91ojCEfm1j73') {
            var did = body.id;
            let idRef = db.collection('gificons').doc('did');
            let getDoc = idRef.get()
              .then(doc => {
                if (!doc.exists) {
                  obj3.result = "false";
                  obj3.data.push({
                    success: "false"
                  });
                  var json = JSON.stringify(obj3);
                  res.send(json);
                } else {

                  let deleteDoc = db.collection('gifticon').doc('did').delete();
                  obj3.result = "true";
                  obj3.data.push({
                    success: "true"
                  });
                  var json = JSON.stringify(obj3);
                  res.send(json);
                }
              })
              .catch(err => {
                obj3.result = "false";
                obj3.data.push({
                  success: "false"
                });
                var json = JSON.stringify(obj3);
                res.send(json);

              });
          } else {
            obj3.result = "false";
            obj3.data.push({
              success: "false"
            });
            var json = JSON.stringify(obj3);
            res.send(json);
          }
          return uid;
        }).catch(function(error) {
          obj3.result = "false";
          obj3.data.push({
            success: "false"
          });
          var json = JSON.stringify(obj3);
          res.send(json);
        });
    }*/

  })
};
