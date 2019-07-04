<?php
$id=$_POST['id']
$pw=$_POST['pw']
if($id=="admin" && $pw=="admin321"){
  echo 'S';
}else if($id=='admin'){
  echo 'I';
}else{
  echo 'P';
}
 ?>
