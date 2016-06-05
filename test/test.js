var jssql = require('../lib/index.js');

var queryHelper = require('../lib/util/queryHelper.js');
//
//var test = [
//    {
//        DOG: "ONE",
//        CAT: "TWO"
//    },
//    {
//        DOG: "TWO",
//        CAT: "ONE"
//    }
//];
//
//queryHelper.toKeyValue(test, function (err, keys, values) {
//    if (err) {
//        throw err;
//    }
//
//    console.log(keys);
//    console.dir(values);
//});


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
        type: "VARCHAR",
        length: 100
    }
});

var Table = jssql.Table;
var testTable = new Table('TABLE_NAME', testScheme);

var foreignScheme = new Scheme({
    ID: {
        type: Structure.Type.INT,
        AI: true,
        Index: Structure.Index.PRIMARY
    },
    FOREIGN_KEY: {
        type: "INT",
        foreign: {
            key: "ID",
            table: "TABLE_NAME"
        }
    }
});

var foreignTable = new Table('FOREIGN_TABLE', foreignScheme);

testDatabase.table(testTable);
testDatabase.table(foreignTable);

testTable.delete({
    NAME: 'BOB'
}, function(err){
    if(err){
        throw err;
    }
});