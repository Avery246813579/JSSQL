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
        type: "DECIMAL",
        length: 10,
        decimal: 5
    }
});

var Table = jssql.Table;
var testTable = new Table('TestDawg', testScheme);

testDatabase.table([testTable]);
