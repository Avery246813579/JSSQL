var QueryHelper = require('./util/queryHelper.js');

function Table(name, scheme) {
    this.name = name;
    this.scheme = scheme;
}

Table.prototype.assignDatabase = function (database, readOnlyDatabase = null) {
    this.database = database;
    if(readOnlyDatabase){
        this.databaseReadOnly = readOnlyDatabase
    }
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
 * Do an advanced find and get only one row
 *
 * @param properties                Basic properties
 * @param advanced                  Advanced properties
 * @return {Promise<unknown>}
 */
Table.prototype.findOneAdvanced = function (properties, advanced) {
    return new Promise((resolve, reject) => {
        this.findAdvanced(properties, advanced).then((rows) => {
            if (rows === null) {
                return reject("INTERNAL_ERROR");
            }

            if (Object.keys(rows).length > 0) {
                resolve(rows[0]);
            } else {
                resolve(null);
            }
        }).catch((err) => {
            reject(err)
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

        if (Array.isArray(properties) && properties.length > 1000) {
            let finds = [];
            for (let i = 0; i < properties.length; i += 1000) {
                let section = properties.slice(i, i + 1000);

                finds.push(this.find(section));
            }

            return Promise.all(finds).then((data) => {
                resolve(data.reduce((list, item) => {
                    list.push(...item);

                    return list;
                }, []));
            }).catch((err) => {
                reject(err)
            });
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
 * @param properties                                Properties we want to check
 * @param advanced {Object}                         Object to input advanced query parameters
 *
 * @param advanced.READ_ONLY {Boolean}              Execute find on Read Only Database
 *
 * @param advanced.COLUMNS {String[]}               Returns certain columns back
 * @param advanced.GROUP_BY {String|Array}          Group columns together
 * @param advanced.ORDER_BY {String|Array}          Orders columns returned together
 * @param advanced.LIMIT {Number}                   Limit number of rows returned
 * @param advanced.OFFSET {Number}                  Number of rows to offset into result set
 * @param advanced.DESC  {String}                   Descend results by this column
 * @param advanced.ASC  {String}                    Ascend results by this column
 * @param advanced.NEST_TABLES  {String}            Change how you want nested tables to respond
 *
 * @param advanced.NOT {String|Array}               Not equals or not null comparisons
 * @param advanced.EXISTS {String|Array}            Sub where conditions to verify existence of a complex condition
 * @param advanced.NOT_EXISTS {String | Array}      Inverse of EXISTS
 * @param advanced.AFTER {Object}                   Greater then comparison. Selects values after a key, value pair
 * @param advanced.AFTER.KEY {String}               Column in comparison
 * @param advanced.AFTER.VALUE {string|number}      Value in comparison
 * @param advanced.BEFORE {Object}                  Less then comparison. Selects values after a key, value pair
 * @param advanced.BEFORE.KEY {String}              Column in comparison
 * @param advanced.BEFORE.VALUE {string|number}     Value in comparison
 *
 * @param advanced.HAVING {string}                  HAVING clause (pretty much WHERE clause but can be used with aggregate functions)
 *
 * @param advanced.LIKE {Object|Array}              Search for rows like the following
 * @param advanced.LIKE.KEY {String}                Column in comparison
 * @param advanced.LIKE.VALUE {String}              Value in comparison
 * @param advanced.LIKE.CONJUNCTION {[String]}      Used for custom conjunctions
 *
 * @param advanced.RIGHT_JOIN {Object|Array}        SQL right join. Can be array for multi join or object for single
 *     join.
 * @param advanced.RIGHT_JOIN.TABLE {String}        Table we want to perform join on
 * @param advanced.RIGHT_JOIN.LEFT {String}         Left value of comparison
 * @param advanced.RIGHT_JOIN.RIGHT {String}        Right value of comparison
 *
 * @param advanced.INNER_JOIN {Object|Array}        SQL inner join. Can be array for multi join or object for single
 *     join.
 * @param advanced.INNER_JOIN.TABLE {String}        Table we want to perform join on
 * @param advanced.INNER_JOIN.LEFT {String}         Left value of comparison
 * @param advanced.INNER_JOIN.RIGHT {String}        Right value of comparison
 *
 * @param advanced.LEFT_JOIN {Object|Array}         SQL left join. Can be array for multi join or object for single
 *     join.
 * @param advanced.LEFT_JOIN.TABLE {String}         Table we want to perform join on
 * @param advanced.LEFT_JOIN.LEFT {String}          Left value of comparison
 * @param advanced.LEFT_JOIN.RIGHT {String}         Right value of comparison
 *
 * @param advanced.FULL_JOIN {Object|Array}         SQL full join. Can be array for multi join or object for single
 *     join.
 * @param advanced.FULL_JOIN.TABLE {String}         Table we want to perform join on
 * @param advanced.FULL_JOIN.LEFT {String}          Left value of comparison
 * @param advanced.FULL_JOIN.RIGHT {String}         Right value of comparison
 *
 * @returns {Promise<List>}
 */
Table.prototype.findAdvanced = function (properties, advanced = {}) {
    return new Promise((resolve, reject) => {
        if (Array.isArray(properties) && properties.length > 1000) {
            let finds = [];
            for (let i = 0; i < properties.length; i += 1000) {
                let section = properties.slice(i, i + 1000);

                finds.push(this.findAdvanced(section, advanced));
            }

            return Promise.all(finds).then((data) => {
                resolve(data.reduce((list, item) => {
                    list.push(...item);

                    return list;
                }, []));
            }).catch((err) => {
                reject(err)
            });
        }

        if (this.database == null) {
            return reject(new Error("Table '" + this.name + "' was never assigned a Database!"));
        }

        let name = this.name;
        let pool = this.database.pool;

        if(advanced.READ_ONLY && this.databaseReadOnly){
            pool = this.databaseReadOnly.pool
        }

        QueryHelper.toKeyValue(properties, function (err, key, values) {
            if (err) {
                return reject(new Error("Internal error trying to parse key value pair"));
            }

            let columns = "*";
            if (advanced.COLUMNS) {
                columns = advanced.COLUMNS.join(", ");
            }

            let extraQueryParams = {};
            if (advanced.NEST_TABLES) {
                extraQueryParams.nestTables = advanced.NEST_TABLES;
            }

            let join = "";
            let leftDict = advanced.LEFT_JOIN, rightDict = advanced.RIGHT_JOIN;
            let innerDict = advanced.INNER_JOIN, fullDict = advanced.FULL_JOIN;
            if (leftDict) {
                if (!Array.isArray(leftDict)) {
                    leftDict = [leftDict];
                }

                for (let left of leftDict) {
                    if (left.WHERE) {
                        join += ` LEFT JOIN ${left.TABLE} ON `

                        if (!Array.isArray(left.WHERE)) {
                            left.WHERE = [left.WHERE];
                        }

                        join += left.WHERE.map((left) => {
                            return `${left.LEFT} = ${left.RIGHT}`
                        }).join(left.OPERATOR || " AND ");
                    } else {
                        join += ` LEFT JOIN ${left.TABLE} ON ${left.LEFT} = ${left.RIGHT}`
                    }
                }
            }

            if (rightDict) {
                if (!Array.isArray(rightDict)) {
                    rightDict = [rightDict];
                }

                for (let right of rightDict) {
                    if (right.WHERE) {
                        join += ` RIGHT JOIN ${right.TABLE} ON `

                        if (!Array.isArray(right.WHERE)) {
                            right.WHERE = [right.WHERE];
                        }

                        join += right.WHERE.map((left) => {
                            return `${left.LEFT} = ${left.RIGHT}`
                        }).join(right.OPERATOR || " AND ");
                    } else {
                        join += ` RIGHT JOIN ${right.TABLE} ON ${right.LEFT} = ${right.RIGHT}`
                    }
                }
            }

            if (innerDict) {
                if (!Array.isArray(innerDict)) {
                    innerDict = [innerDict];
                }

                for (let inner of innerDict) {
                    if (inner.WHERE) {
                        join += ` INNER JOIN ${inner.TABLE} ON `

                        if (!Array.isArray(inner.WHERE)) {
                            inner.WHERE = [inner.WHERE];
                        }

                        join += inner.WHERE.map((left) => {
                            return `${left.LEFT} = ${left.RIGHT}`
                        }).join(inner.OPERATOR || " AND ");
                    } else {
                        join += ` INNER JOIN ${inner.TABLE} ON ${inner.LEFT} = ${inner.RIGHT}`
                    }
                }
            }

            if (fullDict) {
                if (!Array.isArray(fullDict)) {
                    fullDict = [fullDict];
                }

                for (let full of fullDict) {
                    if (full.WHERE) {
                        join += ` FULL JOIN ${full.TABLE} ON `

                        if (!Array.isArray(full.WHERE)) {
                            full.WHERE = [full.WHERE];
                        }

                        join += full.WHERE.map((left) => {
                            return `${left.LEFT} = ${left.RIGHT}`
                        }).join(full.OPERATOR || " AND ");
                    } else {
                        join += ` FULL JOIN ${full.TABLE} ON ${full.LEFT} = ${full.RIGHT}`
                    }
                }
            }

            let query = `SELECT ${columns} FROM ${name + join} WHERE `;
            if (Object.keys(properties).length > 0) {
                query += key;
            } else {
                query += "1"
            }

            let beforeDict = advanced.BEFORE;
            if (beforeDict) {
                if (Array.isArray(beforeDict)) {
                    for(const b4 of beforeDict){
                        query += ` AND ${b4.KEY} < ?`;
                        values.push(b4.VALUE);
                    }
                } else{
                    query += ` AND ${beforeDict.KEY} < ?`;
                    values.push(beforeDict.VALUE);
                }
            }

            let afterDict = advanced.AFTER;
            if (afterDict) {
                if (Array.isArray(afterDict)) {
                    for(const a4 of afterDict){
                        query += ` AND ${a4.KEY} > ?`;
                        values.push(a4.VALUE);
                    }
                } else{
                    query += ` AND ${afterDict.KEY} > ?`;
                    values.push(afterDict.VALUE);
                }
            }

            const getConditions = (obj, values=[]) => {
                if (Array.isArray(obj)) {
                    let lastConjunction = null;

                    return {query: "(" + obj.map((item, i) => {
                            let {query, values: newVals, conjunction="AND"} = getConditions(item, values);

                            lastConjunction = conjunction;
                            return query + (i + 1 < obj.length ? " " + conjunction + " " : "");
                        }).join("") + ")", values, conjunction: lastConjunction};
                }

                let {KEY, VALUE, OPERATION="=", CONJUNCTION="AND"} = obj;
                values.push(VALUE);

                return {query: KEY + " " + OPERATION + " ?", values, conjunction: CONJUNCTION};
            }

            let advancedWhere = advanced.WHERE;
            if (advancedWhere) {
                let {query: conditionQuery, values: conditionValues} = getConditions(advancedWhere);

                values.push(...conditionValues);
                query += " AND " + conditionQuery;
            }

            let notDict = advanced.NOT;
            if (notDict) {
                if (!Array.isArray(notDict)) {
                    notDict = [notDict];
                }

                for (let clause of notDict) {
                    if (clause.VALUE === null) {
                        query += ` AND ${clause.KEY} IS NOT NULL`;
                    } else if (clause.VALUE_COLUMN){
                        query += ` AND ${clause.KEY} != ${clause.VALUE_COLUMN}`;
                    } else if (Array.isArray(clause.VALUE)){
                        query += ` AND ${clause.KEY} NOT IN (${clause.VALUE.join()})`;
                    } else {
                        query += ` AND ${clause.KEY} != ?`;
                        values.push(clause.VALUE);
                    }
                }
            }

            let existsDict = advanced.EXISTS;
            if (existsDict) {
                if (!Array.isArray(existsDict)) {
                    existsDict = [existsDict]
                }

                for (let clause of existsDict) {
                    query += ` AND EXISTS (${clause})`
                }
            }

            let notExistsDict = advanced.NOT_EXISTS;
            if (notExistsDict) {
                if (!Array.isArray(notExistsDict)) {
                    notExistsDict = [notExistsDict]
                }

                for (let clause of notExistsDict) {
                    query += ` AND NOT EXISTS (${clause})`
                }
            }

            let like = advanced.LIKE;
            if (advanced.LIKE) {
                let likes = like;
                if (Object.prototype.toString.call(like) !== '[object Array]') {
                    likes = [like];
                }

                let likeClause = "";
                for (let pair of likes) {
                    if (likeClause.length > 0) {
                        likeClause += (pair.CONJUNCTION ? pair.CONJUNCTION + " " : "OR ")
                    }

                    likeClause += `${pair.KEY} LIKE ? `;
                    values.push(pair.VALUE);
                }

                query += ` AND (${likeClause})`
            }

            let groupBy = advanced.GROUP_BY;
            if (groupBy) {
                if (Array.isArray(groupBy)) {
                    groupBy = groupBy.join(", ");
                }

                query += " GROUP BY " + groupBy
            }

            let orderBy = advanced.ORDER_BY;
            if (orderBy) {
                if (Array.isArray(advanced.ORDER_BY)) {
                    orderBy = orderBy.join(", ");
                }

                query += " ORDER BY " + orderBy;
            } else if (advanced.DESC) {
                query += ` ORDER BY ${advanced.DESC} DESC`
            } else if (advanced.ASC) {
                query += ` ORDER BY ${advanced.ASC} ASC`
            }

            let having = advanced.HAVING;
            if (having) {
                if (!Array.isArray(having)) {
                    having = [having]
                }

                query += " HAVING " + having.join(" AND ")
            }

            if (advanced.LIMIT) {
                query += " LIMIT " + advanced.LIMIT;
            }

            if (advanced.OFFSET) {
                query += " OFFSET " + advanced.OFFSET;
            }

            pool.getConnection(function (err, conn) {
                if (err) {
                    return reject({...err, TABLE: name, QUERY: query});
                }

                if (advanced.DEBUG) {
                    console.log(query, values);
                }

                conn.query({sql: query, ...extraQueryParams}, values, function (err, rows) {
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

    return new Promise(async (resolve, reject) => {
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
