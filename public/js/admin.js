var lastScrollTop = 0;
var curPage = -1;
var keycount = 0;
var running = false;
var interval = undefined;
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

  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&path=public%2Fjs%2Fgifticon.js&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
    $("#commitdategifticon").html(response[0].commit.author.date.substring(5, 10));
    $("#commitnamegifticon").html(response[0].commit.message);
  });
  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&path=public%2Fjs%2Fuser.js&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
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

function easter() {
  if (running) {
    clearInterval(interval);
    running = false;
  } else {
    var getTextNodesIn = function(el) { // Look at all the page elements and returns the text nodes
      return $(el).find(":not(iframe,script)").addBack().contents().filter(function() {
        return this.nodeType == 3; // Text node types are type 3
      });
    };

    // var textNodes = getTextNodesIn($("p, h1, h2, h3","*"));
    var textNodes = getTextNodesIn($("p, h1, h2, h4, div, span"));

    function isLetter(char) {
      return /^[\d]$/.test(char);
    }

    var wordsInTextNodes = [];
    for (var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];

      var words = []

      var re = /[\w|\uAC00-\uD7AF]+/g;
      var match;
      while ((match = re.exec(node.nodeValue)) != null) {

        var word = match[0];
        var position = match.index;

        words.push({
          length: word.length,
          position: position
        });
      }
      wordsInTextNodes[i] = words;
    };

    function messUpWords() {
      for (var i = 0; i < textNodes.length; i++) {
        var node = textNodes[i];
        for (var j = 0; j < wordsInTextNodes[i].length; j++) {
          // Only change a tenth of the words each round.
          if (Math.random() > 1 / 10) {
            continue;
          }

          var wordMeta = wordsInTextNodes[i][j];

          var word = node.nodeValue.slice(wordMeta.position, wordMeta.position + wordMeta.length);
          var before = node.nodeValue.slice(0, wordMeta.position);
          var after = node.nodeValue.slice(wordMeta.position + wordMeta.length);

          node.nodeValue = before + messUpWord(word) + after;
        };
      };
    }

    function messUpWord(word) {
      if (word.length < 3) {
        return word;
      }
      return word[0] + messUpMessyPart(word.slice(1, -1)) + word[word.length - 1];
    }

    function messUpMessyPart(messyPart) {
      if (messyPart.length < 2) {

        return messyPart;
      }
      var a, b;
      while (!(a < b)) {
        a = getRandomInt(0, messyPart.length - 1);
        b = getRandomInt(0, messyPart.length - 1);
      }
      return messyPart.slice(0, a) + messyPart[b] + messyPart.slice(a + 1, b) + messyPart[a] + messyPart.slice(b + 1);
    }

    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    interval = setInterval(messUpWords, 50);
    running = true;
  }
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

$(document).keyup(function(event) {
  if (event.keyCode == '38') {
    if (keycount === 0 || keycount === 1) {
      keycount = keycount + 1;
    }
  } else if (event.keyCode == '40') {
    if (keycount === 2 || keycount === 3) {
      keycount = keycount + 1;
    }
  } else if (event.keyCode == '37') {
    if (keycount === 4 || keycount === 6) {
      keycount = keycount + 1;
    }
  } else if (event.keyCode == '39') {
    if (keycount === 5 || keycount === 7) {
      keycount = keycount + 1;
    }
  } else if (event.keyCode == '66') {
    if (keycount === 8) {
      keycount = keycount + 1;
    }
  } else if (event.keyCode == '65') {
    if (keycount === 9) {
      easter();
    }
  } else {
    keycount = 0;
  }
});
