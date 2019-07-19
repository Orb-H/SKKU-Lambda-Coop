function signIn() {
  var id = $("#ID").val();
  var pw = $("#PW").val();

  if (id == '') {
    alert('Fill ID');
  } else if (pw == '') {
    alert('Fill PW');
  } else {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .then(function() {
        return firebase.auth().signInWithEmailAndPassword(id, pw)
          .then(function(user) {})
          .catch(function(error) {
            var errorCode = error.code;
            var errorMsg = error.message;

            if (errorCode === 'auth/user-not-found') {
              alert('No such user.');
            } else if (errorCode === 'auth/wrong-password') {
              alert('Wrong password.');
            } else {
              alert(errorMsg);
            }
            console.log(error);
          });
      }).catch(function(error) {
        var errorCode = error.code;
        var errorMsg = error.message;
        console.log(errorMsg);
        alert('Something went wrong while configuring authentication system');
      });
  }
}

function init() {
  $('#already').hide();
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      user.getIdToken(true).then(function(idToken) {
        $.post('/adminlogin', {
          token: idToken
        }, function(response) {
          if (response === 'true') {
            $('#already').show();
            $('#login').attr('disabled', true);
            location.href = "admin.html";
          } else {
            alert("Is this administrator's account??");
            firebase.auth().signOut();
          }
        });
      });
    } else {
      $('#already').hide();
      $('#login').attr('disabled', false);
    }
  });
}

$(document).ready(function() {
  init();

  document.getElementById('ID').addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      signIn();
    }
  });
  document.getElementById('PW').addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      signIn();
    }
  })
});
