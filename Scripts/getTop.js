var socketLib_priv = function(g, conf, numStr, setter) {
  /*here was the socket.io library*/
  function daAlerts() {
    var socket = io("wss://socket.donationalerts.ru:443");
    socket.emit('add-user', {
      token: conf.token_da,
      type: "1"
    });
    socket.on('donation', function(msg) {
      obj = JSON.parse(msg);
      if (obj.alert_type == 1) {
        console.log("socket:");
        console.log(obj);
        amount = parseFloat(obj.amount);
        mx = [obj.username, amount, obj.currency, obj.date_created];
        setter((ms, x) => {
          ms.add_da(x[0], x[1], x[2], x[3]);
        }, [mx, mx, mx]);
        g({
          set1: mass1.sorted(),
          set2: mass2.sorted(),
          set3: mass3.sorted(),
          string: numStr
        });
      };
    });
  }
  daAlerts();
}
//-----------------------------------------------------CLASS Massive
function Massive(times, set, base) {
  var unsorted = [];
  var sorted = new Map();
  var sorted_q = [];
  var self = this;
  this.sorted = function() {
    arr = [];
    for (var i = 0; i < base; i++) {
      arr[i] = {
        username: "",
        amount: 0
      };
    }
    var i = 0;
    for (el of sorted) {
      arr[i] = {
        username: el[0],
        amount: el[1]
      };
      i += 1;
    }
    arr = arr.concat(sorted_q);

    function compare(a, b) {
      return (a.amount > b.amount) ? -1 : ((b.amount > a.amount) ? 1 : 0);
    }
    arr.sort(compare);
    arr = arr.slice(0, base);
    return arr;
  };
  this.unsorted = function() {
    return unsorted;
  };

  function cut(unsorted, start_date, afunc = (a, b, c) => {}) {
    for (var i = unsorted.length - 1; i >= 0; i--) {
      if (start_date <= new Date(unsorted[i]['created_at'] + " UTC")) {
        break;
      }
      p = unsorted.pop();
      afunc(p.username, p.amount, p.currency);
    }
    return unsorted;
  }

  function toMap(listArr) {
    for (el of listArr) {
      if (sorted.has(el.username)) {
        sorted.set(el.username, sorted.get(el.username) + currConv(el.amount, el.currency));
      } else {
        sorted.set(el.username, currConv(el.amount, el.currency));
      }
    }
    return sorted;
  }

  function sortMap(listMap) {
    return new Map([...listMap.entries()].sort((a, b) => b[1] - a[1]));
  }

  function toSortedMap(listArr) {
    listMap = toMap(listArr);
    return sortMap(listMap);
  }

  function currConv(amount, currency) {
    if (currency in self.rates) {
      return amount * self.rates[currency];
    }
    return amount;
  }
  this.add_da = function(username, amount, currency, created_at) {
    cr_at = new Date(created_at + " UTC");
    i = 0;
    for (el of unsorted) {
      if (new Date(el['created_at'] + " UTC") <= cr_at) {
        break;
      }
      i = i + 1;
    }
    unsorted.splice(i, 0, {
      username,
      amount,
      currency,
      created_at
    });
    toMap([{
      username,
      amount,
      currency,
      created_at
    }]);
    /*    sorted=sortMap(sorted);
        return sorted;*/
    this.update();
  }
  this.add_qiwi = function([...arr]) {
    arr_res = [];
    for (el of arr) {
      arr_res.push({
        username: el.username,
        amount: currConv(el.amount, el.currency),
        qiwi: true
      });
    }
    sorted_q = arr_res;
  }
  this.init_da = function([...arr]) {
    unsorted = cut(arr, times[set]);
    sorted = toSortedMap(unsorted);
  }
  this.update = function() {
    afunc = function(username, amount, currency) {
      if (sorted.has(username)) {
        sorted.set(username, sorted.get(username) - currConv(amount, currency));
        if (sorted.get(username) == 0) {
          sorted.delete(username);
        }
      }
    }
    unsorted = cut(unsorted, times[set], afunc);
    sorted = sortMap(sorted);
    return sorted;
  }
}
//-----------------------------------------------------CLASS Get_top
function gettop(obj) {
  return new Get_top(obj);
}

