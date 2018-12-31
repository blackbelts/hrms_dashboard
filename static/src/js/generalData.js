/* Api Url */
var odooUrl = "http://178.128.197.205/odooApi/index.php?",
  /* Auth user id */
  uid = '1',
  /* auth user passwrod */
  password = 'admin',
  /* monthesNames => list contain monthes short names */
  monthesNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."],
  /* dataSets=> list of data sets that must be draw */
  dataSets = [],
  /* colors=> list of colors for graphs */
  colors = ['rgba(34, 102, 102,1)', 'rgba(0,196,194,1)', 'rgba(60,141,188,0.9)', 'rgba(47,94,117,1)', 'rgba(51,34,136,1)', 'rgba(33,151,238)', 'rgba(255,63,121,1)', "rgba(255,211,70,1)", 'rgba(0,104,185,1)', 'rgba(46,135,190,1)', 'rgba(1,7,102,1)', 'rgba(30,132,208,1)', 'rgba(255,63,121,1)', 'rgba(92,0,32,1)'],
  /* 
   *graphlist=> contain a list of graphs in the page 
   * for mutli tab graph to solve problem of graph not working in tabs
   * problem  details => graph worked on the active tab only 
   * use this list to store graphs in a page 
   * for can refresh the graph when active tab change
   */
  graphlist = [],
  agentsNumber;
