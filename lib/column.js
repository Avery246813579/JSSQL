function Column(name, properties){
    this.name = name;

    for(var key in properties){
        if(properties.hasOwnProperty(key)){
            switch(key.toLowerCase()){
                default:
                    throw new Error("Column has unknown field!");
                    break;
                case "type":
                    this.type = properties[key];
                    break;
                case "length":
                    this.length = properties[key];
                    break;
                case "index":
                    this.index = properties[key];
                    break;
                case "foreign":
                    if(typeof properties[key]['key'] != 'undefined' && typeof properties[key]['table'] != 'undefined'){
                        this.foreign = {
                            "key": properties[key]['key'],
                            "table": properties[key]['table']
                        };
                    }else{
                        throw Error("Error parsing Foreign Key! Check the docs!");
                    }

                    break;
                case "ai":
                    if(properties[key] == true){
                        this.ai = true;
                    }else if(properties[key] != false){
                        throw new Error("Auto Incrementing Fields can only be true or false");
                    }

                    break;
                case "null":
                    if(properties[key] == false){
                        this.null = false;
                    }else if(properties[key] != true){
                        throw new Error("Null Fields can only be true or false");
                    }

                    break;
            }
        }
    }

    if(typeof this.type == 'undefined'){
        throw new Error("Column needs a data type");
    }
}

Column.prototype.toString = function(){
    var toReturn = this.name + " " + this.type;

    if(typeof this.length != 'undefined'){
        toReturn += "(" + this.length + ")";
    }

    if(typeof this.null != 'undefined'){
        toReturn += " NOT NULL";
    }

    if(typeof this.ai != 'undefined'){
        toReturn +=  " AUTO_INCREMENT";
    }

    return toReturn;
};

Column.prototype.hasIndex = function(){
    return typeof this.index != 'undefined';
};

Column.prototype.hasForeign = function(){
  return typeof this.foreign != 'undefined';
};

Column.prototype.getIndex = function(){
    return this.index;
};

Column.prototype.getForeign = function(){
    return this.foreign;
};

Column.prototype.getName = function(){
    return this.name;
};

module.exports = Column;