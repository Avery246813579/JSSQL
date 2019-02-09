var jssql = require('./../src/index.js');

var Database = jssql.Database;
var testDatabase = new Database({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'TEST_DATABASE'
});

var Scheme = jssql.Scheme;
var Structure = jssql.Structure;

var testScheme = new Scheme({
    ID: {
        type: Structure.Type.INT,
        AI: true,
        Index: Structure.Index.PRIMARY
    },
    NAME: {
        type: "DECIMAL",
        length: 10,
        decimal: 5,
        default: 1.2
    }
});

var Table = jssql.Table;
var testTable = new Table('Tes2', testScheme);

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

testTable.findOne({ID: 2}).then((row) => {
    console.dir(row);
}).catch((err) => {
    console.dir(err);
});

// testTable.update({NAME: 69.9}, {ID: 1}).then((newRow) => {
//     console.dir(newRow);
// }).catch((err) => {
//     throw err;
// });

// testTable.delete({ID: 1}).then(() => {
//     console.log("Deleted");
// }).catch((err) => {
//      throw err;
// });