$(function () {
  if (window.matchMedia('(max-width: 775px)').matches) {
    $("#policylineChart").get(0).height = 210;
    $(".policypieChart").get(0).height = 150;
    $(".policypieChart").get(0).width = 90
  } else if (window.matchMedia('(max-width: 1024px)').matches) {
    $("#policylineChart").get(0).height = 160;
    $(".policypieChart").get(0).height = 150;
    $(".policypieChart").get(0).width = 90
  } else {
    $("#policylineChart").get(0).height = 160;
    $(".policypieChart").get(0).height = 135;
    $(".policypieChart").get(0).width = 90
  }
  getThisYearMonthes();
  /* 
  var domains = [];
  *this var for contains Odoo domins list 
  *must be initialize before ever Query or request ajax
  */
  var domains = [];
  /*
  var maps = [];
  * this var for contains Odoo mapping list 
  * must be initialize before ever Query or request ajax
  */
  var maps = [];
  // add domain object like object Domain ProtoType to domains list
  domains.push(new Domain("active", "%3D", "true"))
  /*
   *this function make ajax request to get number of agents from server
   * write it in html file 
   */

  ajaxRequest(uid, password, "crm.lead", "search_read", [new Domain("active", "%3D", "true")], [new Map("fields", ["planned_revenue", "probability"])])
    .then(function (r) {
      var sumExpected = 0;
      var sumProb = 0;
      r.forEach(function (opp) {
        sumExpected += opp.planned_revenue;
        sumProb += opp.probability;
      });
      $("#expected-prem-num").html(makeNumber(Math.ceil(sumExpected.toFixed(2))) + " $");
      $("#expected-prem-prob").html((sumProb / r.length).toFixed(2) + "%");

    })
  ajaxRequest(uid, password, "policy.broker", "search_read", [], [new Map("fields", ["gross_perimum", "t_permimum"])])
    .then(function (r) {
      var sumGross = 0;
      var sumNet = 0;
      r.forEach(function (p) {
        sumGross += p.gross_perimum;
        sumNet += p.t_permimum;
      });
      $("#premium-written-gross").html(makeNumber(Math.ceil(sumGross.toFixed(2))) + " $");
      $("#premium-written-net").html(makeNumber(Math.ceil(sumNet.toFixed(2))) + " $");

    })
  ajaxRequest(uid, password, "insurance.claim", "search_read", [], [new Map("fields", ["totalsettled", "total_paid_amount"])])
    .then(function (r) {
      var sumTotalSettled = 0;
      var sumPaid = 0;
      r.forEach(function (c) {
        sumTotalSettled += c.totalsettled;
        sumPaid += c.total_paid_amount;
      });
      $("#claim-settled").html(makeNumber(Math.ceil(sumTotalSettled.toFixed(2))) + " $");
      $("#claim-paid").html(makeNumber(Math.ceil(sumPaid.toFixed(2))) + " $");
    })
  ajaxRequest(uid, password, "policy.broker", "search_read", [], [new Map("fields", ["total_commision", "com_commision"])])
    .then(function (r) {
      var sumB = 0;
      var sumCom = 0;
      r.forEach(function (c) {
        sumB += c.total_commision;
        sumCom += c.com_commision;
      });
      $("#brokerage-b").html(makeNumber(Math.ceil(sumB.toFixed(2))) + " $");
      $("#brokerage-percom").html(makeNumber(Math.ceil(sumCom.toFixed(2))) + " $");
    })

  ajaxRequest(uid, password, "account.invoice", "search_read", [], [new Map("fields", ["amount_total_signed", "residual_signed"])])
    .then(function (r) {
      var sumamount_total_signed = 0;
      var sumresidual_signed = 0;
      r.forEach(function (c) {
        sumamount_total_signed += c.amount_total_signed;
        sumresidual_signed += c.residual_signed;
      });
      $("#ostax").html(makeNumber(Math.ceil(sumamount_total_signed.toFixed(2))) + " $");
      $("#osuntax").html(makeNumber(Math.ceil(sumamount_total_signed.toFixed(2) - sumresidual_signed.toFixed(2))) + " $");
    })

  ajaxRequest(uid, password, "policy.broker", "search_read", [], [new Map("fields", ["t_permimum"])], '', [], true)
    .then(function (r) {
      var datalist = [],
        sum = 0,
        labelIndex = 0,
        cont = '';
      Object.keys(r).forEach(function (k) {
        datalist.push(calcTotal(JSON.parse(r[k])));
        sum += calcTotal(JSON.parse(r[k]))
      })
      datalist.forEach(function (item) {
        cont += '<div class="widget_summary"><div class="w_left w_25">' +
          ' <span>' + Object.keys(r)[labelIndex] + '</span></div>' +
          '<div class="w_center w_55"><div class="progress"><div class="progress-bar bg-green" role="progressbar" aria-valuenow="' + ((item / sum).toFixed(2)) * 100 + '" aria-valuemin="0"' +
          'aria-valuemax="100" style="width:' + ((item / sum).toFixed(2)) * 100 + '%;"><!-- change width --> <span class = "sr-only" >Complete < /span> </div > </div> </div >' +
          '<div class="w_right w_20"><span>' + ((item / sum).toFixed(2)) * 100 + ' %</span></div><div class="clearfix"></div></div>';
        labelIndex++;
      })
      $("#bars").append(cont);
    })
  ajaxRequest(uid, password, "calendar.event", "search_read", [], [new Map("fields", ["name", "display_start" /* , "display_time", "stop_datetime", "attendee_ids", "location", "duration" */ ]), new Map("limit", ["5"]), new Map("order", ["display_start desc"])])
    .then(function (res) {
      var tableContent = "";
      var index = 0;
      res.forEach(function (meeting) {
        if (index % 2 == 0)
          tableContent += '<tr class="even pointer">';
        else
          tableContent += '<tr class="odd pointer">'
        tableContent += "<td>" + meeting.name + "</td>" +
          "<td>" + meeting.display_start + "</td>"
        /* +"<td>" + meeting.stop_datetime + "</td>" +
        "<td>" + meeting.attendee_ids.length + " record" + "</td>" +
        "<td>" + meeting.location + "</td>";
        var duration = ""
        if (Math.floor(meeting.duration).toString().length == 1)
        duration += "0" + Math.floor(meeting.duration) + ":";
        else
        duration += Math.floor(meeting.duration) + ":";
        if (((meeting.duration - Math.floor(meeting.duration)) * 60).toString().length == 1)
        duration += "0" + (Math.ceil((meeting.duration - Math.floor(meeting.duration)) * 60));
        else
        duration += (Math.ceil((meeting.duration - Math.floor(meeting.duration)) * 60)); */
        tableContent += /* "<td>" + duration + "</td>" + */ '</tr>';
      })
      index++;
      $("#meetings").html(tableContent);
    });
  ajaxRequest(uid, password, "crm.lead", "search_read", [new Domain("type", "%3D", "opportunity"), new Domain("active", "%3D", "true")], [new Map("fields", ["display_name", /* "type", */ "LOB", "term", "planned_revenue", "probability", /*"stage_id", "team_id", "user_id", "insurance_type",*/ "partner_id"]), new Map("limit", [5]), new Map("order", ["planned_revenue desc"])])
    .then(function (res) {
      var tableContent = "";
      var index = 0
      res.forEach(function (opp) {
        if (index % 2 == 0)
          tableContent += '<tr class="even pointer">';
        else
          tableContent += '<tr class="odd pointer">'
        tableContent += /* "<td>" + opp.insurance_type + "</td>" + */
          /*  "<td>" + opp.LOB[1] + "</td>" + */
          /* "<td>" + opp.partner_id[1] + "</td>" + */
          "<td>" + opp.display_name + "</td>" +
          /*  "<td>" + opp.term + "</td>" + */
          "<td class=text-right>" + makeNumber(opp.planned_revenue) + " $" + "</td>" +
          /* "<td>" + opp.probability + "</td>" + */
          /* "<td>" + opp.stage_id[1] + "</td>" +
          "<td>" + opp.team_id[1] + "</td>" +
          "<td>" + opp.user_id[1] + "</td>" + */
          '</tr>';
        index++;
      })
      $("#opportunities").html(tableContent);
    });
  ajaxRequest(uid, password, "insurance.claim", "search_read", [], [new Map("fields", ["insured", "lob", "insurer", "product", "customer_policy", "policy_number", "name", "totalclaimexp", "totalsettled", "total_paid_amount", "claimstatus"]), new Map("limit", [5]), new Map("order", ["totalclaimexp desc"])])
    .then(function (res) {
      var tableContent = "";
      var index = 0
      res.forEach(function (claim) {
        if (index % 2 == 0)
          tableContent += '<tr class="even pointer">';
        else
          tableContent += '<tr class="odd pointer">'
        tableContent += "<td>" + claim.insured + "</td>" +
          "<td>" + claim.lob[1] + "</td>" +
          "<td>" + claim.insurer[1] + "</td>" +
          "<td>" + claim.product[1] + "</td>" +
          "<td>" + claim.customer_policy[1] + "</td>" +
          "<td>" + claim.policy_number[1] + "$" + "</td>" +
          "<td>" + claim.name + "</td>" +
          "<td class=text-right>" + makeNumber(claim.totalclaimexp) + "</td>" +
          "<td class=text-right>" + makeNumber(claim.totalsettled) + "</td>" +
          "<td class=text-right>" + makeNumber(claim.total_paid_amount) + "</td>" +
          "<td>" + claim.claimstatus + "</td>" +
          '</tr>';
        index++;
      })
      $("#claims").html(tableContent)
    });
  ajaxRequest(uid, password, "policy.broker", "search_read", [], [new Map("fields", ["insurance_type", "line_of_bussines", "company", "product_policy", "customer", "std_id", "edit_number", "renwal_check", "issue_date", "start_date", "end_date", "gross_perimum", "t_permimum"]), new Map("limit", [5]), new Map("order", ["gross_perimum desc"])])
    .then(function (res) {
      var tableContent = "";
      var index = 0
      res.forEach(function (p) {
        if (index % 2 == 0)
          tableContent += '<tr class="even pointer">';
        else
          tableContent += '<tr class="odd pointer">'
        var ch = p.renwal_check == false ? "" : "checked";
        tableContent += "<td>" + p.insurance_type + "</td>" +
          "<td>" + p.line_of_bussines[1] + "</td>" +
          "<td>" + p.company[1] + "</td>" +
          "<td>" + p.product_policy[1] + "</td>" +
          "<td>" + p.customer[1] + "</td>" +
          "<td>" + p.std_id + "</td>" +
          "<td>" + p.edit_number + "</td>" +
          "<td> <input type='checkbox'" + ch + "></td>" +
          "<td>" + p.issue_date + "</td>" +
          /* "<td>" + p.start_date + "</td>" +
          "<td>" + p.end_date + "</td>" +
          "<td>" + p.gross_perimum + "</td>" + */
          "<td class=text-right>" + makeNumber(p.t_permimum) + "</td>" +
          '</tr>';
        index++;
      })
      $("#policyes").html(tableContent)
    });
  ajaxRequest(uid, password, "res.partner", "search_count", [new Domain("active", "%3D", "true"), new Domain("agent", "%3D", "true")], maps)
    // for return result correctly
    .then(function (r) {
      maps = [];
      agentsNumber = r;
      $("#agents #agents-number").text(makeNumber(Math.ceil(r)));
    }).then(function (t) {
      //get agent graph data
      var monthes = getMonths(),
        monthesNamelsit = [];
      monthes.forEach(function (m) {
        monthesNamelsit.push(monthesNames[new Date(m).getMonth()] + new Date(m).getFullYear().toString());
      })
      monthesNamelsit.splice(0, 1);
      dataSets = [];
      /*  ajaxRequest(uid, password, "res.partner", "search_count", [new Domain("active", "%3D", "true"), new Domain("agent", "%3D", "true")], maps, monthes)
      .then(function (re) {
      var ratio = (((re[0] - re[1]) / re[1]) * 100).toFixed(1);
      if (re[1] == 0 && re[0] == 0) {
      ratio = 0
      } else if (re[1] == 0) {
      ratio = 100
      }
      if (ratio < 0) {
      $("#agents .ratio i").attr("class", "red")
      } else(
      $("#agents .ratio i").attr("class", "green")
      )
      $("#agents .ratio i").html($("#agents .ratio i").html() + ratio + "%")
      }) */
      ajaxRequest(uid, password, "crm.lead", "search_count", [new Domain("type", "%3D", "lead")], [], '', [])
        // for return result correctly
        .then(function (r) {
          maps = [];
          $("#leads #leads-number").text(makeNumber(Math.ceil(r)));
          $("#leads .box-body strong").get(0).innerHTML = ((r / agentsNumber).toFixed(2));
        }).then(function (t) {
          dataSets = [];
          var mo = [];
          mo = getThisYearMonthes()
          /* ajaxRequest(uid, password, "crm.lead", "search_count", [new Domain("type", "%3D", "lead")], '', [], "create_date3",getThisYearMonthes()) */
          ajaxRequest(uid, password, "crm.lead", "search_count", [new Domain("type", "%3D", "lead")], [], "create_date", getThisYearMonthes())
            .then(function (re) {
              var ratio = (((re[0] - re[1]) / re[1]) * 100).toFixed(1);
              if (re[1] == 0) {
                ratio = 100;
                $("#leads .ratio i").attr("class", "green")
              } else {
                if (ratio < 0) {
                  $("#leads .ratio i").attr("class", "red")
                } else(
                  $("#leads .ratio i").attr("class", "green")
                )
              }
              $("#leads .ratio i").html($("#leads .ratio i").html() + ratio + "%");

            })
        })
      getValuesNewAdmin("#new", "crm.lead", "search_read", [new Domain("stage_id", "%3D", "New"), new Domain("type", "%3D", "opportunity")], [new Map("fields", ["planned_revenue"])], monthes)
      getValuesNewAdmin("#qualified", "crm.lead", "search_read", [new Domain("stage_id", "%3D", "Qualified"), new Domain("type", "%3D", "opportunity")], [new Map("fields", ["planned_revenue"])], monthes)
      getValuesNewAdmin("#proposition", "crm.lead", "search_read", [new Domain("stage_id", "%3D", "Proposition"), new Domain("type", "%3D", "opportunity")], [new Map("fields", ["planned_revenue"])], monthes)
      getValuesNewAdmin("#won", "crm.lead", "search_read", [new Domain("stage_id", "%3D", "Won"), new Domain("type", "%3D", "opportunity")], [new Map("fields", ["planned_revenue"])], monthes)
      getValuesNewAdmin("#lost", "crm.lead", "search_read", [new Domain("active", "!%3D", "true")], [new Map("fields", ["planned_revenue"])], monthes)
    })
  /*Draw line chart  for policy */
  var data = []
  var monthes = getThisYearMonthes(),
    monthesNamelsit = [],
    sum = 0;
  ajaxRequest(uid, password, "policy.broker", "search_read", [], [new Map("fields", ["t_permimum"])], "issue_date", monthes.reverse())
    .then(function (re) {
      re.reverse().forEach(function (month) {
        m = JSON.parse(month)
        if (m.length != 0)
          m.forEach(function (item) {
            sum += item.t_permimum
          })
        data.push(sum)
      })
      var ctx = document.getElementById("policylineChart");

      var lineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          datasets: [{
            label: "Net permimum",
            backgroundColor: "rgba(38, 185, 154, 0.31)",
            borderColor: "rgba(38, 185, 154, 0.7)",
            pointBorderColor: "rgba(38, 185, 154, 0.7)",
            pointBackgroundColor: "rgba(38, 185, 154, 0.7)",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointBorderWidth: 1,
            data: data,
            steppedLine: true,
            lineTension: 0,
            fill: false,
          }, {
            label: "Target Line",
            backgroundColor: "rgba(38,89,144, 0.3)",
            borderColor: "rgba(38,89,144, 0.70)",
            pointBorderColor: "rgba(38,89,144, 0.70)",
            pointBackgroundColor: "rgba(38,89,144, 0.70)",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(38,89,144,1)",
            pointBorderWidth: 1,
            data: [100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000],
            fill: false,
          }]
        },
        options: {
          responsive: true,
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });
    })
  /* Bar Chart*/
  ajaxRequest(uid, password, "policy.broker", "search_read", [], [new Map("fields", ["t_permimum"])], '', [], false, true)
    .then(function (r) {
      var datalist = [],
        labels = []
      Object.keys(r).forEach(function (k) {
        datalist.push(calcTotal(JSON.parse(r[k])))
      })

      var a = {
        type: "doughnut",
        tooltipFillColor: "rgba(51, 51, 51, 0.55)",
        data: {
          labels: Object.keys(r),
          datasets: [{
            data: datalist,
            backgroundColor: colors.slice(0, datalist.length),
            hoverBackgroundColor: colors.slice(0, datalist.length)
          }]
        },
        options: {
          legend: !1,
          responsive: !1
        }
      };
      var content = "",
        i = 0;
      datalist.forEach(function (item) {

        content += "<tr>" + '<td><p><i class="fa fa-square" style="color:' + colors[i] + '"></i>' + Object.keys(r)[i] + "</p></td><td style='text-align:right'>" + makeNumber(item) + "</td> </tr>"
        i++;
      })
      $("td .tile_info").append(content)
      $(".policypieChart").each(function () {
        var b = $(this);
        new Chart(b, a)
      })
    })
});

