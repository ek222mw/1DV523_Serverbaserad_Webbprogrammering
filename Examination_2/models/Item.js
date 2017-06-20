/*jshint esversion:6*/
//setting up schema to communicate with mongodb through mongoose. this item schema which is infact snippets in view.
let mongoose = require("mongoose");

let itemSchema = mongoose.Schema({
  text: { type: String, required: true },
  dateCreated: { type: Date, required: true, default: Date.now },
  owner: {type: String, required: true}
});


let Item = mongoose.model("Item", itemSchema);
module.exports = Item;
