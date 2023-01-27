const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash')
const { getDate, getDay } = require(__dirname + '/date.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))

app.set('view engine', 'ejs');

// manage database with mongoose
async function mainData() {
  mongoose.set('strictQuery', false);
  await mongoose.connect('mongodb+srv://Admin-Aldi:12coding@cluster0.ukvyi55.mongodb.net/todolistDB');
  console.log("connected to database");
}

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema)

const item1 = new Item({
  name: "Learn Mongoose"
});

const item2 = new Item({
  name: "Learn how to fix and debug code"
});

const item3 = new Item({
  name: "Learn HTML and CSS"
});

const defaultItem = [item1, item2, item3];

// Item.insertMany(defaultItem, (err) => {
//   (err) ? console.log(err) : console.log("success to insert new items")
// });

mainData().catch(err => { if (err) { console.log(err) } });

app.get('/', (req, res) => {
  const day = getDate();

  Item.find((err, result) => {
    if (err) {
      console.log(err)
    } else {
      res.render('list', { listTitle: day, listItem: result, link: "/Work" });
    }
  }).clone();

});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, result) => {
    if (err) {
      console.log(err)
    } else {
      if (!result) {
        const newList = new List({
          name: customListName,
          items: []
        })

        newList.save();

        console.log(customListName)

        res.redirect("/" + customListName)
      } else {
        res.render('list', { listTitle: customListName, listItem: result.items, link: "/" });
      }
    }
  });

});

app.post('/', (req, res) => {
  const newItem = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: newItem
  })

  if (newItem !== "") {
    if (listName === getDay() + ',') {
      (async function () {
        await item.save();

        res.redirect('/')
      }())
    } else {
      List.findOne({ name: listName }, (err, result) => {
        if (err) {
          console.log(err)
        } else {
          result.items.push(item);
          result.save();
          res.redirect('/' + listName);
        }
      })
    }
  }

});

app.post('/delete', (req, res) => {
  const itemId = req.body.itemId;
  const listName = req.body.listName;

  if (listName == getDay() + ',') {
    Item.findByIdAndRemove(itemId, (err) => {
      (err) ? console.log(err) : console.log("item deleted");
    });
    res.redirect('/')
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemId } } }, (err) => {
      if (!err) {
        res.redirect('/' + listName)
      }
    })
  }
})



app.listen(3000, () => {
  console.log('Server is running on port 3000');
})