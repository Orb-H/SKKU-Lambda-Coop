var lastScrollTop = 0;
var curPage = -1;
init();

function init() {
  var buttons = document.getElementsByTagName('button');
  for (i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    button.classList.add('disabled');
  }

  if (!!firebase.auth().currentUser) {
    console.log("exist");
    firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
      $.post("/getapikey", {
        token: idToken,
      }, function(response) {
        config.dapp.apiKey = response;
        var buttons = document.getElementsByTagName('button');
        for (i = 0; i < buttons.length; i++) {
          var button = buttons[i];
          button.classList.remove('disabled');
        }
      });
    });
    loadReadme();
  }
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log("re-authed");
      firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
        $.post("/getapikey", {
          token: idToken,
        }, function(response) {
          config.dapp.apiKey = response;
          var buttons = document.getElementsByTagName('button');
          for (i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            button.classList.remove('disabled');
          }
        });
      });
      loadReadme();
    } else {
      console.log("unauth");
      location.href = "/";
    }
  });

  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&path=public%2Fhtml%2Fgifticon.html&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
    $("#commitdategifticon").html(response[0].commit.author.date.substring(5, 10));
    $("#commitnamegifticon").html(response[0].commit.message);
  });
  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&path=public%2Fhtml%2Fuser.html&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
    $("#commitdateuser").html(response[0].commit.author.date.substring(5, 10));
    $("#commitnameuser").html(response[0].commit.message);
  });
  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&path=public%2Fhtml%2FREADME.html&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
    $("#commitdatereadme").html(response[0].commit.author.date.substring(5, 10));
    $("#commitnamereadme").html(response[0].commit.message);
  });
  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
    $("#commitdate").html(response[0].commit.author.date.substring(5, 10));
    $("#commithash").html(response[0].sha.substring(0, 7));
    $("#commitname").html(response[0].commit.message);
    $("#commitauthor").html(response[0].commit.author.name);
  });
}

function logout() {
  firebase.auth().signOut().then(function() {
    location.href = "/";
    alert("Successfully logged out");
  }).catch(function(error) {
    console.log(error);
    alert(error);
  });
}

function loadGifticonContent() {
  if (curPage === 1) return;
  curPage = 1;
  $(".content").load('html/gifticon.html');
  $("#title").html("<b>🔧 기프티콘</b>");
}

function loadUserContent() {
  if (curPage === 2) return;
  curPage = 2;
  $(".content").load('html/user.html');
  $("#title").html("<b>🔧 사용자</b>");
}

function loadReadme() {
  if (curPage === 0) return;
  curPage = 0;
  $(".content").load('html/README.html');
  $("#title").html("<b>📜 README.md</b>");
}

$(window).scroll(function() {
  var st = $(this).scrollTop();
  if ((st > lastScrollTop) && (st > 20) && (lastScrollTop <= 20)) {
    $("header").stop().animate({
      opacity: "0.2"
    }, 400);
  } else if ((st < lastScrollTop) && (st < 20) && (lastScrollTop >= 20)) {
    $("header").stop().animate({
      opacity: "1"
    }, 400);
  }
  lastScrollTop = st;
});
