function Table(name, scheme){
    this.name = name;
    this.scheme = scheme;
}

Table.prototype.assignDatabase = function(database){
    this.database = database;
};

Table.prototype.init = function(){
    var pool = this.database.pool;
    var query = this.toCreate();
    var instance = this;

    if(typeof pool == 'undefined'){
        setTimeout(function(){
            instance.init();
        }, 100);

        return;
    }

    pool.getConnection(function(err, conn){
       if(err){
           throw err;
       }

       conn.query(query, function(err){
           if(err){
               throw err;
           }
       });

        conn.release();
    });
};

Table.prototype.findOne = function(properties, callback){

};

Table.prototype.find = function(properties, callback){
    if(this.database == null){
        callback(Error("Table not assigned a database!"));
    }

    var keys = this.scheme.getKeys();
    var findKeys = "";
    var values = [];
    for(var key in properties){
        if(properties.hasOwnProperty(key)){
            if(keys.indexOf(key) == -1){
                callback(Error("Properties don't match table scheme!"));
            }

            findKeys += ", " + key + " = ?";
            values.push(properties[key]);
        }
    }

    var pool = this.database.pool;
    var instance = this;
    if(typeof pool == 'undefined'){
        setTimeout(function(){
            instance.database.loadPool();

            if(typeof instance.database.pool == 'undefined'){
                throw "Could not find a connection";
            }else{
                instance.find(properties, callback);
            }
        }, 100);

        return;
    }

    var name = this.name;

    pool.getConnection(function(err, conn){
        if(err){
            callback(err);
        }

        conn.query("SELECT * FROM " + name + " WHERE " + findKeys.substr(2), values, function(err, rows){
            if(err){
                conn.release();

                callback(err);
            }else {
                callback(err, rows);

                conn.release();
            }
        });
    })
};

Table.prototype.save = function(properties, callback){
    if(this.database == null){
        callback(Error("Table not assigned a database!"));
    }

    var keys = this.scheme.getKeys();
    var insertionKeys = "";
    var insertionValues = "";
    var values = [];
    for(var key in properties){
        if(properties.hasOwnProperty(key)){
            if(keys.indexOf(key) == -1){
                callback(Error("Properties don't match table scheme!"));
            }

            insertionKeys += ", " + key;
            insertionValues += ", ?";
            values.push(properties[key]);
        }
    }

    var pool = this.database.pool;
    var instance = this;
    if(typeof pool == 'undefined'){
        setTimeout(function(){
            instance.database.loadPool();

            if(typeof instance.database.pool == 'undefined'){
                throw "Could not find a connection";
            }else{
                instance.save(properties, callback);
            }
        }, 100);

        return;
    }

    var name = this.name;
    pool.getConnection(function(err, conn){
        if(err){
            callback(err);
        }

        conn.query("INSERT INTO " + name + " (" + insertionKeys.substr(2) + ") VALUES (" + insertionValues.substr(2) + ")", values, function(err){
            if(err){
                conn.release();

                callback(err);
            }else {
                conn.release();
            }
        });
    })

};

Table.prototype.toString = function(){

};

Table.prototype.toCreate = function(){
    var toReturn = "CREATE TABLE IF NOT EXISTS " + this.name + " (";
    var body = "";
    var suffix = "";

    this.scheme.getColumns().forEach(function(key){
        body += ", " + key.toString();

        if(key.hasIndex()){
            suffix += ", " + key.getIndex() + " (" + key.getName() + ")";
        }
    });

    return toReturn + body.substr(2) + suffix + ")";
};


module.exports = Table;

