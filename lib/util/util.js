var prototype = module.exports;

prototype.getElementInDictionary = function (dictionary, element) {
    for (var key in dictionary) {
        if (dictionary.hasOwnProperty(key)) {
            if (key.toLowerCase() == element.toLowerCase()) {
                return dictionary[key];
            }
        }
    }
};