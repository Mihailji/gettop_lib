  var gt=gettop({
    token_da: "<TOKEN_DA>",
    auth_token_da: "<AUTH_TOKEN_DA>",
    token_qiwi: "<TOKEN_QIWI>",
    set1: "CURRENT_DAY",// MONTH, CURRENT_WEEK, CURRENT_DAY, LAST_30_DAYS, LAST_7_DAYS, LAST_24_HOURS
    set2: "CURRENT_WEEK",
    set3: "MONTH",
    base: 5// amount of items in array
  });
  gt.event(function(obj){
    console.log(obj.string(obj.set1[0].amount));
    console.log(obj.set1);
    console.log(obj.set2);
    console.log(obj.set3);
  });