function getValuesNewAdmin(conntId, modal, method, dom = [], m = [], month = []) {
  ajaxRequest(uid, password, modal, method, dom, m, '', [])
    // for return result correctly
    .then(function (r) {
      maps = [];
      $(conntId + " #new_prem").text(makeNumber(Math.ceil(clacPre(r).toFixed(1))) + " $");
      $(conntId + " .box-body strong").get(0).innerHTML = r.length;
      $(conntId + " .box-body strong").get(1).innerHTML = ((clacPre(r) / r.length).toFixed(2));
      $(conntId + " .box-body strong").get(2).innerHTML = ((clacPre(r) / agentsNumber).toFixed(2));
      $(conntId + " .box-body strong").get(3).innerHTML = ((r.length / agentsNumber).toFixed(2));
    }).then(function () {
      //get agent graph data
      ajaxRequest(uid, password, modal, method, dom, m, 'create_date', month)
        .then(function (re) {
          var fMonth = clacPre(JSON.parse(re[0])),
            sMonth = clacPre(JSON.parse(re[1]));
          var ratio = (((fMonth - sMonth) / sMonth) * 100).toFixed(1);
          if (fMonth == 0 && sMonth == 0)
            ratio = 0;
          if (sMonth == 0) {
            ratio = 100;
            $(conntId + " .ratio i").attr("class", "green")
          } else {
            if (ratio < 0) {
              $(conntId + " .ratio i").attr("class", "red")
            } else(
              $(conntId + " .ratio i").attr("class", "green")
            )
          }
          $(conntId + " .ratio i").html($(conntId + " .ratio i").html() + ratio + "%");
        })
    })
}

