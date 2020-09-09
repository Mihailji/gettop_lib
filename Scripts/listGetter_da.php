<?php
date_default_timezone_set('UTC');
if ($_SERVER['REQUEST_METHOD'] === 'POST'){
  $getData = file_get_contents('php://input');
  $getData=json_decode($getData);
  $urlDA="https://www.donationalerts.com/api/v1/alerts/donations";

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
  function formObjectList($urlDA,$getData){
    $startTime=strtotime($getData->startTime);
    $resultArr=[];
    $header=array(
        "Content-Type: application/json",
        "Authorization: Bearer " . $getData->token
      );
    $nextPage=$urlDA;
    $errCount=10;

    do{
      try{
        $data = doCurlRequest($nextPage,$header);
        if(!is_array($data)){
          throw new Exception('!');
        }elseif(!array_key_exists("links", $data)){
          throw new Exception('!');
        }
        $nextPage=$data["links"]["next"];
        //echo '<pre>'; print_r($data); echo '</pre>';
        $data=$data['data'];
        foreach ($data as $donate) {
          $day=strtotime($donate["created_at"]);
          if ($startTime <= $day){
            $resultArr[]=(object)[
              'created_at' => $donate['created_at'],
              'username' => $donate['username'],
              'amount' => $donate['amount'],
              'currency' => $donate['currency']
            ];
          }else{
            break 2;
          }
        }
      }catch(Exception $e){
        $errCount--;
        if ($errCount >= 0){
          sleep(1);
        }else{
          break;
        }
      }
    }while ($nextPage != "");
    return $resultArr;
  }
  $unsortedList=formObjectList($urlDA,$getData);
  echo json_encode((object)['list' => $unsortedList]);
}
?>
