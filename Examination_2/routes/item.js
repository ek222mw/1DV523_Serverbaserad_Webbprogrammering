/*jshint esversion:6 */
//got bad name from start that's item which means snippet in this project
let Item = require("../models/Item");
let router = require("express").Router();

//route for viewing snippets.
router.route("/")
    .get(function(req, res) {
      //find and map the objects that i are interested in.
      Item.find({}, function(error, data) {
        console.log(data);
        let contxt = {
          items: data.map(function(item) {
            return {
              text: item.text,
              dateCreated: item.dateCreated,
              id: item._id
            };
          }),
        };
        //render snippet list
        res.render("item/index", contxt);
      });


  });


//get and post routes for deleting snippets.
router.route("/delete/:id")
    .get(function(req, res) {
        //if logged in then get page else send error message.
        if((req.session.username === req.session.username) && req.session.loggedin)
        {
          res.render("item/delete", {id: req.params.id});
        }
        else
        {
          return res.status(401).render("error/401");
        }
    })
    .post(function(req, res) {
      //check if logged in
      if((req.session.username === req.session.username) && req.session.loggedin)
      {
        //finding snippet owner.
        Item.findOne({ _id: req.params.id }, function(err, item)
        {
            //if snippet owner is the logged in user then proceed else send error message.
            if(item.owner === req.session.username)
            {
              var promise = Item.findOneAndRemove({_id: req.params.id}).exec();
              promise.then(function()
              {
                req.session.flash = {
                  type: "succesful",
                  message: "The item was deleted"
                };
                res.redirect("/item");

              }).catch(function()
              {
                  res.render("item/delete",{id:req.params.id, error: "Something went wrong when tried to delete." });
              });
            }
            else
            {
              return res.status(403).render("error/403");

            }
        });

      }
      else
      {
        return res.status(401).render("error/401");
      }

    });
//routes for updating a snippet.
router.route("/update/:id")
    .get(function(req, res) {
      if((req.session.username === req.session.username) && req.session.loggedin)
      {

        Item.findOne({ _id: req.params.id }, function(err, item)
        {
          res.render("item/update",{id:req.params.id, text: item.text});
        });
      }
      else
      {
          return res.status(401).render("error/401");
      }

    })
    .post(function(req, res) {

        if((req.session.username === req.session.username) && req.session.loggedin)
        {

          Item.findById(req.params.id, function(err,item)
          {
            if(req.body.itemText.length > 1 &&  req.body.itemText.length < 301  && item.owner === req.session.username )
            {
                item.text = req.body.itemText;
                item.dateCreated = Date.now();
                item.save().then(function()
                {
                  req.session.flash = {
                    type: "succesful",
                    message: "The item was updated"
                  };
                  res.redirect("/item");
                }).catch(function()
                {
                  res.render("item/update",{id:req.params.id, error: "Something went wrong when tried to update." });

                });
            }
            else if(item.owner !== req.session.username)
            {
              return res.status(403).render("error/403");
            }
            else{
                  res.render("item/update",{id:req.params.id, error: "No input or input longer than 300 characters." });
            }

          });
        }
        else
        {
           return res.status(401).render("error/401");
        }

    });
//routes for creating snippets.
router.route("/create")
    .get(function(req, res) {


        res.render("item/create");
    })
    .post(function(req, res) {

      let itemText = req.body.itemText;
      if(itemText.length < 1)
      {

         res.render("item/create", {error: "No input."});

      }
      else if(itemText.length > 300)
      {
        res.render("item/create", {error: "Input can't be longer than 300 characters."});
      }
      else if((req.session.username === req.session.username) && req.session.loggedin)
      {

        let item = new Item({
          text: itemText,
          owner: req.session.username
        });

        var promise = item.save();

        promise.then(function()
        {
          req.session.flash = {
            type: "succesful",
            message: "Item was created"
          };

          res.redirect("/item");
        }).catch(function(error) {
        console.log(error.message);
        res.render("item/create", {error: "Something went wrong when tried to create."});

        });
      }
      else
      {
         return res.status(401).render("error/401");
      }
    });

module.exports = router;