function clacPre(array = []) {
  sum = 0;
  array.forEach(function (item) {
    sum += item.planned_revenue
  });
  return sum
}

function calcTotal(array = []) {
  sum = 0;
  array.forEach(function (item) {
    sum += item.t_permimum
  });
  return sum
}
/* 
 * map object protoType
 * prop => like fields,limit,order ...
 * prop_values => values of prop that must be contain
 */
function Map(prop, prop_values = []) {
  this.prop = prop;
  this.prop_values = prop_values;
}
/* 
 * Domain object protoType
 * f => field name to execute on it query
 * e => experation like =,<,> ...
 * value => value of f
 */
function Domain(f, e, v) {
  this.filed = f;
  this.experation = e;
  this.value = v;
}

function Graph(data, options, type) {
  this.data = data;
  this.options = options;
  this.type = type;
}
/* this function for login  */
function login(username, password) {
  $.ajax({
    url: odooUrl + "username=" + username + "&password=" + password,
    method: "GET",
    beforeSend: function (r) {
      //r.setRequestHeader("Access-Control-Allow-Origin","*")
    },
    error: function (e) {
      console.log(e)
    },
    success: function (result) {}
  })
}

function ajaxRequest(uid, password, modal, method, domains = [], mapList = [], monthCompreColume = '', monthesdata = [], lob, ins) {
  return $.ajax({
    url: makeHttpUrl(uid, password, modal, method, domains, mapList),
    method: "GET",
    dataType: 'json',
    data: {
      compColm: monthCompreColume,
      months: JSON.stringify(monthesdata),
      lob: JSON.stringify(lob),
      ins: JSON.stringify(ins)
    },
    error: function (e) {
      console.log(e)
    },
    success: function (r) {
      result = parseInt(JSON.parse(JSON.stringify(r)))
    }
  })
}
/*
 * return url Format
 */
