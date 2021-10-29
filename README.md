## Install
```sh
$ npm install jssql
```
## Introduction

This is a node.js driver that makes SQL easy! It doesnt matter if you're a SQL noob or expert, everyone can enjoy JSSQL.

## Setting up our database
The first thing we need to do is set up a database. The code below initializes a database instance and if the database does not exist, then it will create one. 

```js
var jssql = require('jssql');

var Database = jssql.Database;
var testDatabase = new Database({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'TEST_DATABASE'
});
```

We can also add in the `connectionLimit` message to add the number of 
pool connections we want. Default is 10.

## Creating our first scheme and table
Now that we have a database initilized we can go right into creating out first scheme and table. Let's start by creating our scheme. 
```js
var Scheme = jssql.Scheme;
var Table = jssql.Table;
var Structure = jssql.Structure;

var testScheme = new Scheme({
    ID: {
        type: Structure.Type.INT,
        AI: true,
        Index: Structure.Index.PRIMARY
    },
    NAME: {
        type: "VARCHAR",
        length: 100
    }
});
```
The most important part about creating a scheme is the syntax we use. Inside the project we include constant variables that can be used that describe types and indexs. You can use the constants we define or just write in the keywords yourself. The column syntax is shown below:
- type: The datatype of the column (required)
- length: The datatype length of the column
- index: The index type of the column
- ai: If the column is auto incrementing 
- null: If the column can be null

Once the Scheme is setup, we then have to create our table. A table definition only needs to contain the table name and the scheme. The most important part about creating a table is remembering to pair it with a database. Without a database pair, the table will fail to work. 
```js
var testTable = new Table('TABLE_NAME', testScheme);

testDatabase.table(testTable);
```

Additionally, if you have multiple tables that you want to access via the 'testDatabase', you may pass in an array of Table objects.
```js
var testTable = new Table('TABLE_NAME', testScheme);
var testTable2 = new Table('TABLE_NAME_2', testScheme2);

testDatabase.table([testTable, testTable2]);
```

Lastly, if you want to use a READ_ONLY replica of the database, you can create a second Database object and pass it in as the second parameter.  
```js
var testTable = new Table('TABLE_NAME', testScheme);

var readOnlyDatabase = new Database({
  host: '127.0.0.2',
  user: 'root2',
  password: '',
  database: 'READ_ONLY_DATABASE'
});

testDatabase.table(testTable, readOnlyDatabase);
```

## Placing and recieving information 
Once we have our table sorted out, we can place some information in it. Below is a quick example of how to add a row.
```js
testTable.save({
    NAME: "BOB"
}, function(err){
    if(err)
        throw err;
});
```

Recieving a row is just as easy! Just use the find function and we can get all the rows with the information we want!
```js
testTable.find({
    NAME: "BOB"
}, function(err, rows){
   if(err){
       throw err;
   }

    console.dir(rows);
});
```

If we just want to find one row, we can use the findOne function. Instead of having a callback that returns rows, the findOne callback returns one row.  
```js
testTable.findOne({
    NAME: "BOB"
}, function(err, row){
   if(err){
       throw err;
   }

    console.dir(row);
});
```

There is a small window of time that the save function takes to actually save the new row. Because of this time, having a save and find right after each other will not show the new row. This should not be a problem unless you perform the find directly after the save. If doing this is completely necessary, set a timeout before you call the find. 

## Updating rows
If you want to update a row, use the update function. The example below updates all the rows where NAME is equal to 'BOB' and sets NAME equal to 'NOT BOB'
```js
testTable.update({NAME: "NOT BOB"}, {NAME: "BOB"}, function (err) {
    if (err) {
        throw err;
    }
});
```

## AND vs OR 
In SQL we can use AND and OR to find and update statements. We use an array to handle ORs, and dictionaries to handle ANDs. My explaination might sound weird, so let me just show you how it works:

The code below will find one row that has the dog variable set to 'ONE' OR it will find one row where dog is set to 'TWO'.
```js
testTable.findOne([
    {
        DOG: "ONE",
    },
    {
        DOG: "TWO",
    }
], function (err, row) {
    console.dir(row);
});
```

## WHERE IN (...)
A common use case of the WHERE clause in SQL is to find records that match one of a set of values. To do this, simply pass an array as the value for one of your where clauses. Below finds Products that have the ID of either 1 or 2 and a LOCATION_ID of 1.

```js
Products.find(
    { 
        ID: [1, 2], 
        LOCATION_ID: 1 
    }
);
```

## "Advanced Find" 
If we want to do more advanced select statements, we are going to use the `findAdvanced` function. We use the first
argument to find using basic equal conditions (like above), the second argument is to do a list of "advanced" topics.
This is by far the best way to do complicated queries. 

Below is an example of joining two tables, returning select columns, searching using like comparison, and paging using 
limit and before. 

```javascript
Orders.findAdvanced({LOCATION_ID: id}, {
    COLUMNS: ["Orders.*", "Users.USERNAME", "Users.EMAIL AS USER_EMAIL"],
    BEFORE: {KEY: "ID", VALUE: before},
    LEFT_JOIN: {TABLE: "Users", LEFT: "Orders.ACCOUNT_ID", RIGHT: "Users.ID"},
    LIKE: [{KEY: "Orders.UNIQUE_ID", VALUE: search + "%"}, {KEY: "Users.USERNAME", VALUE: search + "%"}, {KEY: "Users.EMAIL", VALUE: search + "%"}],
    LIMIT: 25,
    DESC: "ID"
}).then(() => {
   // do stuff
})
```

We can only use promises with advanced find. 

## Column Selection
If you would like to select what columns will be returned back, you can use `COLUMNS` in the advanced parameters.

