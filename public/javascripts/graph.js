$(document).ready(function() {

  var currentDate= new Date();
  var lastOneDate = new Date(Date.parse(currentDate) - (1000 * 60 * 60 * 24 * 1));
  var lastTwoDate = new Date(Date.parse(currentDate) - (1000 * 60 * 60 * 24 * 2));
  var lastThreeDate = new Date(Date.parse(currentDate) - (1000 * 60 * 60 * 24 * 3));
  var lastFourDate = new Date(Date.parse(currentDate) - (1000 * 60 * 60 * 24 * 4));
  var lastFiveDate = new Date(Date.parse(currentDate) - (1000 * 60 * 60 * 24 * 5));
  var lastSixDate = new Date(Date.parse(currentDate) - (1000 * 60 * 60 * 24 * 6));
  var lastSevenDate = new Date(Date.parse(currentDate) - (1000 * 60 * 60 * 24 * 7));

  var currentDateString = (currentDate.getMonth() + 1) + "월" + currentDate.getDate()+ "일";
  var lastOneDateString = (lastOneDate.getMonth() + 1) + "월" + lastOneDate.getDate() + "일";
  var lastTwoDateString = (lastTwoDate.getMonth() + 1) + "월" + lastTwoDate.getDate() + "일";
  var lastThreeDateString = (lastThreeDate.getMonth() + 1) + "월" + lastThreeDate.getDate() + "일";
  var lastFourDateString = (lastFourDate.getMonth() + 1) + "월" + lastFourDate.getDate() + "일";
  var lastFiveDateString = (lastFiveDate.getMonth() + 1) + "월" + lastFiveDate.getDate() + "일";
  var lastSixDateString = (lastSixDate.getMonth() + 1) + "월" + lastSixDate.getDate() + "일";
  var lastSevenDateString = (lastSevenDate.getMonth() + 1) + "월" + lastSevenDate.getDate() + "일";

  var data1 = $(".data1").val();
  var data2 = $(".data2").val();
  var data3 = $(".data3").val();
  var data4 = $(".data4").val();
  var data5 = $(".data5").val();
  var data6 = $(".data6").val();
  var data7 = $(".data7").val();

  var intData1 = parseInt(data1);
  var intData2 = parseInt(data2);
  var intData3 = parseInt(data3);
  var intData4 = parseInt(data4);
  var intData5 = parseInt(data5);
  var intData6 = parseInt(data6);
  var intData7 = parseInt(data7);




  var c1 = document.getElementById("c1");
  var parent = document.getElementById("p1");
  c1.width = parent.offsetWidth - 40;
  c1.height = parent.offsetHeight - 40;

  var data1 = {
    labels : [lastSevenDateString,lastSixDateString,lastFiveDateString,lastFourDateString,lastThreeDateString,lastTwoDateString,lastOneDateString] ,
    datasets : [
      {
        fillColor : "#eee",
        strokeColor : "#22313f",
        pointColor : "#fff",
        pointStrokeColor : "#26a65b",
        data : [intData1,intData2,intData3,intData4,intData5,intData6,intData7]
      }
    ]
  }

  var options1 = {
    scaleFontColor : "#22313f",
    scaleLineColor : "#22313f",
    scaleGridLineColor : "transparent",
    bezierCurve : false,
    scaleOverride : true,
    scaleSteps : 5,
    scaleStepWidth : 100,
    scaleStartValue : 0,
  }

  new Chart(c1.getContext("2d")).Line(data1,options1)
});