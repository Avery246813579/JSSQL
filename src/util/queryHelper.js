function QueryHelper() {
}

QueryHelper.checkData = function (keys, properties) {
    properties = this.getKeys(properties);

    for (var i = 0; i < properties.length; i++) {
        if (keys.indexOf(properties[i]) == -1) {
            return true;
        }
    }

    return false;
};

QueryHelper.toValues = function (properties, callback) {
    var keys = "";
    var values = "";
    var valuesArray = [];

    if (Array.isArray(properties)) {
        // TODO Check all the keys are the same

        let bulkValues = [], bulkKeys = null, bulkPlaceholders = null;
        for (let item of properties) {
            QueryHelper.toValues(item, (_keys, _placeholders, values) => {
                bulkKeys = _keys;
                bulkPlaceholders = _placeholders;

                bulkValues.push(values);
            });
        }

        return callback(bulkKeys, bulkPlaceholders, bulkValues);
    }

    let propertyKeys = Object.keys(properties);
    propertyKeys.sort();

    for (let key of propertyKeys) {
        keys += ", " + key;
        values += ", ?";

        valuesArray.push(properties[key]);
    }

    callback(keys.substr(2), values.substr(2), valuesArray);
};

QueryHelper.getKeys = function (properties) {
    var toReturn = [];

    if (Object.prototype.toString.call(properties) === '[object Array]') {
        for (var i = 0; i < properties.length; i++) {
            var newItems = this.getKeys(properties[i]);
            for (var j = 0; j < newItems.length; j++) {
                toReturn.push(newItems[j]);
            }
        }
    } else {
        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                toReturn.push(key);
            } else {
                console.dir(properties);
            }
        }
    }

    return toReturn;
};

QueryHelper.toKeyValueComma = function (properties, callback) {
    var keys = "";
    var values = [];
    var instance = this;

    try {
        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                if (properties[key] == null) {
                    keys += " , " + key + " = NULL";
                } else {
                    keys += " , " + key + " = ?";
                    values.push(properties[key]);
                }
            } else {
                callback("Could not parse value", keys, values);
            }
        }

        callback(null, keys.substr(2), values);
    } catch (Exception) {
        throw Exception;
    }
};

QueryHelper.toKeyValue = function (properties, callback) {
    var keys = "";
    var values = [];
    var instance = this;

    if (Object.prototype.toString.call(properties) === '[object Array]') {
        properties.forEach(function (key) {
            instance.toKeyValue(key, function (err, keyz, valuez) {
                if (err) {
                    throw err;
                }

                keys += " OR (" + keyz + ")";

                for (var i = 0; i < valuez.length; i++) {
                    values.push(valuez[i]);
                }
            });
        });

        callback(null, keys.substr(4), values);
    } else {
        try {
            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    if (properties[key] == null) {
                        keys += " AND " + key + " IS NULL";
                    } else {
                        keys += " AND " + key + " = ?";
                        values.push(properties[key]);
                    }
                } else {
                    callback("Could not parse value", keys, values);
                }
            }

            callback(null, keys.substr(5), values);
        } catch (Exception) {
            throw Exception;
        }
    }
};


QueryHelper.toLikeKeyValue = function (properties, callback) {
    var keys = "";
    var values = [];
    var instance = this;

    if (Object.prototype.toString.call(properties) === '[object Array]') {
        properties.forEach(function (key) {
            instance.toLikeKeyValue(key, function (err, keyz, valuez) {
                if (err) {
                    throw err;
                }

                keys += " OR (" + keyz + ")";

                for (var i = 0; i < valuez.length; i++) {
                    values.push(valuez[i]);
                }
            });
        });

        callback(null, keys.substr(4), values);
    } else {
        try {
            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    if (properties[key] == null) {
                        keys += " AND " + key + " IS NULL";
                    } else {
                        keys += " AND " + key + " LIKE ?";
                        values.push(properties[key]);
                    }
                } else {
                    callback("Could not parse value", keys, values);
                }
            }

            callback(null, keys.substr(5), values);
        } catch (Exception) {
            throw Exception;
        }
    }
};


module.exports = QueryHelper;
