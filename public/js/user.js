var row = 0;

function lookUpUsers() {
  $("#users tbody tr").remove();

  var table = document.getElementById("users").getElementsByTagName('tbody')[0];

  var db = firebase.firestore();
  db.collection('login').get().then(snapshot => {
    snapshot.forEach((doc) => {
      var newRow = table.insertRow(-1);

      var email = newRow.insertCell(0);
      var nickname = newRow.insertCell(1);
      var w_address = newRow.insertCell(2);
      var amount = newRow.insertCell(3);

      var data = doc.data();

      email.innerHTML = data.email;
      nickname.innerHTML = data.nickname;
      w_address.innerHTML = data.w_address;
      if (data.w_address.length !== 0) {
        $.ajax({
          type: 'get',
          url: 'https://api.luniverse.io/tx/v1.0/wallets/' + data.w_address + '/' + config.mt.symbol + '/' + config.st.symbol + '/balance',
          headers: {
            "Authorization": "Bearer " + config.dapp.apiKey,
            "Content-type": "application/json"
          },
          success: function(data) {
            if (data.result) {
              amount.innerHTML = data.data.balance;
            } else {
              amount.innerHTML = "Not Available";
            }
          }
        });
      }
    })
  });
}

function sendToken() {
  var table = document.getElementById("sendtoken").getElementsByTagName('tbody')[0];

  var db = firebase.firestore();

  var sub = 0;
  var todo = [];

  for (i = 0; i < row; i++) {
    if (!$("#email" + (i + 1)).hasClass('invalid')) {
      $("#email" + (i + 1)).toggleClass('invalid');
    }
    if (!$("#amount" + (i + 1)).hasClass('invalid')) {
      $("#amount" + (i + 1)).toggleClass('invalid');
    }
    todo.push(i + 1);
  }

  db.collection('login').get().then((snapshot) => {
    snapshot.forEach((doc) => {
      var data = doc.data();
      todo.forEach((index) => {
        if (data.email === document.getElementById("email" + index).value) {
          var sendData = '{"inputs": {"receiverAddress": "' + data.w_address + '", "valueAmount": "' + document.getElementById("amount" + index).value + '"}}';
          sendData = JSON.parse(sendData);
          $.ajax({
            type: 'post',
            url: 'https://api.luniverse.io/tx/v1.0/transactions/adminSend',
            data: JSON.stringify(sendData),
            headers: {
              "Authorization": "Bearer " + config.dapp.apiKey,
              "Content-Type": "application/json"
            },
            success: function(data) {
              todo.splice(todo.indexOf(index), 1);
              if (data.result) {
                sub = sub + 1;
                table.deleteRow(index - sub);
                row = row - 1;
              } else {
                $("#amount" + j).toggleClass('invalid');
              }
            },
            error: function(data) {
              console.log(data.message);
            }
          });
        }
      });
    });
  });
}

function addRow() {
  var table = document.getElementById("sendtoken").getElementsByTagName('tbody')[0];
  var newRow = table.insertRow(row);
  row = row + 1;

  var email = newRow.insertCell(0);
  var amount = newRow.insertCell(1);

  email.innerHTML = "<input id=\"email" + row + "\" type=\"text\" class=\"text\" placeholder=\"이메일\"></input>";
  amount.innerHTML = "<input id=\"amount" + row + "\" type=\"text\" class=\"text\" placeholder=\"보낼 토큰\"></input>";
}

function deleteRow() {
  var table = document.getElementById("sendtoken").getElementsByTagName('tbody')[0];
  row = row - 1;
  table.deleteRow(row);
}