function makeHttpUrl(uid, password, modal, method, domains = [], mapList = []) {
  /*  console.log(odooUrl +
  "uid=" + uid +
  "&password=" + password +
  "&modalname=" + modal +
  "&method=" + method +
  makeDomainQuery(domains) +
  makeMappingList(mapList)) */
  return (
    odooUrl +
    "uid=" + uid +
    "&password=" + password +
    "&modalname=" + modal +
    "&method=" + method +
    makeDomainQuery(domains) +
    makeMappingList(mapList)
  );
}

function makeMappingList(mapList = []) {
  if (mapList.length != 0) {
    var mapStr = "&mappinglist[";
    var j = 0;
    mapList.forEach(map => {
      if (map.prop == "fields") {
        for (var i = 0; i < map.prop_values.length; i++) {
          mapStr += map.prop + "][" + i + "]=" + map.prop_values[i];
          if (i < map.prop_values.length - 1) {
            mapStr += "&mappinglist[";
          }
        }
      } else {
        mapStr += map.prop + "]"
        for (var i = 0; i < map.prop_values.length; i++) {
          mapStr += "=" + map.prop_values[i];
          if (i < map.prop_values.length - 1) {
            mapStr += "&mappinglist[";
          }
        }
      }
      j++;
      if (j < mapList.length) mapStr += "&mappinglist[";
    });
    return mapStr;
  } else {
    return "";
  }
}
/* make domain string */
function makeDomainQuery(domains = []) {
  var domainStr = "&parmlist[0]";
  if (domains.length != 0) {
    var i = 0;
    domains.forEach(dom => {
      domainStr += "[" + i + "]" + "[0]=" +
        dom.filed + "&parmlist[0]" + "[" +
        i + "][1]=" + dom.experation +
        "&parmlist[0]" + "[" + i + "][2]=" + dom.value;
      i++;
      if (i < domains.length) domainStr += "&parmlist[0]";
    });
    return domainStr;
  } else {
    return "";
  }
}
/* 
 *****get Months dates*****
 * this function return alist contain 13 date for months that must work on it
 * ever element on this list it's format is MM-DD-MM HH:MM:SS
 * it return 13 element to get 12 node or value from odoo 
 * every node return values between current element and next element
 */
