<?php
date_default_timezone_set('UTC');
if ($_SERVER['REQUEST_METHOD'] === 'POST'){
  $getData = file_get_contents('php://input');
  $getData=json_decode($getData);

  function doCurlRequest($url,$header=array()){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
  }
  //------------------------------------------------------------------------
  function retriveDataQiwi($period,$token,$base){
    $result=array();
    if($period!="false"){
      $url="https://donate.qiwi.com/api";
      $urlP = "{$url}/stream/v1/aggregates/{$token}/top-senders?limit={$base}&period={$period}";
      $data = doCurlRequest($urlP);
      for($errCount=0;$errCount<3;$errCount++){
        if(is_array($data)){
          if(array_key_exists("senders", $data)){
            foreach ($data['senders'] as $key => $value) {
              $result[]=array( 'username' => $value['senderName'],
              'amount' => $value['totalAmount']['value'],
              'currency' => $value['totalAmount']['currency']);
            }
            break;
          }
        }
        sleep(1);
      }
    }
    return $result;
  }
  echo json_encode(array(
    retriveDataQiwi($getData->set1,$getData->token,$getData->base),
    retriveDataQiwi($getData->set2,$getData->token,$getData->base),
    retriveDataQiwi($getData->set3,$getData->token,$getData->base)
  ));
}
?>
