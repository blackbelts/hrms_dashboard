odoo.define('hrms_dashboard.Dashboard', function (require) {
  "use strict";
  var ajax = require('web.ajax');
  var ControlPanelMixin = require('web.ControlPanelMixin');
  var core = require('web.core');
  var Dialog = require('web.Dialog');
  var session = require('web.session');
  var rpc = require('web.rpc');
  var utils = require('web.utils');
  var web_client = require('web.web_client');
  var Widget = require('web.Widget');
  var _t = core._t;
  var QWeb = core.qweb;

  var HrDashboard = Widget.extend(ControlPanelMixin, {
    template: "HrDashboardMain",
    events: {
      /* 'click .hr_leave_request_approve': 'leaves_to_approve',
      'click .hr_leave_allocations_approve': 'leave_allocations_to_approve',
      'click .hr_timesheets': 'hr_timesheets',
      'click .hr_job_application_approve': 'job_applications_to_approve',
      'click .hr_payslip':'hr_payslip',
      'click .hr_contract':'hr_contract',
      'click .hr_employee':'hr_employee',
      'click .leaves_request_month':'leaves_request_month',
      'click .leaves_request_today':'leaves_request_today',
      "click .o_hr_attendance_sign_in_out_icon": function() {
          this.$('.o_hr_attendance_sign_in_out_icon').attr("disabled", "disabled");
          this.update_attendance();
      },
      'click #broad_factor_pdf': 'generate_broad_factor_report', */
    },
    init: function (parent, context) {
      this._super(parent, context);
      this.action_id = context.id;
      this._super(parent, context);

    },
    start: function () {
      var self = this;
      self.colors = ['rgba(34, 102, 102,1)', 'rgba(0,196,194,1)', 'rgba(60,141,188,0.9)', 'rgba(47,94,117,1)', 'rgba(51,34,136,1)', 'rgba(33,151,238)', 'rgba(255,63,121,1)', "rgba(255,211,70,1)", 'rgba(0,104,185,1)', 'rgba(46,135,190,1)', 'rgba(1,7,102,1)', 'rgba(30,132,208,1)', 'rgba(255,63,121,1)', 'rgba(92,0,32,1)']
      rpc.query({
          model: "dashboard",
          method: "get_dashboard",
        })
        .then(function (result) {
          if (result) {
            console.log(result)
            self.info = result;
            $('.o_hr_dashboard').prepend(QWeb.render('dashInfo', {
              widget: self
            }));
            $(".o_control_panel").addClass("o_hidden")
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
            });
            self.targetGraph(self.info["TargetGraph"])
            self.insurenceGraph(self.info["InsurerGraph"])
            self.lobGraph(self.info["Lob"])
          }
        });
    },
    makeNumber: function (x) {
      return parseFloat(x).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    },
    checkIndexOddEven: function (index) {
      if (index % 2 == 0)
        return "even"
      else
        return "odd"
    },
    insurenceGraph: function (data) {
      var datalist = [],
        labels = [],
        colors = ['rgba(34, 102, 102,1)', 'rgba(0,196,194,1)', 'rgba(60,141,188,0.9)', 'rgba(47,94,117,1)', 'rgba(51,34,136,1)', 'rgba(33,151,238)', 'rgba(255,63,121,1)', "rgba(255,211,70,1)", 'rgba(0,104,185,1)', 'rgba(46,135,190,1)', 'rgba(1,7,102,1)', 'rgba(30,132,208,1)', 'rgba(255,63,121,1)', 'rgba(92,0,32,1)'];
      data.forEach(function (item) {
        Object.keys(item).forEach(function (k) {
          if (k == "name")
            labels.push(item[k])
          else
            datalist.push(item[k])
        })
      })

      var a = {
        type: "doughnut",
        tooltipFillColor: "rgba(51, 51, 51, 0.55)",
        data: {
          labels: labels,
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

        content += "<tr>" + '<td><p><i class="fa fa-square" style="color:' + colors[i] + '"></i>' + labels[i] + "</p></td><td style='text-align:right'>" + parseFloat(item).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</td> </tr>"
        i++;

      })
      $("td .tile_info").append(content)
      $(".policypieChart").each(function () {
        var b = $(this);
        new Chart(b, a)
      })
    },
    targetGraph: function (data = []) {
      $("document").ready(function () {
        var ctx = $("#policylineChart");
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
            legend: !1,
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
      });
    },
    lobGraph: function (data = []) {
      var datalist = [],
        labels = [],
        sum = 0,
        labelIndex = 0,
        cont = '';
      data.forEach(function (item) {
        Object.keys(item).forEach(function (k) {
          if (k == "lob")
            labels.push(item[k])
          else
            datalist.push(item[k]);
        })
      })

      datalist.forEach(function (item) {
        cont += '<div class="widget_summary"><div class="w_left w_25">' +
          ' <span>' + labels[labelIndex] + '</span></div>' +
          '<div class="w_center w_55"><div class="progress"><div class="progress-bar bg-green" role="progressbar" aria-valuenow="' + ((item).toFixed(2)) + '" aria-valuemin="0"' +
          'aria-valuemax="100" style="width:' + ((item).toFixed(2)) + '%;"><!-- change width --> <span class = "sr-only" >Complete < /span> </div > </div> </div >' +
          '<div class="w_right w_20"><span>' + ((item).toFixed(2)) + ' %</span></div><div class="clearfix"></div></div>';
        labelIndex++;
      })
      $("#bars").append(cont);
    },
    returnClass: function (value) {
      console.log(value)
      if (value <= 0) {
        console.log(true)
        return true
      } else {
        console.log(false)
        return false
      }
    }
  });

  core.action_registry.add('hr_dashboard', HrDashboard);
  return HrDashboard;
});