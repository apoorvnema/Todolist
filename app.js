const bodyParser = require("body-parser");
const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//Storing Password and API keys
const dbPassword = process.env.password;
const url = process.env.url;
console.log(url);

mongoose.connect(url);
const itemSchema = { name: String };
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({ name: "Welcome to your todolist!" });

const item2 = new Item({ name: "Hit the + button to add a new item." });

const item3 = new Item({ name: "<-- Hit this to delete an item." });

const defaultItems = [item1, item2, item3];

const newNoteSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", newNoteSchema);

app.get("/", function (req, res) {
    Item.find({})
        .then(function (allItems) {
            if (allItems.length == 0) {
                Item.insertMany(defaultItems)
                    .then(function (result) {})
                    .catch(function (err) { console.log(err) });
                res.redirect("/");
            }
            else {
                res.render("list", { listTitle: "Today", newListItems: allItems });
            }
        })
        .catch(function (err) {
            console.log(err);
        })
});

app.get("/:newNote", function (req, res) {

    const customListName = _.capitalize(req.params.newNote);
    List.findOne({ name: customListName })
        .then(function (listResult) {
            if (!listResult) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else {
                res.render("list", { listTitle: customListName, newListItems: listResult.items });
            }
        })
        .catch(function (err) { console.log(err) });

});

app.get("/about", function (req, res) {
    res.render("about");
});

app.post("/", function (req, res) {
    const item = req.body.newItem;
    const otherItem = new List({ name: item });

    if (req.body.list === "Today") {
        Item.insertMany({ name: item }).then(function (result) {}).catch(function (err) { console.log(err); });
        res.redirect("/");

    } else {
        List.findOne({ name: req.body.list })
            .then(function (result) {
                
                result.items.push(otherItem);
                result.save();
                res.redirect("/" + req.body.list);
            })
            .catch(function (err) {
                console.log(err);
            })
    }
});

app.post("/deleted", function (req, res) {
    const itemID = req.body.checkbox;
    const title = req.body.list;
    if (title == "Today") {
        Item.findByIdAndRemove(itemID)
            .then(function (result) {})
            .catch(function (err) { console.log(err) });
        res.redirect("/");
    }
    else {
        List.findOneAndUpdate({name: title},{$pull : {items : {_id: itemID}}})
        .then(function(){
            res.redirect("/"+title);
        })
        .catch(function(err){
            console.log(err);
        });
    }
});

app.listen(3000 || process.env.PORT, function () {
    console.log("Server started on port 3000");
});