function Get_top(obj) {
  var numStr = function(summ) {
    if (summ !== parseInt(summ, 10)) {
      summR = summ.toFixed(2);
    } else {
      summR = (parseFloat(summ.toFixed(2))).toString(10);
    }
    return summR;
  }
  var times = {
    get LAST_24_HOURS() {
      //return new Date(Date.now()-24*60000);
      cd = new Date();
      cd.setDate(cd.getDate() - 1);
      return cd;
    },
    get LAST_7_DAYS() {
      cd = new Date();
      cd.setDate(cd.getDate() - 7);
      return cd;
    },
    get LAST_30_DAYS() {
      cd = new Date();
      cd.setDate(cd.getDate() - 30);
      return cd;
    },
    get CURRENT_DAY() {
      cd = new Date();
      cd.setHours(0);
      cd.setMinutes(0);
      cd.setSeconds(0);
      cd.setMilliseconds(0);
      return cd;
    },
    get CURRENT_WEEK() {
      cd = this.CURRENT_DAY;
      day = cd.getDay();
      diff = cd.getDate() - day + (day == 0 ? -6 : 1);
      cd.setDate(diff);
      return cd;
    },
    get MONTH() {
      cd = this.CURRENT_DAY;
      cd.setDate(1);
      return cd;
    }
  }

  function initialTop(conf, g) {
    mass1 = new Massive(times, conf.set1, conf.base);
    mass2 = new Massive(times, conf.set2, conf.base);
    mass3 = new Massive(times, conf.set3, conf.base);

    function getRates() {
      $.ajax({
        type: "POST",
        url: "getCurrencyRates.php",
        dataType: "json",
        success: function(res) {
          Massive.prototype.rates = res;
          nextProc();
        }
      });
    }
    getRates();

    function nextProc() {
      socketLib_priv(g, conf, numStr, setter);

      function setter(func, x) {
        massx = [
          [mass1, "set1"],
          [mass2, "set2"],
          [mass3, "set3"]
        ];
        for (var i = 0; i < massx.length; i++) {
          if (conf[massx[i][1]]) {
            func(massx[i][0], x[i]);
          }
        }
      }

      function updaterQ(func) {
        setter((ms, x) => {
          ms.update();
        }, []);
        g({
          set1: mass1.sorted(),
          set2: mass2.sorted(),
          set3: mass3.sorted(),
          string: numStr
        });
        setTimeout(function() {
          func();
        }, 30000);
      }

      function updater() {
        setter((ms, x) => {
          ms.update();
        }, []);
        g({
          set1: mass1.sorted(),
          set2: mass2.sorted(),
          set3: mass3.sorted(),
          string: numStr
        });
        setTimeout(updater, 30000);
      }

      function initDA() {
        min_date = Math.min([times[conf.set1], times[conf.set2], times[conf.set3]]);
        d = new Date(min_date);
        dt = d.toUTCString();
        var reqData = JSON.stringify({
          token: conf.auth_token_da,
          startTime: dt
        });
        $.ajax({
          type: "POST",
          url: 'listGetter_da.php',
          data: reqData,
          dataType: "json",
          success: function(res) {
            setter((ms, x) => {
              ms.init_da(x);
            }, [res.list, res.list, res.list]);
            if (conf.token_qiwi) {
              updaterAndQiwi();
            } else {
              updater();
            }
          }
        });
      }
      if (conf.token_da) {
        initDA();
      } else if (conf.token_qiwi) {
        updaterAndQiwi();
      }

      function updaterAndQiwi() {
        var reqData = JSON.stringify({
          token: conf.token_qiwi,
          set1: conf.set1,
          set2: conf.set2,
          set3: conf.set3,
          base: conf.base
        });
        $.ajax({
          type: "POST",
          url: "listGetter_qiwi.php",
          data: reqData,
          dataType: "json",
          success: function(res) {
            setter((ms, x) => {
              ms.add_qiwi(x);
            }, [res[0], res[1], res[2]]);
          },
          complete: function(res) {
            updaterQ(updaterAndQiwi);
          }
        });
      }
    }
  }

  this.event = function(g) {
    function checks(el) {
      if (el == undefined || el == "") {
        el = false;
      }
    }
    for (var el in obj) {
      checks(el);
    }
    initialTop(obj, g);
  }
}
