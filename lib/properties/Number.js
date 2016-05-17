var name = "Number";

var Prop = require('../Prop');

function Number(data, data2){
    console.log("Getting Called");

    this.data = data;
}

//Number.prototype = Object.create(Prop.prototype);
Number.prototype.toString = function(){
    return this.data + " GHIUA";
};

Number.prototype.instance = function(number){
    console.log(number);
};

Number.prototype.toQueryFormat = function(){
    return name + "(" + this.data + ")";
};

module.exports = Number;