/*jshint esversion: 6*/
var cheerio = require('cheerio');
var rp = require('request-promise');
var url = require('url');
var urlmerged;
var request = require('request');
var extractLinks = function(urls)
{

    var alternatives = {
      transform : function(htmlbody)
      {
        return cheerio.load(htmlbody);
      }
    };
    var promiseArr = [];
    var urlArr = [];
      urls.forEach(function(url)
      {
        alternatives.uri = url;
        promiseArr.push(rp(alternatives));
      });


    //converts object to string, so it can be used with u.resolve.
    var urlstr = String(urls);
    //return all promises
    return Promise.all(promiseArr).then(function(val)
    {


        //foreach every htmlbody
        val.forEach(function($)
        {//filter the htmlbody to just get the href value
          $("a").filter("[href]")
                .map(function(index, link) {
                    //merge url with url lib.
                    urlmerged = url.resolve(urlstr+"/",$(link).attr("href"));
                    //push to url array.
                    urlArr.push(urlmerged);
          });
        });

        return Promise.resolve(urlArr);
    });
};

var extractCalendar = function(urls)
{
  //object that transforms and loads the html body.
  var alternatives = {
    transform : function(htmlbody)
    {
      return cheerio.load(htmlbody);
    }
  };
  var promiseArr = [];
  var itemArr = [];
  urls.forEach(function(url)
  {
    alternatives.uri = url;
    promiseArr.push(rp(alternatives));
  });

  //promise all html bodys.
  return Promise.all(promiseArr).then(function(val)
  {

      //foreach html body to filter th and td tag and check when there index are the same.
      val.forEach(function($)
      {
        $("th")
        .each(function(index1, link) {
                $("td")
                .each(function(index2, link2) {

                        if(index1 === index2)
                        { //push th and td values to item array.
                          itemArr.push($(link).text()+$(link2).text());
                        }

                });

        });

      });
      //resolve item array.
      return Promise.resolve(itemArr);
  });




};

var extractCinema = function(urls)
{
  var alternatives = {
    transform : function(htmlbody)
    {
      return cheerio.load(htmlbody);
    }
  };
  var promiseArr = [];
  var itemArr = [];

    urls.forEach(function(url)
    {
      alternatives.uri = url;
      promiseArr.push(rp(alternatives));
    });


  return Promise.all(promiseArr).then(function(val)
  {

      //foreach all html bodys and pick options tags value and text for the cinema.
      val.forEach(function($)
      {
        $("option").filter("[value^='0']")
              .map(function(index, link) {
                  itemArr.push($(link).attr("value"));

        });
        $("option").filter("[value^='0']")
              .map(function(index, link) {

                itemArr.push($(link).text());
        });
      });

      return Promise.resolve(itemArr);
  });

};


var extractCinemaJsonBody = function(urls)
{
  var alternatives = {
    transform : function(htmlbody)
    {
      return cheerio.load(htmlbody);
    }
  };
  var promiseArr = [];
  var itemArr = [];

    urls.forEach(function(url)
    {
      alternatives.uri = url;
      promiseArr.push(rp(alternatives));
    });

  return Promise.all(promiseArr).then(function(val)
  {
      //foreach every JSON body and pick out details and put the details into separated days.
      val.forEach(function($)
      {   //json parse JSON body.
          var parsedRes = JSON.parse($.text());
            for(var item of parsedRes)
            {
              if(item['status'] === 1 & item['day'] === '05')
              {
                itemArr.push({friday: { day:item['day'], movie: item['movie'], time: item['time']}});
              }
              if(item['status'] === 1 & item['day'] === '06')
              {
                itemArr.push({saturday: { day:item['day'], movie: item['movie'], time: item['time']}});
              }
              if(item['status'] === 1 & item['day'] === '07')
              {
                  itemArr.push({sunday: { day:item['day'], movie: item['movie'], time: item['time']}});
              }
            }

      });

      return Promise.resolve(itemArr);
  });




};

var extractRestuarant = function(htmlbody)
{


  var promiseArr = [];
  var timeArr = [];
  promiseArr.push(cheerio.load(htmlbody));


  return Promise.all(promiseArr).then(function(val)
  {   //foreach every input name and separate and put the time values into right order
      val.forEach(function($)
      {

        $("input").filter("[name^='group1']")
              .map(function(index, link) {

                  if($(link).attr('value').startsWith('fri'))
                  {
                    timeArr.push($(link).attr('value'));
                  }
                  if($(link).attr('value').startsWith('sat'))
                  {
                    timeArr.push($(link).attr('value'));
                  }
                  if($(link).attr('value').startsWith('sun'))
                  {
                    timeArr.push($(link).attr('value'));
                  }
        });

      });

      return Promise.resolve(timeArr);
  });


};
//https://github.com/request/request
var getCookie = function(extractedlink)
{
  return new Promise(function(resolve,reject)
  {//using request lib to make a post with username and pasword. Then save the header cookie and redirect link.
    request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     extractedlink,
      form:    {username: 'zeke',
                password: 'coys',
                submit: 'login'  }
    }, function(error, response, body){
      var co = response.headers['set-cookie'][0];
      var str = body;
      str = str.split('/')[1];
      str = ('/')+str;
      var done= co.split(";",1);
      resolve([done[0].toString(),str]);
    });
  });
};
//https://github.com/request/request
var getPostBodyRestaurant = function(url, domain, cookievalue)
{
    return new Promise(function(resolve,reject)
    { //set cookie details so we can do a get with request lib against the redirect restaurant link and resolve the body.
        var jar = request.jar();
        var cookie = request.cookie(cookievalue);
        cookie.domain = domain;
        cookie.path = "/";

        jar.setCookie(cookie, url, function(error, cookie) {
        });

        request({
            uri: url,
            method: "GET",
            jar: jar
        }, function(error, response, body) {

            resolve(body);
        });

    });
};

var extractLoginPath = function(urls)
{

  var alternatives = {
    transform : function(htmlbody)
    {
      return cheerio.load(htmlbody);
    }
  };
  var promiseArr = [];
  var loginpath;

    urls.forEach(function(url)
    {
      alternatives.uri = url;
      promiseArr.push(rp(alternatives));
    });


  return Promise.all(promiseArr).then(function(val)
  {

      //get the form action value to get the loginpath.
      val.forEach(function($)
      {
        $("form").filter("[action^='/']")
              .map(function(index, link) {
                  loginpath = $(link).attr("action");
                  loginpath = loginpath.split('/')[2];
                  loginpath = ('/')+loginpath;
        });
      });

      return Promise.resolve(loginpath);
  });

};

module.exports.extractLinks = extractLinks;
module.exports.extractCalendar = extractCalendar;
module.exports.extractCinema = extractCinema;
module.exports.extractCinemaJsonBody = extractCinemaJsonBody;
module.exports.extractRestuarant = extractRestuarant;
module.exports.getCookie = getCookie;
module.exports.getPostBodyRestaurant = getPostBodyRestaurant;
module.exports.extractLoginPath = extractLoginPath;
