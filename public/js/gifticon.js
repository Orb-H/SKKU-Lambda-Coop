var curcategory1 = '';
var curcategory2 = '';
var curname = '';

function lookUpItems() {
  $("#gifticons tbody tr").remove();

  var table = document.getElementById("gifticons").getElementsByTagName('tbody')[0];
  firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
    $.post("/gifticon_list", {
      token: idToken,
    }, function(response) {
      response = JSON.parse(response);
      for (i = 0; i < response.length; i++) {
        var newRow = table.insertRow(-1);

        var name = newRow.insertCell(0);
        var category1 = newRow.insertCell(1);
        var category2 = newRow.insertCell(2);
        var cost = newRow.insertCell(3);
        var count = newRow.insertCell(4);
        var button = newRow.insertCell(5);

        name.innerHTML = response.content[i].name;
        category1.innerHTML = response.content[i].category1;
        category2.innerHTML = response.content[i].category2;
        cost.innerHTML = response.content[i].cost;
        count.innerHTML = response.content[i].count;
        button.innerHTML = "<button onclick=detailLookUpItems(" + response.content[i].category1 + "," + response.content[i].category2 + "," + response.content[i].name + ")>조회</button>";
      }
    });
  });
}

function detailLookUpItems(giftcategory1, giftcategory2, giftname) {
  $("#gifticondetail tbody tr").remove();

  var table = document.getElementById("gifticondetail").getElementsByTagName('tbody')[0];
  firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
    $.post("/gifticons/detail", {
      token: idToken,
      name: giftname,
      category1: giftcategory1,
      category2: giftcategory2
    }, function(response) {
      response = JSON.parse(response);
      $("#gifticon").html("기프티콘 종류: " + giftcategory1 + "/" + giftcategory2 + "/" + giftname);
      curcategory1 = giftcategory1;
      curcategory2 = giftcategory2;
      curname = giftname;
      for (i = 0; i < response.length; i++) {
        var newRow = table.insertRow(-1);

        var number = newRow.insertCell(0);
        var image = newRow.insertCell(1);
        var used = newRow.insertCell(2);
        var del = newRow.insertCell(3);

        number.innerHTML = response.content[i].id;
        image.innerHTML = "<img src=" + response.content[i].image + " />";
        used.innerHTML = (response.content[i].used === "true" ? "<font color=red>사용</font>" : "<font color=green>미사용</font>");
        del.innerHTML = "<button onclick=removeItem(" + response.content[i].id + ")>삭제</button>";
      }
    });
  });
}

function addItem(input) {
  if (input.files && input.files[0]) {
    document.getElementById("images").innerHTML = "";
    for (i = 0; i < input.files.length; i++) {
      var reader = new FileReader();

      reader.onload = function(e) {
        document.getElementById("images").innerHTML += ("<img src=" + e.target.result + " width=150 />");
      };

      reader.readAsDataURL(input.files[i]);
    }
  } else {
    document.getElementById("images").innerHTML = "";
  }
}

function sendItem() {
  var database = firebase.database();
  var giftcategory1 = document.getElementById("giftcategory1");
  var giftcategory2 = document.getElementById("giftcategory2");
  var giftname = document.getElementById("giftname");
  var input = document.getElementById("files");

  var encoding = [];
  var length = input.files.length;

  if (input.files && input.files[0]) {
    for (i = 0; i < input.files.length; i++) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var result = e.target.result;
        encoding.push(result);

        if (encoding.length === length) {
          firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
            $.post("/gifticons/register", {
              name: giftname.value,
              category1: giftcategory1,
              category2: giftcategory2,
              length: input.files.length,
              images: encoding
            }, function(result) {
              if (result === "true") {
                alert("등록 성공!");
              } else {
                alert("등록 실패!");
              }
            });
          })
        }
      };
      reader.readAsDataURL(input.files[i]);
    }
  }
}

function removeItem(giftnumber) {
  firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
    $.post("/gifticons/remove", {
      token: idToken,
      id: giftnumber
    }, function(response) {
      if (response === "true") {
        alert("삭제 성공!");
        detailLookUpItems(curcategory1, curcategory2, curname);
      } else {
        alert("삭제 실패");
      }
    });
  });
}
