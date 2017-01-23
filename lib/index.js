var Scheme = require('./table/scheme.js'),
    Table = require('./table/table.js'),
    Database = require('./database.js'),
    Structure = require('./structure.js');

function JsSQL(){
    this.databases = {};
}

JsSQL.prototype.database = function(name){

};

JsSQL.prototype.Scheme = Scheme;
JsSQL.prototype.Table = Table;
JsSQL.prototype.Database = Database;
JsSQL.prototype.Structure = Structure;

module.exports = exports = new JsSQL;