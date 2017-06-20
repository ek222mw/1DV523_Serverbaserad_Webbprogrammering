/*jshint esversion: 6*/

var crawl = require("./lib/crawler");
// input args.
var args = process.argv.slice(2);
var arr;
var extractedLinks;
var daysavaible;
var domainName;
var cinemaResult;
var countFriday = 0;
var countSaturday = 0;
var countSunday = 0;
var cinemaDetails;
var loginpath;

if (args.length === 0) {
    console.log("Error: No arguments.");
    process.exit(0);
}


// Chained promises.
crawl.extractLinks(args).then(function(linkArr) {


        return Promise.resolve(linkArr);

    })
    .then(function(linkArr) {

          extractedLinks = linkArr;
          //extract links.
          return crawl.extractLinks([linkArr[0]]).then(function(linkArr2){

            return linkArr2;
          });

    }).then(function(linkarray2)
    {
      //extract calender details.
      return crawl.extractCalendar(linkarray2).then(function(calenderArr){

        return calenderArr;
      });

    }).then(function(daysavai)
    {
      daysavaible = daysavai;
      //extract cinema details
      return crawl.extractCinema([extractedLinks[1]]).then(function(cinemaArr){

        return cinemaArr;
      });

    }).then(function(resultExistingMoviesDays)
    {

      var fridaystr ="fridayok";
      var saturdaystr = "saturdayok";
      var sundaystr = "sundayok";
      cinemaDetails = resultExistingMoviesDays;
      //count how many of the friends that can meet each day.
      for(var i = 0; i<daysavaible.length; i++)
      {

        if(daysavaible[i].toUpperCase() === fridaystr.toUpperCase())
        {
          countFriday++;
        }
        if(daysavaible[i].toUpperCase() === saturdaystr.toUpperCase())
        {
          countSaturday++;
        }
        if(daysavaible[i].toUpperCase() === sundaystr.toUpperCase())
        {
          countSunday++;
        }

      }
      //if none of the friends can meet in the weekend , console message and exit app.
      if(countFriday < 3 & countSaturday < 3 & countSunday < 3)
      {
        console.log("Meeting unavailable, no day where the three friends can meet.");
        process.exit(0);
      }

      var friday = "-";
      var saturday = "-";
      var sunday = "-";


      if(countFriday === 3)
      {
        friday = resultExistingMoviesDays[0];
      }
      if(countSaturday === 3)
      {
        saturday = resultExistingMoviesDays[1];
      }
      if(countSunday === 3)
      {
        sunday = resultExistingMoviesDays[2];
      }

      var getArr = [];
      //for loop that puts url in array.
      for(var j=1;j<4; j++)
      {
        if(friday === resultExistingMoviesDays[0])
        {

          getArr.push(extractedLinks[1]+'/check?day='+friday+'&movie=0'+j);
        }
        if(saturday === resultExistingMoviesDays[1])
        {

          getArr.push(extractedLinks[1]+'/check?day='+saturday+'&movie=0'+j);
        }
        if(sunday === resultExistingMoviesDays[2])
        {

            getArr.push(extractedLinks[1]+'/check?day='+sunday+'&movie=0'+j);
        }

      }

      //get JSON body for all days available
      return crawl.extractCinemaJsonBody(getArr).then(function(body)
      {
        return body;

      });



    }).then(function(cinemaRes)
    {

      cinemaResult= cinemaRes;
      //gets the login path.
      return crawl.extractLoginPath([extractedLinks[2]]).then(function(loginpa)
      {
          return loginpa;
      });



    }).then(function(loginp)
    {
      loginpath= loginp;

    }
    ).then(function(cookiepath)
    { //extract cookievalue and last path adress.
      return crawl.getCookie(extractedLinks[2]+loginpath);
    })
    .then(function(cookievalue)
    {
      //filter the domain name from args input.
      var d = args.toString();
      //gets index.
      if (d.indexOf("://") > -1) {
       domainName = d.split('/')[2];
      }
      else {
       domainName = d.split('/')[0];
      }

      //removing the port number
      domainName = domainName.split(':')[0];
      //concat posturl adress.
      var posturl = extractedLinks[2]+loginpath+cookievalue[1];
      //get the html body from restaurant post link.
      return crawl.getPostBodyRestaurant(posturl,domainName,cookievalue[0]);




    }).then(function(postBodyData)
    {
      //extract restaurant details.
      return crawl.extractRestuarant(postBodyData).then(function(result)
      {
        return result;
      });

    }).then(function(restResult)
    {
      //check if friday is ok to meet.
      if(countFriday === 3)
      {

            //concat strings and check with restaurant details to check which time it's ok to go the movies on friday.
            var friArr = [];
            var friTimes =[];
            for(o= 0; o<restResult.length; o++)
            {
              if(restResult[o].startsWith('fri'))
              {
                friArr.push(restResult[o]);
              }
            }
            for(k = 0; k<friArr.length; k++)
            {

                var strfri = friArr[k].toString();
                if(strfri.indexOf('fri')> -1)
                {

                  var movietimeFri = strfri.split('fri')[1];
                  movietimeFri = movietimeFri.slice(0,-2);


                  movietimeFri = parseInt(movietimeFri);
                  movietimeFri = movietimeFri -2;

                  movietimeFri = movietimeFri.toString();
                  movietimeFri = movietimeFri+':00';
                  friTimes.push(movietimeFri);
                }

            }


            var fri = cinemaResult.filter(function(frid)
            {
              return frid.friday;
            });

            for(var item of fri)
            {
              for(var m = 0; m<friTimes.length; m++)
              {
                //checks which times in movie array that equals free restaurant time.
                if(item['friday']['time'] === friTimes[m])
                {
                  var resttime = item['friday']['time'].toString();
                  resttime = resttime.slice(0,-3);
                  var endtime = resttime;

                  endtime = parseInt(endtime);
                  endtime = endtime + 4;
                  endtime =endtime.toString();
                  resttime = parseInt(resttime);
                  resttime = resttime +2;
                  resttime = resttime.toString();
                  var rs = resttime+'-'+endtime;
                  //check if cinema details is equal then console log result.
                  if(cinemaDetails[3] === item['friday']['movie'])
                  {
                    console.log("Recommends Friday when there will be a free table at "+rs+' after you have seen the movie: '+'"'+ cinemaDetails[9]+'"'+' which starts at '+item['friday']['time']);
                  }
                  else if(cinemaDetails[4] === item['friday']['movie'])
                  {
                    console.log("Recommends Friday when there will be a free table at "+rs+' after you have seen the movie: '+'"'+ cinemaDetails[10]+'"'+' which starts at '+item['friday']['time']);
                  }
                  else if(cinemaDetails[5] === item['friday']['movie'])
                  {
                    console.log("Recommends Friday when there will be a free table at "+rs+' after you have seen the movie: '+'"'+ cinemaDetails[11]+'"'+' which starts at '+item['friday']['time']);
                  }

                }

              }


            }
      }
      //checks if saturday is ok to meet.
      if(countSaturday === 3)
      {

            //concat strings and check with restaurant details to check which time it's ok to go the movies on saturday.
            var satArr = [];
            var satTimes =[];


            for(o= 0; o<restResult.length; o++)
            {

              if(restResult[o].startsWith('sat'))
              {
                satArr.push(restResult[o]);
              }
            }
            for(k = 0; k<satArr.length; k++)
            {

                var str = satArr[k].toString();
                if(str.indexOf('sat')> -1)
                {

                  var movietime = str.split('sat')[1];
                  movietime = movietime.slice(0,-2);


                  movietime = parseInt(movietime);
                  movietime = movietime -2;

                  movietime = movietime.toString();
                  movietime = movietime+':00';
                  satTimes.push(movietime);
                }

            }

            var sat = cinemaResult.filter(function(satd)
            {
              return satd.saturday;
            });

            for(var itemSat of sat)
            {


              for(m = 0; m<satTimes.length; m++)
              { //checks which times in movie array that equals free restaurant time.
                if(itemSat['saturday']['time'] === satTimes[m])
                {

                  var resttimeSat = itemSat['saturday']['time'].toString();
                  resttimeSat = resttimeSat.slice(0,-3);
                  var endtimeSat = resttimeSat;

                  endtimeSat = parseInt(endtimeSat);
                  endtimeSat = endtimeSat + 4;
                  endtimeSat =endtimeSat.toString();
                  resttimeSat = parseInt(resttimeSat);
                  resttimeSat = resttimeSat +2;
                  resttimeSat = resttimeSat.toString();
                  var rsSat = resttimeSat+'-'+endtimeSat;
                  //check if cinema details is equal then console log result.
                  if(cinemaDetails[3] === itemSat['saturday']['movie'])
                  {
                    console.log("Recommends Saturday when there will be a free table at "+rsSat+' after you have seen the movie: '+'"'+ cinemaDetails[9]+'"'+' which starts at '+itemSat['saturday']['time']);
                  }
                  else if(cinemaDetails[4] === itemSat['saturday']['movie'])
                  {
                    console.log("Recommends Saturday when there will be a free table at "+rsSat+' after you have seen the movie: '+'"'+ cinemaDetails[10]+'"'+' which starts at '+itemSat['saturday']['time']);
                  }
                  else if(cinemaDetails[5] === itemSat['saturday']['movie'])
                  {
                    console.log("Recommends Saturday when there will be a free table at "+rsSat+' after you have seen the movie: '+'"'+ cinemaDetails[11]+'"'+' which starts at '+itemSat['saturday']['time']);
                  }

                }

              }




            }
      }
      //checks if sunday is ok to meet.
      if(countSunday === 3)
      {

            //concat strings and check with restaurant details to check which time it's ok to go the movies on sunday.
            var sunArr = [];
            var sunTimes =[];
            for(o= 0; o<restResult.length; o++)
            {

              if(restResult[o].startsWith('sun'))
              {
                sunArr.push(restResult[o]);
              }
            }
            for(k = 0; k<sunArr.length; k++)
            {

                var strsun = sunArr[k].toString();
                if(strsun.indexOf('sun')> -1)
                {


                  var movietimeSun = strsun.split('sun')[1];
                  movietimeSun = movietimeSun.slice(0,-2);


                  movietimeSun = parseInt(movietimeSun);
                  movietimeSun = movietimeSun -2;

                  movietimeSun = movietimeSun.toString();
                  movietimeSun = movietimeSun+':00';
                  sunTimes.push(movietimeSun);
                }

            }

            var sun = cinemaResult.filter(function(sund)
            {
              return sund.sunday;
            });

            for(var itemSun of sun)
            {


              for(m = 0; m<sunTimes.length; m++)
              { //checks which times in movie array that equals free restaurant time.
                if(itemSun['sunday']['time'] === sunTimes[m])
                {

                  var resttimeSun = itemSun['sunday']['time'].toString();
                  resttimeSun = resttimeSun.slice(0,-3);
                  var endtimeSun = resttimeSun;

                  endtimeSun = parseInt(endtimeSun);
                  endtimeSun = endtimeSun + 4;
                  endtimeSun =endtimeSun.toString();
                  resttimeSun = parseInt(resttimeSun);
                  resttimeSun = resttimeSun +2;
                  resttimeSun = resttimeSun.toString();
                  var rsSun = resttimeSun+'-'+endtimeSun;
                  //check if cinema details is equal then console log result.
                  if(cinemaDetails[3] === itemSun['sunday']['movie'])
                  {
                    console.log("Recommends Sunday when there will be a free table at "+rsSun+' after you have seen the movie: '+'"'+ cinemaDetails[9]+'"'+' which starts at '+itemSun['sunday']['time']);
                  }
                  else if(cinemaDetails[4] === itemSun['sunday']['movie'])
                  {
                    console.log("Recommends Sunday when there will be a free table at "+rsSun+' after you have seen the movie: '+'"'+ cinemaDetails[10]+'"'+' which starts at '+itemSun['sunday']['time']);
                  }
                  else if(cinemaDetails[5] === itemSun['sunday']['movie'])
                  {
                    console.log("Recommends Sunday when there will be a free table at "+rsSun+' after you have seen the movie: '+'"'+ cinemaDetails[11]+'"'+' which starts at '+itemSun['sunday']['time']);
                  }

                }

              }




            }
      }




    })
    .catch(function(error) {
        console.log("Error:", error);
  });
