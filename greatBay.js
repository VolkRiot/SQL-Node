var mysql = require('mysql');
var inquirer = require('inquirer');
var itemsArray = [];

var connection = mysql.createConnection({
  host:'localhost',
  port: 3306,

  user: 'root',

  password: '',
  database: 'bay_db'
})

connection.connect(function(err){
  if(err) throw err;
  //console.log('connected as id ' + connection.threadId);
});

function loadCurrentData(){
  return connection.query("SELECT * FROM inventory", function(err, res){
    if(err) throw err;
    // Here be display code
    itemsArray = res;

  });
}
loadCurrentData();

function addItem(){
  inquirer.prompt([{
    type: 'input',
    message: 'Name of the item you want to add?',
    name: 'newItem'
  },
  {
    type: 'input',
    message: 'Starting price of the item you want to add?',
    name: 'newPrice'
  }
]).then(function(response){
  var item = {
    name: response.newItem,
    price: response.newPrice
  }
  connection.query("INSERT INTO inventory SET ?", item, function(err, data){
    if(err) throw new Error("Could not add your item. My apologies.");
    console.log("Added item " + response.newItem + "\nWith starting bid: " + response.newPrice);
    beginRun();
  });
})
}

function bid(){

  loadCurrentData();

  var itemChoices = [];

  itemsArray.forEach(function(item){
    console.log("Item #" + item.id + " Name: " + item.name + " Price: " + item.price)
    itemChoices.push(item.name);
  });

  inquirer.prompt([{
      type: "list",
      message: "Which item would you like to bid on?",
      choices: itemChoices,
      name: "itemChosen"
  },
  {
      type: "input",
      message: "How much would you like to bid",
      name: "bidVal"
  }]).then(function(response){
    connection.query("SELECT * FROM inventory WHERE name = '" + response.itemChosen + "'", function(err, res){
      if(err) throw new Error("Looks like you were unable to place a bid on that item");

      if(parseFloat(response.bidVal) < parseFloat(res[0].price)){
        console.log("Your bid was not high enough.\nCurrent high bid is: " + res[0].price)
        beginRun();
      }else if(parseFloat(response.bidVal) > parseFloat(res[0].price)){
        connection.query("UPDATE inventory SET ? WHERE ?", [{price: response.bidVal}, {name: res[0].name}], function(err){
          if (err) throw new Error("Could not place your bid. Sowwy");
          console.log("Thank you for your bid you rich fool");
          beginRun();
        });
      }

    })
  });

}


function beginRun(){
  loadCurrentData();
  inquirer.prompt({
    type: "list",
    name: "choice",
    message: "Choose an option",
    choices: ['bid', 'add item', 'exit']
  }).then(function(response){

    switch(response.choice){

      case 'exit':
      connection.end();
      process.exit();
      break;

      case 'bid':
      bid();
      break;

      case 'add item':
      addItem();
      break;
    }

  });
}

beginRun();
