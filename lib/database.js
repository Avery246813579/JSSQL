var mysql = require('mysql');

function Database(properties) {
    this.tables = [];
    this.properties = {};

    if (typeof properties['host'] == 'undefined') {
        throw Error('Database host needs to be defined');
    }

    if (typeof properties['user'] == 'undefined') {
        throw Error('Database user needs to be defined');
    }

    if (typeof properties['password'] == 'undefined') {
        throw Error('Database password needs to be defined');
    }

    if (typeof properties['database'] == 'undefined') {
        throw Error('Database name needs to be defined');
    }

    if (typeof properties['port'] != 'undefined') {
        this.properties['port'] = properties['port'];
    } else {
        this.properties['port'] = 3306;
    }

    this.properties['host'] = properties['host'];
    this.properties['user'] = properties['user'];
    this.properties['password'] = properties['password'];
    this.properties['database'] = properties['database'];

    this.loadPool();
}

Database.prototype.loadPool = function (tried) {
    this.properties['connectionLimit'] = 10;

    var instance = this;
    this.pool = mysql.createPool(this.properties, function (err) {
        if (err) {
            throw err;
        }
    });

    this.properties['connectionLimit'] = null;
};

Database.prototype.table = function (table) {
    if (Object.prototype.toString.call(table) === '[object Array]') {
        var toCreate = 'CREATE DATABASE IF NOT EXISTS ' + this.properties['database'] + ";USE " + this.properties['database'] + ";";

        for (var i = 0; i < table.length; i++) {
            var cTable = table[i];

            cTable.assignDatabase(this);
            toCreate += cTable.toCreate() + ";";
        }

        var newProp = this.properties;
        newProp['multipleStatements'] = true;
        delete newProp['database'];
        delete newProp['connectionLimit'];
        var conn = mysql.createConnection(newProp);

        var instance = this;
        conn.query(toCreate, function (err, result) {
            if (err) {
                throw err;
            }

            instance.done = true;
        });

        conn.end();
    } else {

        this.tables.push(table);

        table.assignDatabase(this);
        table.init();
    }
};

Database.prototype.connect = function (properties, callback) {

};

Database.prototype.disconnect = function (callback) {

};

Database.prototype.toString = function () {
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
