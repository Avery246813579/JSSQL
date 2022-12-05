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

    this.properties = properties;
    this.loadPool();
}

Database.prototype.loadPool = function (tried) {
    let {connectionLimit} = this.properties;

    this.properties['connectionLimit'] = 10;
    if (connectionLimit) {
        this.properties.connectionLimit = connectionLimit;
    }

    this.pool = mysql.createPool(this.properties, function (err) {
        if (err) {
            throw err;
        }
    });
};

/**
 * Attaches either an array or tables, or a singular table to a Database
 *
 * @param table     An array of tables or a singular table
 * @param readOnlyDatabase (optional) A separate Database object that will serve as a replica READ_ONLY database for advanced find calls
 */
Database.prototype.table = function (table, readOnlyDatabase = null) {
    if (Object.prototype.toString.call(table) === '[object Array]') {
        var toCreate = 'CREATE DATABASE IF NOT EXISTS ' + this.properties['database'] + ";USE " + this.properties['database'] + ";";

        for (var i = 0; i < table.length; i++) {
            var cTable = table[i];

            cTable.assignDatabase(this, readOnlyDatabase);
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

        table.assignDatabase(this, readOnlyDatabase);
        table.init();
    }
};

Database.prototype.connect = function (properties, callback) {

};

Database.prototype.disconnect = function (callback) {
    this.pool.end();
};

Database.prototype.toString = function () {
    var toReturn = "Database: ";

};

module.exports = Database;
