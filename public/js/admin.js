var lastScrollTop = 0;// Temporary variable for determining whether page is scrolling up or down
var curPage = -1;// Indicates what page is shown now
var keycount = 0;
var running = false;
var interval = undefined;
init();

// Initialization
function init() {
  // Disable all possible buttons visible
  var buttons = document.getElementsByTagName('button');
  for (i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    button.classList.add('disabled');
  }

  // Check if already logged in
  if (!!firebase.auth().currentUser) {
    // If exists, get API key from server
    console.log("exist");
    firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
      $.post("/getapikey", {
        token: idToken,
      }, function(response) {
        response = JSON.parse(response);
        if (response.result === true) {
          config.dapp.apiKey = response.data.key;
          // Re-enable all buttons possible
          var buttons = document.getElementsByTagName('button');
          for (i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            button.classList.remove('disabled');
          }
        } else {
          // If login token is invalid, return to login page
          location.href = "/";
        }
      });
    });
    // set README be main page
    loadReadme();
  }
  // Set auth event(auth state change during user using the site) same with above
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log("re-authed");
      firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
        $.post("/getapikey", {
          token: idToken,
        }, function(response) {
          response = JSON.parse(response);
          if (response.result === true) {
            config.dapp.apiKey = response.data.key;
            var buttons = document.getElementsByTagName('button');
            for (i = 0; i < buttons.length; i++) {
              var button = buttons[i];
              button.classList.remove('disabled');
            }
          } else {
            location.href = "/";
          }
        });
      });
      loadReadme();
    } else {
      console.log("unauth");
      location.href = "/";
    }
  });

  // Get info about gifticon.html(Unnecessary, just decoration)
  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&path=public%2Fhtml%2Fgifticon.html&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
    $("#commitdategifticon").html(response[0].commit.author.date.substring(5, 10));
    $("#commitnamegifticon").html(response[0].commit.message);
  });
  // Get info about user.html(Unnecessary, just decoration)
  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&path=public%2Fhtml%2Fuser.html&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
    $("#commitdateuser").html(response[0].commit.author.date.substring(5, 10));
    $("#commitnameuser").html(response[0].commit.message);
  });
  // Get info about README.html(Unnecessary, just decoration)
  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&path=public%2Fhtml%2FREADME.html&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
    $("#commitdatereadme").html(response[0].commit.author.date.substring(5, 10));
    $("#commitnamereadme").html(response[0].commit.message);
  });
  // Get info about whole repository(Unnecessary, just decoration)
  $.get("https://api.github.com/repos/Orb-H/SKKU-Lambda-Coop/commits?sha=web&page=1&per_page=1", function(response) {}, 'json').done(function(response) {
    $("#commitdate").html(response[0].commit.author.date.substring(5, 10));
    $("#commithash").html(response[0].sha.substring(0, 7));
    $("#commitname").html(response[0].commit.message);
    $("#commitauthor").html(response[0].commit.author.name);
  });
}

// Logout
function logout() {
  // Use firebase API to manually sign out
  firebase.auth().signOut().then(function() {
    // and return to login page
    location.href = "/";
    alert("Successfully logged out");
  }).catch(function(error) {
    console.log(error);
    alert(error);
  });
}

// Load gifticon.html in content div
function loadGifticonContent() {
  if (curPage === 1) return;
  curPage = 1;
  $(".content").load('html/gifticon.html');
  $("#title").html("<b>🔧 기프티콘</b>");
}

// Load user.html in content div
function loadUserContent() {
  if (curPage === 2) return;
  curPage = 2;
  $(".content").load('html/user.html');
  $("#title").html("<b>🔧 사용자</b>");
}

// Load README.html in content div
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
    var getTextNodesIn = function(el) {
      return $(el).find(":not(iframe,script)").addBack().contents().filter(function() {
        return this.nodeType == 3;
      });
    };

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

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    interval = setInterval(messUpWords, 50);
    running = true;
  }
}

// Smooth fade-in / fade-out animation for header
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
