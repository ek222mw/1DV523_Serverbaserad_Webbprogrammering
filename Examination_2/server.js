/* jshint esversion:6*/

let session = require('express-session');
let bodyParser = require('body-parser');
let exphbs = require('express-handlebars');
let path = require('path');
let express = require('express');
let https = require('https');
let fsp = require('fs-promise');
let csrf = require('csurf');
let helmet = require('helmet');

let app = express();
let port = process.env.PORT || 8000;

require("./libs/helper").initialize();

app.engine(".hbs", exphbs({
    defaultLayout: "main",
    extname: ".hbs"
}));
app.set("view engine", ".hbs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));


//from: https://github.com/1dv023/syllabus/blob/master/lectures/03/demo/server.js
app.use(session({
    name:   "sessionforserver",
    secret: "98smsx9MsEasad89wEzVp5EeC678s", // hide this variabel later
    saveUninitialized: false,
    resave: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 2000 * 60 * 60 * 24 // lives in 2 days
    }
}));

app.use(csrf());
app.use(function (req, res, next) {
  res.locals.csrftoken = req.csrfToken();
  next();
});
//http headers protection.
app.use(helmet());

app.use(function(req, res, next) {
  if(req.session.flash) {
    res.locals.flash = req.session.flash;

    delete req.session.flash;
  }
  //checking if session object loggedin is set and then user is logged.
  if(req.session.loggedin)
  {
    res.locals.loggedin = req.session.loggedin;
  }
  //moving on to next middleware.
  next();
});


// csrf error handler
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN')
  {
    return next(err);
  }

  // taking care of CSRF token errors here
  res.status(403).render("error/403csrf");
});
//routes
app.use("/", require("./routes/home.js"));
//items in this case means snippets and will do so in whole project.eg structure, code and so on.
app.use("/item", require("./routes/item.js"));
app.use("/users", require("./routes/users.js"));

//handles 404 errors.
app.use(function(req, res, next) {

  res.status(404).render("error/404");
});

//handles error 500 errors
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render("error/500");
});
//starting https server on given port
https.createServer({
    key: fsp.readFileSync("./config/sslcerts/key.pem"),
    cert: fsp.readFileSync("./config/sslcerts/cert.pem")
}, app).listen(port, function() {
      console.log("Server app rolling on port %s!", port);
});
