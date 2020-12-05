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
    NAME: {
        TYPE: "VARCHAR",
        LENGTH: 20
    }
});

var accountScheme = new Scheme({
    ID: {
        TYPE: "INT",
        AI: true,
        INDEX: "PRIMARY KEY",
        NULL: false
    },
    NAME: {
        TYPE: "VARCHAR",
        LENGTH: 20
    }
});

var Table = jssql.Table;
var patrons = new Table('AAAA', testScheme);
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

// patrons.findAdvanced({}, {
//     LIKE: {KEY: "SAD", VALUE: "asfd"},
//     DEBUG: true,
//     GROUP_BY: [],
//     RIGHT_JOIN: {},
// }).then((lRows) => {
//     console.dir(lRows);
// });
// patrons.insert({ID: 20});
// let list = [];
// for (let i = 10000; i < 100000; i++) {
//     list.push({ID: i, NAME: "1"});
// }

patrons.insert([{
    ID: 1100, NAME: undefined
}, {
    NAME: "Pie", ID: 1112
}]);
