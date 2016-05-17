var Column = require('./column');

function Scheme(properties){
    this.columns = [];
    this.keys = [];

    for(var key in properties){
        if (properties.hasOwnProperty(key)) {
            try{
                this.columns.push(new Column(key, properties[key]));
            }catch(err){
                throw err;
            }

            this.keys.push(key);
        }
    }
}

Scheme.prototype.toString = function(){
    var toReturn = "Columns: ";

    this.columns.forEach(function(key){
        toReturn += key.toString();
    });

    return toReturn;
};

Scheme.prototype.getColumns = function(){
    return this.columns;
};

Scheme.prototype.getKeys = function(){
    return this.keys;
};

module.exports = exports = Scheme;