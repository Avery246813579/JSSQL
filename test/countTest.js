var JSSQL = require('../lib/index.js');

var queryHelper = require('../lib/util/queryHelper.js');

var testDatabase = new JSSQL.Database({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'TEST_DATABASE'
});

var testScheme = new JSSQL.Scheme({
    ID: {
        type: "INT",
        AI: true,
        Index: "PRIMARY"
    },
    NAME: {
        type: "VARCHAR",
        length: 100
    }
});

var testTable = new JSSQL.Table('TABLE_NAME', testScheme);
testDatabase.table([testTable]);

testTable.count(function(error, count){
   if(error){
       console.log(error);
       return;
   }

   console.dir(count);
});