```javascript
testTable.findAdvanced({}, {
    COLUMNS: ["Patrons.*", "Accounts.FULL_NAME", "Accounts.ID"],
}).then((lRows) => {
    // Do stuff
});
```

## Like
You can use the like comparison using the following. The LIKE block will default to be using or's but you can change it
to use ANDs using the CONJUNCTION key.

```javascript
testTable.findAdvanced({}, {
    LIKE: [{KEY: "USERNAME", VALUE: "av%", CONJUNCTION: "AND"}],
}).then((lRows) => {
    // Do stuff
});
```


## Joins
If you want to utilize the power join syntax in sql, we can use one of the following: LEFT_JOIN, RIGHT_JOIN, INNER_JOIN, 
FULL_JOIN

```javascript
testTable.findAdvanced({}, {
    LEFT_JOIN: {TABLE: "Accounts", LEFT: "Patrons.ACCOUNT_ID", RIGHT: "Accounts.ID"},
}).then((lRows) => {
   // Do stuff             
});
```

If you want to add more joins of the same type just put them in an array. 
```javascript
testTable.findAdvanced({}, {
    LEFT_JOIN: [
        {TABLE: "Accounts", LEFT: "Patrons.ACCOUNT_ID", RIGHT: "Accounts.ID"},
        {TABLE: "Orders", LEFT: "Patrons.ORDER_ID", RIGHT: "Orders.ID"}
    ],
}).then((lRows) => {
   // Do stuff             
});
```

## Not Equal / NOT NULL Comparison
If you want to check if a column is not something, use the not parameter.

```javascript
testTable.findAdvanced({}, {
    NOT: {KEY: "ID", VALUE: 5}
}).then((lRows) => {
   // do stuff    
});
```


## Before/After
If you want to get rows before or after an index, use the `BEFORE` and/or `AFTER` advanced parameter.

```javascript
testTable.findAdvanced({}, {
    BEFORE: {KEY: "ID", VALUE: 5}
}).then((lRows) => {
   // do stuff    
});
```

## Limits
We can limit the amount of rows we get by just adding the `LIMIT` key to our query.

```javascript
testTable.findAdvanced({ACCOUNT_ID: 3}, {
    LIMIT: 5,
}).then((lRows) => {
    // DO STUFF
});
```

## Asc/Desc
You can order the rows using the `ASC` and `DESC` advanced parameter. 

```javascript
testTable.findAdvanced({}, {
    ASC: "ACCOUNT_ID"
}).then((lRows) => {
    // do stuff
});
```

## Advanced Where
To do a raw conditional check you can use the `WHERE` advanced parameter and pass it an object or list of objects. 
An example is below on how to use it.

```javascript
testTable.findAdvanced({}, {
    WHERE: [
        {KEY: "Orders.ID", OPERATION: ">", VALUE: 20, CONJUNCTION: "OR"},
        {KEY: "Orders.ID", OPERATION: "<", VALUE: 40},
    ],
    COLUMNS: ["Orders.*", "COUNT(Items.ORDER_ID) as NUMBER_ITEMS"],
    LEFT_JOIN: [
        {TABLE: "Items", LEFT: "Orders.ID", RIGHT: "Items.ORDER_ID"}
    ],       
    GROUP_BY: "Orders.ID"
}).then((lRows) => {
    // do stuff
});
```

## Nested Tables
By default, joined tables that have overlapping columns will override existing columns. We will use the `NEST_TABLES`
function to do this.  

If you want to get returned the different tables use the `NEST_TABLES` parameter set to true. 
```javascript
testTable.findAdvanced({}, {
    NEST_TABLES: true,
    COLUMNS: ["Orders.*", "COUNT(Items.ORDER_ID) as NUMBER_ITEMS"],
    LEFT_JOIN: [
        {TABLE: "Items", LEFT: "Orders.ID", RIGHT: "Items.ORDER_ID"}
    ]       
}).then((lRows) => {
    // {Orders: {}, Items: {}}
});
```

We can also set the `NEST_TABLES` function to a delimiter  
```javascript
testTable.findAdvanced({}, {
    NEST_TABLES: "_",
    COLUMNS: ["Orders.*", "COUNT(Items.ORDER_ID) as NUMBER_ITEMS"],
    LEFT_JOIN: [
        {TABLE: "Items", LEFT: "Orders.ID", RIGHT: "Items.ORDER_ID"}
    ]       
}).then((lRows) => {
    // {Orders_ID: 1, Items_ID: 1}
});
```

## Group by / Order by
If you want to group or order results by a certain column(s) or function, use the `ORDER_BY` or `GROUP_BY` advanced
parameters. They can be either a string or array of strings.  

```javascript
testTable.findAdvanced({}, {
    COLUMNS: ["Orders.*", "COUNT(Items.ORDER_ID) as NUMBER_ITEMS"],
    LEFT_JOIN: [
        {TABLE: "Items", LEFT: "Orders.ID", RIGHT: "Items.ORDER_ID"}
    ],       
    GROUP_BY: "Orders.ID"
}).then((lRows) => {
    // do stuff
});
```

## Debug
If you want to debug and see the full query, use the `DEBUG` advanced parameter. This will print the raw SQL query to your console.

```javascript
testTable.findAdvanced({}, {
    DEBUG: true
}).then((lRows) => {
    // do stuff
});
```

## READ_ONLY
If you have set up a read only replicate connection when adding tables to your database, by setting READ_ONLY: true, you will execute your advanced find query on the read only database.

```javascript
testTable.findAdvanced({}, {
    READ_ONLY: true
}).then((lRows) => {
    // Query takes place on the read only database
});
```
