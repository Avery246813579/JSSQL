var jssql = require('./../src/index.js');

var Database = jssql.Database;
var testDatabase = new Database({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'drip'
});

var Scheme = jssql.Scheme;
var Structure = jssql.Structure;

var testScheme = new Scheme({
    ID: {
        TYPE: "INT",
        AI: true,
        INDEX: "PRIMARY KEY",
        NULL: false
    },
});

var accountScheme = new Scheme({
    ID: {
        TYPE: "INT",
        AI: true,
        INDEX: "PRIMARY KEY",
        NULL: false
    },
});

var Table = jssql.Table;
var patrons = new Table('Patrons', testScheme);
var accounts = new Table("Accounts", accountScheme);

testDatabase.table([patrons, accounts]);

// testTable.find({}).then((rows) => {
//     console.dir(rows);
// }).catch((err) => {
//     console.dir(err);
// });

// testTable.insert({NAME: "TEST"}).then((id) => {
//     console.dir(id);
// }).catch((err) => {
//     throw err;
// });

patrons.findAdvanced({}, {
    COLUMNS: ["Patrons.*", "Accounts.FULL_NAME"],
    LEFT_JOIN: {TABLE: "Accounts", LEFT: "Patrons.ACCOUNT_ID", RIGHT: "Accounts.ID"},
    LIMIT: 5,
    DEBUG: true
}).then((lRows) => {
    console.dir(lRows);
});