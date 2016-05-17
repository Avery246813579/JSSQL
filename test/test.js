var jssql = require('../index.js');
var Scheme = jssql.Scheme;
var Table = jssql.Table;
var Database = jssql.Database;
var Structure = jssql.Structure;

var testScheme = new Scheme({
    ID: {
        type: Structure.Type.INT,
        AI: true,
        Index: Structure.Index.PRIMARY
    },
    NAME: {
        type: Structure.Type.VARCHAR,
        length: 100
    }

});

var testTable = new Table('name', testScheme);

var database = new Database({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'TEST'
});

database.table(testTable);

function haulResponse(error, rows){
    if (error) {
        return 'Error\n' + error;
    } else {
        return '' + JSON.stringify(rows, function (key, value) {
                if (Buffer.isBuffer(value)) {
                    return value.toString();
                } else {
                    return value;
                }
            });
    }
}