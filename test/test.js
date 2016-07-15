var jssql = require('../lib/index.js');

var queryHelper = require('../lib/util/queryHelper.js');



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

 testTable.update({NAME: "PEWDIEPIE"}, {ID: 14}, function(err, row){
     if(err){
         throw err;
     }

    console.dir(row[0]['ID']);
 });
