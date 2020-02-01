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

/**
 * Finds a singular element from a table. If more then one is found we will return the first one. If none are found
 * we return null.
 *
 * @param properties {Object}       The query we want to run
 * @param [callback] {Function}       Callback with the parameters of (err, row)
 * @returns {Promise}
 */
Table.prototype.findOne = function (properties, callback) {
    return new Promise((resolve, reject) => {
        this.find(properties, function (err, rows) {
            if (err) {
                if (callback) {
                    callback(err);
                }

                reject(err);
                return;
            }

            // Honestly don't think this case is ever hit
            if (rows === null) {
                if (callback) {
                    callback(err, null);
                }

                reject(err);
                return;
            }

            if (Object.keys(rows).length > 0) {
                if (callback) {
                    callback(err, rows[0]);
                }

                resolve(rows[0]);
            } else {
                if (callback) {
                    callback(err, null);
                }

                resolve(null);
            }
        });
    });
};

/**
 * Finds a list of rows based on the search properties
 *
 * @param properties                Properties we want to check
 * @param callback                  Callback with (err, rows)
 *
 * @returns {Promise<List>}
 */
Table.prototype.find = function (properties, callback) {
    return new Promise((resolve, reject) => {
        if (this.database == null) {
            let err = Error("Table '" + this.name + "' was never assigned a Database!");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        if (QueryHelper.checkData(this.scheme.getKeys(), properties)) {
            let err = Error("Certain keys are not found in Table '" + this.name + "' Scheme");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        let name = this.name;
        let pool = this.database.pool;
        QueryHelper.toKeyValue(properties, function (err, key, values) {
            if (err) {
                let err = new Error("Internal error trying to parse key value pair");
                if (callback) {
                    callback(err);
                }

                reject(err);
                return;
            }

            pool.getConnection(function (err, conn) {
                if (err) {
                    if (callback) {
                        callback(err);
                    }

                    reject(err);
                    return
                }

                let query = "SELECT * FROM " + name + " WHERE 1";
                if (Object.keys(properties).length > 0) {
                    query = "SELECT * FROM " + name + " WHERE " + key;
                }

                conn.query(query, values, function (err, rows) {
                    if (err) {
                        conn.release();

                        if (callback) {
                            callback(err);
                        }

                        reject(err);
                    } else {
                        if (callback) {
                            callback(undefined, rows);
                        }

                        resolve(rows);
                        conn.release();
                    }
                });
            })
        });
    });
};

/**
 * Finds using advanced stuff
 *
 * @param properties                Properties we want to check
 * @param advanced                  Object with LIMIT, AFTER, BEFORE, LIKE, COLUMNS, LEFT_JOIN, RIGHT_JOIN
 *
 * @returns {Promise<List>}
 */
Table.prototype.findAdvanced = function (properties, advanced={}) {
    return new Promise((resolve, reject) => {
        if (this.database == null) {
            return reject(new Error("Table '" + this.name + "' was never assigned a Database!"));
        }

        if (QueryHelper.checkData(this.scheme.getKeys(), properties)) {
            return reject(new Error("Certain keys are not found in Table '" + this.name + "' Scheme"));
        }

        let name = this.name;
        let pool = this.database.pool;
        QueryHelper.toKeyValue(properties, function (err, key, values) {
            if (err) {
                return reject(new Error("Internal error trying to parse key value pair"));
            }

            let columns = "*";
            if (advanced.COLUMNS) {
                columns = advanced.COLUMNS.join(", ");
            }

            let join = "";
            let leftDict = advanced.LEFT_JOIN, rightDict = advanced.RIGHT_JOIN;
            if (leftDict) {
                join = ` LEFT JOIN ${leftDict.TABLE} ON ${leftDict.LEFT} = ${leftDict.RIGHT}`
            } else if (rightDict) {
                join = ` RIGHT JOIN ${leftDict.TABLE} ON ${leftDict.LEFT} = ${leftDict.RIGHT}`
            }

            let query = `SELECT ${columns} FROM ${name + join} WHERE `;
            if (Object.keys(properties).length > 0) {
                query += key;
            } else {
                query += "1"
            }

            let beforeDict = advanced.BEFORE;
            if (beforeDict) {
                query += ` AND ${beforeDict.KEY} < ?`;
                values.push(beforeDict.VALUE);
            }

            let afterDict = advanced.AFTER;
            if (afterDict) {
                query += ` AND ${afterDict.KEY} > ?`;
                values.push(afterDict.VALUE);
            }

            let like = advanced.LIKE;
            if (advanced.LIKE) {
                let likes = like;
                if (Object.prototype.toString.call(like) !== '[object Array]') {
                    likes = [like];
                }

                for (let pair of likes) {
                    query += ` AND ${pair.KEY} LIKE ?`;
                    values.push(pair.VALUE);
                }
            }

            if (advanced.DESC) {
                query += ` ORDER BY ${advanced.DESC} DESC`
            }

            if (advanced.ASC) {
                query += ` ORDER BY ${advanced.ASC} DESC`
            }

            if (advanced.LIMIT) {
                query += " LIMIT "+ advanced.LIMIT;
            }

            pool.getConnection(function (err, conn) {
                if (err) {
                    return reject({...err, TABLE: name, QUERY: query});
                }

                if (advanced.DEBUG) {
                    console.log(query, values);
                }

                conn.query(query, values, function (err, rows) {
                    conn.release();

                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            })
        });
    });
};

/**
 * Finds a list of rows like the properties given
 *
 * @param properties            Properties
 * @param callback              Callback which returns (err, rows)
 * @param limit                 Limit of amount of rows
 *
 * @returns {Promise<List<Object>>}
 */
Table.prototype.findLike = function (properties, callback, limit) {
    return new Promise((resolve, reject) => {
        if (this.database == null) {
            let err = Error("Table '" + this.name + "' was never assigned a Database!");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        if (QueryHelper.checkData(this.scheme.getKeys(), properties)) {
            let err = Error("Certain keys are not found in Table '" + this.name + "' Scheme");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        let name = this.name;
        let pool = this.database.pool;
        QueryHelper.toLikeKeyValue(properties, function (err, key, values) {
            if (err) {
                let err = new Error("Internal error trying to parse key value pair");
                if (callback) {
                    callback(err);
                }

                reject(err);
                return;
            }

            pool.getConnection(function (err, conn) {
                if (err) {
                    if (callback) {
                        callback(err);
                    }

                    reject(err);
                    return;
                }

                let query = "SELECT * FROM " + name + " WHERE 1";
                if (Object.keys(properties).length > 0) {
                    query = "SELECT * FROM " + name + " WHERE " + key;
                }

                if (typeof limit != "undefined") {
                    query += " LIMIT " + limit;
                }

                conn.query(query, values, function (err, rows) {
                    if (err) {
                        conn.release();

                        if (callback) {
                            callback(err);
                        }

                        reject(err);
                    } else {
                        conn.release();

                        if (callback) {
                            callback(err, rows);
                        }

                        resolve(rows);
                    }
                });
            })
        });
    });
};

/**
 * Send a raw query and get a list of rows back
 *
 * @param query         Sql Query
 * @param callback      (err, rows)
 *
 * @returns {Promise<List>}
 */
Table.prototype.query = function (query, callback) {
    return new Promise((resolve, reject) => {
        if (this.database == null) {
            let err = Error("Table '" + this.name + "' was never assigned a Database!");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        let name = this.name;
        let pool = this.database.pool;
        pool.getConnection(function (err, conn) {
            if (err) {
                if (callback) {
                    callback(err);
                }

                reject(err);
                return;
            }

            conn.query(query, function (err, rows) {
                conn.release();

                if (err) {
                    if (callback) {
                        callback(err);
                    }

                    reject(err);
                } else {
                    if (callback) {
                        callback(err, rows);
                    }

                    resolve(rows);
                }
            });
        });
    });
};

/**
 * Returns the number of rows in a table
 *
 * @param callback  (error, num_of_rows (int))
 */
Table.prototype.count = function (callback) {
    return new Promise((resolve, reject) => {
        if (this.database == null) {
            let err = Error("Table '" + this.name + "' was never assigned a Database!");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        let name = this.name;
        let pool = this.database.pool;
        pool.getConnection(function (err, conn) {
            if (err) {
                if (callback) {
                    callback(err);
                }

                reject(err);
                return;
            }

            conn.query("SELECT COUNT(*) FROM " + name, function (err, result) {
                conn.release();

                if (err) {
                    if (callback) {
                        callback(err);
                    }

                    reject(err);
                } else {
                    if (callback) {
                        callback(undefined, result[0]['COUNT(*)']);
                    }

                    resolve(result[0]['COUNT(*)']);
                }
            });
        });
    });
};

/**
 * Inserts a row into a table
 *
 * @param properties        Properties
 * @param callback          (err, rowId)
 * @returns {*}             Promise
 */
Table.prototype.insert = function (properties, callback) {
    return this.save(properties, callback);
};

/**
 * Saves a row
 *
 * @param properties            Properties
 * @param callback              (err, recordId)
 * @returns {Promise<any>}
 */
Table.prototype.save = function (properties, callback) {
    return new Promise((resolve, reject) => {
        if (this.database == null) {
            let err = Error("Table '" + this.name + "' was never assigned a Database!");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        if (QueryHelper.checkData(this.scheme.getKeys(), properties)) {
            let err = Error("Certain keys are not found in Table '" + this.name + "' Scheme");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        let name = this.name;
        let pool = this.database.pool;
        QueryHelper.toValues(properties, function (key, values, valuesArray) {
            pool.getConnection(function (err, conn) {
                if (err) {
                    if (callback) {
                        callback(err);
                    }

                    reject(err);
                    return;
                }

                conn.query("INSERT INTO " + name + " (" + key + ") VALUES (" + values + ")", valuesArray, function (err, result) {
                    conn.release();

                    if (err) {
                        if (callback) {
                            callback(err);
                        }

                        reject(err);
                    } else {
                        if (callback) {
                            callback(undefined, result.insertId);
                        }

                        resolve(result.insertId);
                    }
                });
            });
        });
    });
};

/**
 * Updates a row
 *
 * @param update            What we want to update
 * @param where             Which rows we want to update
 * @param callback          (err, rows)
 *
 * @returns {Promise<List<Object>>>}
 */
Table.prototype.update = function (update, where, callback) {
    var instance = this;

    return new Promise((resolve, reject) => {
        if (this.database == null) {
            let err = Error("Table '" + this.name + "' was never assigned a Database!");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        if (QueryHelper.checkData(this.scheme.getKeys(), update)) {
            let err = Error("Certain keys are not found in Table '" + this.name + "' Scheme");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        if (QueryHelper.checkData(this.scheme.getKeys(), where)) {
            let err = Error("Certain keys are not found in Table '" + this.name + "' Scheme");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        let instance = this;
        let name = this.name;
        let pool = instance.database.pool;
        QueryHelper.toKeyValueComma(update, function (err, updateKeys, values) {
            if (err) {
                if (callback) {
                    callback(err);
                }

                reject(err);
                return;
            }

            QueryHelper.toKeyValue(where, function (err, whereKeys, whereValues) {
                if (err) {
                    if (callback) {
                        callback(err);
                    }

                    reject(err);
                    return;
                }

                for (let i = 0; i < whereValues.length; i++) {
                    values.push(whereValues[i]);
                }

                pool.getConnection(function (err, conn) {
                    if (err) {
                        if (callback) {
                            callback(err);
                        }

                        reject(err);
                        return;
                    }

                    conn.query("UPDATE " + name + " SET " + updateKeys + " WHERE " + whereKeys, values, function (err, result) {
                        conn.release();

                        if (err) {
                            if (callback) {
                                callback(err);
                            }

                            reject(err);
                        } else {
                            instance.find(where, function (err, rows) {
                                if (err) {
                                    if (callback) {
                                        callback(err);
                                    }

                                    reject(err);
                                    return;
                                }

                                if (callback) {
                                    callback(err, rows);
                                }

                                resolve(rows);
                            })
                        }
                    });
                });
            });
        });
    });
};

/**
 * Deletes a rows
 * @param properties        Properties for the rows we want to delete
 * @param callback          (err)
 *
 * @returns {Promise<>}
 */
Table.prototype.delete = function (properties, callback) {
    return new Promise((resolve, reject) => {
        if (this.database == null) {
            let err = Error("Table '" + this.name + "' was never assigned a Database!");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        if (QueryHelper.checkData(this.scheme.getKeys(), properties)) {
            let err = Error("Certain keys are not found in Table '" + this.name + "' Scheme");
            if (callback) {
                callback(err);
            }

            reject(err);
            return;
        }

        let name = this.name;
        let pool = this.database.pool;
        QueryHelper.toKeyValue(properties, function (err, key, values) {
            if (err) {
                if (callback) {
                    callback(err);
                }

                reject(err);
                return;
            }

            pool.getConnection(function (err, conn) {
                if (err) {
                    if (callback) {
                        callback(err);
                    }

                    reject(err);
                    return;
                }

                if (Object.keys(properties).length > 0) {
                    conn.query("DELETE FROM " + name + " WHERE " + key, values, function (err, payload) {
                        conn.release();

                        if (err) {
                            if (callback) {
                                callback(err);
                            }

                            reject(err);
                        } else {
                            if (callback) {
                                callback(err, payload);
                            }

                            resolve(payload);
                        }
                    });
                } else {
                    let err = new Error("Something went wrong? Did you set properties?");
                    if (callback) {
                        callback(err);
                    }

                    reject(err)
                }
            })
        });
    });
};

Table.prototype.toString = function () {
    return "[Table] " + this.name;
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
            if (key.getIndex() === "PRIMARY KEY") {
                if (key.isAI()) {
                    toReturn = key.getName();
                }
            }
        }
    });

    return toReturn;
};


module.exports = Table;