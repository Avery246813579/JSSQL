var mysql = require('mysql');

function Database(properties){
    this.tables = [];
    this.properties = {};

    if(typeof properties['host'] == 'undefined'){
        throw Error('Database host needs to be defined');
    }

    if(typeof properties['user'] == 'undefined'){
        throw Error('Database user needs to be defined');
    }

    if(typeof properties['password'] == 'undefined'){
        throw Error('Database password needs to be defined');
    }

    if(typeof properties['database'] == 'undefined'){
        throw Error('Database name needs to be defined');
    }

    if(typeof properties['port'] != 'undefined'){
        this.properties['port'] = properties['port'];
    }else{
        this.properties['port'] = 3306;
    }

    this.properties['host'] = properties['host'];
    this.properties['user'] = properties['user'];
    this.properties['password'] = properties['password'];

    this.init(properties['database']);
}

Database.prototype.init = function(database){
    var connection = this.connection = mysql.createConnection(this.properties);
    var current = this;

    connection.connect();

    connection.query('CREATE DATABASE IF NOT EXISTS ' + database, function(err, result){
        if(err){
            throw err;
        }

        current.loadPool();
    });

    this.properties['database'] = database;

    connection.end();
};

Database.prototype.loadPool = function(){
    this.properties['connectionLimit'] = 10;
    this.pool = mysql.createPool(this.properties, function(err){
        if(err){
            throw err;
        }
    });
    this.properties['connectionLimit'] = null;
};

Database.prototype.table = function(table){
    this.tables.push(table);

    table.assignDatabase(this);
    table.init();
};

Database.prototype.connect = function(properties, callback){

};

Database.prototype.disconnect = function(callback){

};

Database.prototype.toString = function(){
    var toReturn = "Database: ";

};

/**
 * var connection = mysql.createConnection({
        host     : 'pctdb.cc10qvoaikvx.us-east-1.rds.amazonaws.com',
        user     : 'root',
        password : 'frostbytedev246813579',
        port     : process.env.RDS_PORT,
        database : 'PCT'
    });
 */

module.exports = Database;
