var QueryHelper = require('./util/queryHelper.js');

function Table(name, scheme) {
    this.name = name;
    this.scheme = scheme;
}

Table.prototype.assignDatabase = function (database) {
    this.database = database;
};

Table.prototype.init = function () {
    var pool = this.database.pool;
    var query = this.toCreate();
    var instance = this;

    if (typeof pool == 'undefined') {
        setTimeout(function () {
            instance.init();
        }, 100);

        return;
    }

    pool.getConnection(function (err, conn) {
        if (err) {
            throw err;
        }

        conn.query(query, function (err) {
            if (err) {
                throw err;
            }
        });

        conn.release();
    });
};

Table.prototype.findOne = function (properties, callback) {
    this.find(properties, function (err, rows) {
        if (err) {
            callback(err);
        }

        if (rows == null) {
            callback(err, null);
            return;
        }

        if (Object.keys(rows).length > 0) {
            callback(err, rows[0]);
        } else {
            callback(err, null);
        }
    });
};

Table.prototype.find = function (properties, callback, tries) {
    var instance = this;

    if (this.database == null) {
        callback(Error("Table not assigned a database!"));
    }

    if (QueryHelper.checkData(this.scheme.getKeys(), properties)) {
        callback(Error("Certain keys are not found in Table Scheme!"))
    }

    var pool = this.database.pool;
    if (typeof instance.database.done == 'undefined') {
        setTimeout(function () {
            if (typeof instance.database.done == 'undefined' && typeof tries != "undefined") {
                if (tries > 2) {
                    callback("Could not find a database connection");                }
            } else {
                var tr = 0;
                if(typeof tries != "undefined"){
                    tr = tries;
                }

                instance.find(properties, callback, tries + 1);
            }
        }, 100);

        return;
    }
    QueryHelper.toKeyValue(properties, function (err, key, values) {
        if (err) {
            callback(Error("Error parsing properties. This is awkward."));
        }

        var name = instance.name;
        pool.getConnection(function (err, conn) {
            if (err) {
                callback(err);
            }

            var query = "SELECT * FROM " + name + " WHERE 1";
            if (Object.keys(properties).length > 0) {
                query = "SELECT * FROM " + name + " WHERE " + key;
            }

            conn.query(query, values, function (err, rows) {
                if (err) {
                    conn.release();

                    callback(err);
                } else {
                    callback(err, rows);

                    conn.release();
                }
            });
        })
    });
};

Table.prototype.findLike = function (properties, callback, limit, tries) {
    var instance = this;

    if (this.database == null) {
        callback(Error("Table not assigned a database!"));
    }

    if (QueryHelper.checkData(this.scheme.getKeys(), properties)) {
        callback(Error("Certain keys are not found in Table Scheme!"))
    }

    var pool = instance.database.pool;
    if (typeof instance.database.done == 'undefined') {
        setTimeout(function () {
            if (typeof instance.database.done == 'undefined' && typeof tries != "undefined") {
                if (tries > 2) {
                    callback("Could not find a database connection");                }
            } else {
                var tr = 0;
                if(typeof tries != "undefined"){
                    tr = tries;
                }

                instance.findLike(properties, callback, limit, tries + 1);
            }
        }, 100);

        return;
    }

    QueryHelper.toLikeKeyValue(properties, function (err, key, values) {
        if (err) {
            callback(Error("Error parsing properties. This is awkward."));
        }

        var name = instance.name;
        pool.getConnection(function (err, conn) {
            if (err) {
                callback(err);
            }

            var query = "SELECT * FROM " + name + " WHERE 1";
            if (Object.keys(properties).length > 0) {
                query = "SELECT * FROM " + name + " WHERE " + key;
            }

            if (typeof limit != "undefined") {
                query += " LIMIT " + limit;
            }

            conn.query(query, values, function (err, rows) {
                if (err) {
                    conn.release();

                    callback(err);
                } else {
                    callback(err, rows);

                    conn.release();
                }
            });
        })
    });
};


Table.prototype.insert = function (properties, callback) {
    this.save(properties, callback);
};

Table.prototype.save = function (properties, callback, tries) {
    var instance = this;

    if (this.database == null) {
        callback(Error("Table not assigned a database!"));
    }

    if (QueryHelper.checkData(this.scheme.getKeys(), properties)) {
        callback(Error("Certain keys are not found in Table Scheme!"))
    }

    var pool = instance.database.pool;
    if (typeof instance.database.done == 'undefined') {
        setTimeout(function () {
            if (typeof instance.database.done == 'undefined' && typeof tries != "undefined") {
                if (tries > 2) {
                    callback("Could not find a database connection");                }
            } else {
                var tr = 0;
                if(typeof tries != "undefined"){
                    tr = tries;
                }

                instance.save(properties, callback, tries + 1);
            }
        }, 100);

        return;
    }

    var name = this.name;
    QueryHelper.toValues(properties, function (key, values, valuesArray) {
        pool.getConnection(function (err, conn) {
            if (err) {
                callback(err);
            }

            conn.query("INSERT INTO " + name + " (" + key + ") VALUES (" + values + ")", valuesArray, function (err, result) {
                if (err) {
                    conn.release();

                    callback(err);
                } else {
                    conn.release();

                    var insertKey = instance.getInsertKey();
                    if (insertKey != null) {
                        var props = {};
                        props[insertKey] = result.insertId;

                        instance.findOne(props, function (err, row) {
                            if (err) {
                                callback(err);
                            }

                            callback(err, row);
                        });
                    } else {
                        callback(err);
                    }
                }
            });
        });
    });
};

