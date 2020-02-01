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
    PAYMENT_TYPE: {
        TYPE: "TINYINT",
        NULL: false,
        DEFAULT: 0
    }
});

var Table = jssql.Table;
var testTable = new Table('Orders', testScheme);

testDatabase.table([testTable]);

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

testTable.findAdvanced({}, {
    LIKE: {
        KEY: "NAME",
        VALUE: "Reg%"
    },
    AFTER: {
        KEY: "ID", VALUE: 200
    },
    LIMIT: 5,
    DEBUG: true
}).then((lRows) => {
    console.dir(lRows);
});