function getMonths() {
  var date = new Date(),
    month = date.getMonth() + 1,
    monthsList = [],
    yearChanged = false
  for (var i = 0; i < 13; i++) {
    if (month < 0) {
      if (!yearChanged) {
        yearChanged = true
        date.setYear(date.getFullYear() - 1);
      }
      date.setMonth(month + 12);
    } else {
      date.setMonth(month);
    }
    date.setDate(1);
    date.setHours(00);
    date.setSeconds(00);
    date.setMilliseconds(00);
    date.setMinutes(00);
    /*
     * the next code push month date to months list 
     * convert month date to MM-DD-YYYY HH:MM:SS 
     */
    monthsList.push([date.getMonth() + 1,
      date.getDate(),
      date.getFullYear()
    ].join('-') + ' ' + [date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    ].join(':'));
    month--;
  }
  return monthsList
}

function getThisYearMonthes() {
  var thisYear = new Date().getFullYear(),
    date = new Date(),
    thisMonth = new Date().getMonth()
  monthsList = [],
    breakLoop = false;
  for (let i = 0; i < 13; i++) {
    date.setDate(1);
    date.setHours(00);
    date.setSeconds(00);
    date.setMilliseconds(00);
    date.setMinutes(00);
    date.setMonth(i);
    date.setFullYear(thisYear)
    if (i == 12)
      date.setFullYear(thisYear + 1)
    /*
     * the next code push month date to months list 
     * convert month date to MM-DD-YYYY HH:MM:SS 
     */
    monthsList.push([date.getMonth() + 1,
      date.getDate(),
      date.getFullYear()
    ].join('-') + ' ' + [date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    ].join(':'));
    if (i == thisMonth + 1) {
      break
    }

    if (breakLoop)
      break;
  }
  return monthsList
}

function makeNumber(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}