Table.prototype.update = function (update, where, callback, tries) {
    var instance = this;

    if (this.database == null) {
        callback(Error("Table not assigned a database!"));
    }

    if (QueryHelper.checkData(this.scheme.getKeys(), update)) {
        callback(Error("Certain keys are not found in Table Scheme!"))
    }

    if (QueryHelper.checkData(this.scheme.getKeys(), where)) {
        callback(Error("Certain Where Keys are not found in Table Scheme!"))
    }

    var pool = instance.database.pool;
    if (typeof instance.database.done == 'undefined') {
        setTimeout(function () {
            if (typeof instance.database.done == 'undefined' && typeof tries != "undefined") {
                if (tries > 2) {
                    callback("Could not find a database connection");                }
            } else {
                var tr = 0;
                if(typeof tries != "undefined"){
                    tr = tries;
                }

                instance.update(update, where, callback, tries + 1);
            }
        }, 100);

        return;
    }

    var name = this.name;
    QueryHelper.toKeyValueComma(update, function (err, updateKeys, values) {
        if (err) {
            callback(err);
        }

        QueryHelper.toKeyValue(where, function (err, whereKeys, whereValues) {
            if (err) {
                callback(err);
            }

            for (var i = 0; i < whereValues.length; i++) {
                values.push(whereValues[i]);
            }

            pool.getConnection(function (err, conn) {
                if (err) {
                    callback(err);
                }

                conn.query("UPDATE " + name + " SET " + updateKeys + " WHERE " + whereKeys, values, function (err, result) {
                    if (err) {
                        conn.release();

                        callback(err);
                    } else {
                        conn.release();

                        instance.find(where, function (err, rows) {
                            if (err) {
                                callback(err);
                            }

                            callback(err, rows);
                        })
                    }
                });
            });
        });
    });
};

Table.prototype.delete = function (properties, callback, tries) {
    var instance = this;

    if (this.database == null) {
        callback(Error("Table not assigned a database!"));
    }

    if (QueryHelper.checkData(this.scheme.getKeys(), properties)) {
        callback(Error("Certain keys are not found in Table Scheme!"))
    }

    var pool = instance.database.pool;
    if (typeof instance.database.done == 'undefined') {
        setTimeout(function () {
            if (typeof instance.database.done == 'undefined' && typeof tries != "undefined") {
                if (tries > 2) {
                    callback("Could not find a database connection");                }
            } else {
                var tr = 0;
                if(typeof tries != "undefined"){
                    tr = tries;
                }

                instance.delete(properties, callback, tries + 1);
            }
        }, 100);

        return;
    }

    QueryHelper.toKeyValue(properties, function (err, key, values) {
        if (err) {
            callback(Error("Error parsing properties. This is awkward."));

            return;
        }

        var name = instance.name;
        pool.getConnection(function (err, conn) {
            if (err) {
                callback(err);
            }

            if (Object.keys(properties).length > 0) {
                conn.query("DELETE FROM " + name + " WHERE " + key, values, function (err) {
                    if (err) {
                        conn.release();

                        callback(err);
                    } else {
                        callback(err);

                        conn.release();
                    }
                });
            } else {
                callback(Error("Almost catastrophic failure. Please add where properties for the desired rows you want to delete!"));
            }
        })
    });
};

Table.prototype.toString = function () {

};

Table.prototype.toCreate = function () {
    var toReturn = "CREATE TABLE IF NOT EXISTS " + this.name + " (";
    var body = "";
    var suffix = "";

    this.scheme.getColumns().forEach(function (key) {
        body += ", " + key.toString();

        if (key.hasIndex()) {
            suffix += ", " + key.getIndex() + " (" + key.getName() + ")";
        }

        if (key.hasForeign()) {
            suffix += ", FOREIGN KEY (" + key.getName() + ") REFERENCES " + key.getForeign().table + "(" + key.getForeign().key + ")";

            if (typeof key.getForeign().onDelete != 'undefined') {
                suffix += "ON DELETE " + key.getForeign().onDelete;
            }
        }
    });

    return toReturn + body.substr(2) + suffix + ")";
};

Table.prototype.getInsertKey = function () {
    var toReturn = null;

    this.scheme.getColumns().forEach(function (key) {
        if (key.hasIndex()) {
            if (key.getIndex() == "PRIMARY KEY") {
                if (key.isAI()) {
                    toReturn = key.getName();
                }
            }
        }
    });

    return toReturn;
};


module.exports = Table;