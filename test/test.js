var jssql = require('../lib/index.js');

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

testDatabase.table(testTable);

testTable.save({
    NAME: "JOHN"
}, function(err){
    if(err)
        throw err;
});

setTimeout(function(){
    testTable.find({
        NAME: "JOHN"
    }, function(err, rows){
        if(err){
            throw err;
        }

        console.dir(rows);
    });
}, 1000);