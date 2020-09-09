<?php
date_default_timezone_set('UTC');
$currFile="../ratesjson/currencyRates.json";
$period=strtotime(date('Y-m-d H:i:s')."-12 hours");
function doCurlReq($url,$header=array()){
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  $result = curl_exec($ch);
  curl_close($ch);
  return json_decode($result, true);
}
$fileData=file_get_contents($currFile);
$fileData=json_decode($fileData, true);
$lastTime=strtotime($fileData["lasttime"]);
if ($lastTime < $period){
  $answer=doCurlReq("http://apilayer.net/api/live?access_key=TOKEN&currencies=BRL,BYN,EUR,KZT,UAH,RUB&source=USD&format=1");
  for($errCount=0;$errCount<3;$errCount++){
    if(is_array($answer)){
      if(array_key_exists("quotes", $answer)){
        $fileData["BRL"]=$answer["quotes"]["USDRUB"]/$answer["quotes"]["USDBRL"];
        $fileData["BYN"]=$answer["quotes"]["USDRUB"]/$answer["quotes"]["USDBYN"];
        $fileData["EUR"]=$answer["quotes"]["USDRUB"]/$answer["quotes"]["USDEUR"];
        $fileData["KZT"]=$answer["quotes"]["USDRUB"]/$answer["quotes"]["USDKZT"];
        $fileData["UAH"]=$answer["quotes"]["USDRUB"]/$answer["quotes"]["USDUAH"];
        $fileData["USD"]=$answer["quotes"]["USDRUB"];
        $fileData["lasttime"]=date('Y-m-d H:i:s');
        file_put_contents($currFile, json_encode($fileData));
        break;
      }
    }
    sleep(1);
  }
}
echo json_encode($fileData);
?>
