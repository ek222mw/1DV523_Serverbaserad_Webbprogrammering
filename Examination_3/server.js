var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var path = require('path');
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
require("dotenv").config();
var GithubWebHook = require('express-github-webhook');
var webhookHandler = GithubWebHook({ path: '/githubwebhook', secret: process.env.TOKEN });

var app = express();
var port = process.env.PORT || 3000;
//use for localhost
/*var server = http.createServer(app).listen(port, function() {
    console.log("Express Server.js started on port %s!", port);
    console.log("Press Ctrl-C to exit and terminate");
});*/

var server = https.createServer({
    key: fs.readFileSync("./config/sslcerts/key.pem"),
    cert: fs.readFileSync("./config/sslcerts/cert.pem")
}, app).listen(port, function() {
      console.log("Express Server.js started on port %s!", port);
      console.log("Press Ctrl-C to exit and terminate");
});

var io = require("socket.io")(server);

app.engine(".hbs", exphbs({
    defaultLayout: "main",
    extname: ".hbs"
}));
app.set("view engine", ".hbs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//use for localhost
//app.use(express.static(path.join(__dirname, "public")));
app.use(webhookHandler); // use our middleware
app.set('socket.io', io); //setting socket.io in req parameter app.



// Now could handle following events
io.on('connection', function (socket) {
  webhookHandler.on('issues', function (repo, data) {

    var action = data.action;
    var id = data.issue.id;
    var issuelink = data.issue.html_url;
    var issuetitle = data.issue.title;
    var issuenumber =data.issue.number;
    var commentsCount = data.issue.comments;
    var body = data.issue.body;
    var dateCreated = data.issue.created_at;
    var dateUpdated = data.issue.updated_at;
    var user = data.issue.user.login;

      socket.emit("issue", {action: action, title:issuetitle, user:user });
      if(action === 'opened' || action === 'reopened')
      {
        socket.emit("issuelist", {title:issuetitle, body:body, commentsCount:commentsCount, dateCreated:dateCreated,dateUpdated:dateUpdated, link:issuelink, number:issuenumber,id:id   });
      }
      else if(action === 'closed')
      {
        socket.emit("issueremove", {title:issuetitle, body:body, commentsCount:commentsCount, dateCreated:dateCreated,dateUpdated:dateUpdated, link:issuelink, number:issuenumber,id:id   });
      }
  });
  webhookHandler.on("issue_comment", function (repo, data) {


    var commentCount = data.issue.comments;
    var number = data.issue.number;
    var action = data.action;
    var issuetitle = data.issue.title;
    var comment = data.comment.body;
    var userWhoComment = data.comment.user.login;
    socket.emit("issue_comment", {action:action, title:data.issue.title, comment:comment, user:userWhoComment, number:number, id:data.issue.id, commentCount:commentCount});

  });

});

webhookHandler.on('error', function (err, req, res) {
    if(err)
    {
      console.log(err);
    }

});

app.use("/", require("./routes/home.js"));
app.use("/githubwebhook", require("./routes/payload.js"));

//handles 404 errors.
app.use(function(req, res, next) {

  res.status(404).render("error/404");
});

//handles error 500 errors
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render("error/500");
});
