$(document).ready(function() {
  $("#login").click(function() {
    var id = $("#ID").val();
    var pw = $("#PW").val();

    if (id == '') {
      alert('Fill ID');
    } else if (pw == '') {
      alert('Fill PW');
    } else {
      if (id === 'admin' && pw === 'admin321') {
        location.href = 'admin.html';
      }
      /*$.post("login.php", {
        id: id,
        pw: pw
      }, function(data) {
        if (data === 'I' || data === 'P') {
          alert("Invalid account");
        } else if (data === 'S') {
          location.href = 'admin.html';
        } else {
          alert("???????");
        }
      })*/
    }
  })
})
