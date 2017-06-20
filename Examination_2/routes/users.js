/*jshint esversion:6 */
var Login = require("../models/Login");
let router = require("express").Router();
//setting up route for get and post for login
router.route("/login")
  .get(function(req, res) {

      if((req.session.username === req.session.username) && req.session.loggedin)
      {
        req.session.flash = {
          type: "succesful",
          message: "already logged in"
        };

          res.redirect("../item");
      }
      else{
          res.render("users/login");
      }

    }).post(function(req, res) {

      let usrname = req.body.username;
      let passwrd = req.body.password;

    if(usrname.length < 1 || passwrd.length < 1)
    {
       res.render("users/login", {error: "No input on username or password."});

    }
    else
    {
      //searching for user
      Login.find({username:req.body.username}, function(error, data) {
        //check if username exists.
        if(data.length === 1)
        {

          Login.findOne({ username: req.body.username }, function(err, user) {
            if (err)
            {
              throw err;

            }
            // compares passwords
            user.comparePassword(req.body.password, function(err, isMatch) {
                if (err)
                {
                   throw err;
                }
                else
                { //check if no match with password output error message
                  if(!isMatch)
                  {
                    res.render("users/login", {error: "Wrong username or password."});
                  }
                  else
                  { //successful login. set objects in session.
                    req.session.username = req.body.username;
                    req.session.loggedin = true;
                    req.session.flash = {
                      type: "succesful",
                      message: "Login successful"
                    };
                    res.redirect("../item");
                  }
               }
            });

          });
        }
        else
        {
          res.render("users/login", {error: "Wrong username or password."});
        }

      });
  }

});

//routes for register new user.
router.route("/register")
    .get(function(req, res) {

        res.render("users/register");
    })
    .post(function(req, res) {
      let usrname = req.body.username;
      let passwrd = req.body.password;
      let id = req.params.id;
      if(usrname.length < 1 || passwrd.length < 1)
      {
         res.render("users/register", {error: "No input on username or password."});
      }
      else if( passwrd.length < 6)
      {
        res.render("users/register", {error: "Password must be atleast 6 characters long."});
      }
      else if(usrname.length > 31 || passwrd.length > 31)
      {
          res.render("users/register", {error: "Username and or password can't be longer than 30 characters."});
      }
      else
      { //valid input and user doesn't exists, then create user.
        let login = new Login({
          username: usrname,
          password: passwrd,
          id: id
      });
      //saving user in db with mongoose command .save and send flash mess-
      login.save().then(function() {
        req.session.flash = {
          type: "succesful",
          message: "Registration successful"
        };
        res.redirect("../item/");
      }).catch(function(error) {
        console.log(error.message);
        res.render("users/register", {error: "Something went wrong with the registration"});
      });
    }
    });
//route for logout. if successful, destory session and redirect to item snippets view page.
router.route("/logout")
    .post(function(req, res) {

        delete req.session.destroy();
        res.redirect("../item");
    });

module.exports = router;
