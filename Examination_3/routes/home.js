/*jshint esversion:6 */
//home route, which is triggered when start the app.
let router = require("express").Router();
var github = require('octonode');
var client = github.client(process.env.TOKEN);
var ghrepo = client.repo('1dv523/ek222mw-examination-3');

router.route("/")
    .get(function(req, res) {
      ghrepo.issues(function(cb,b,h)
      {

        if(b === undefined)
        {

          res.render("error/403token");
        }
        else{


        var contxt = {

          items: b.map(function(item) {
            return {
              id: item.id,
              number: item.number,
              title: item.title,
              user: item.user.login,
              desc: item.body,
              link:item.html_url,
              dateCreated: item.created_at,
              dateUpdated: item.updated_at,
              commentsCount: item.comments
            };
          }),

        };
        var io = req.app.get('socket.io');

        io.on('connection', function (socket) {


          socket.on('issue_comment', function(data)
          {
            socket.emit('issue_comment', {action:data.action, title:data.issuetitle,  comment:data.comment, user:data.user,number:data.number, commentCount:data.commentCount});
          });

          socket.on('issue', function(data) {

              socket.emit('issue', {action: data.action, title:data.title, user:data.user });

          });

          socket.on('issuelist', function(data)
          {
            socket.emit('issuelist', {title:data.title, body:data.body, commentsCount:data.commentsCount, dateCreated:data.dateCreated, dateUpdated:data.dateUpdated, link:data.link, number:data.number,id:data.id});
          });

          socket.on('issueremove', function(data)
          {
            socket.emit('issueremove', {title:data.title, body:data.body, commentsCount:data.commentsCount, dateCreated:data.dateCreated, dateUpdated:data.dateUpdated, link:data.link, number:data.number,id:data.id});
          });


      });

      res.render("home/index", {issues:contxt.items});
    }
    });
  });

module.exports = router;
