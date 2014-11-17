var StringMap = (function() {

  function StringMap() {
    this._values = {};
  };

  var pt = StringMap.prototype;

  pt.get = function (key) {
    var value = this._values[key];
    return value != null ? value : null;
  };

  pt.set = function (key, value) {
    if (key instanceof Object) {
      for(var prop in key) {
        this._values[prop] = key[prop];
      }
    } else {
      this._values[key] = value;
    }
  };

  pt.exists = function (key) {
    return this._values[key] != null;
  };

  pt.remove = function (key) {
    if (this.exists(key)) {
      return delete this._values[key];
    }
    return false;
  };

  pt.keys = function () {
    var keys = [];
    for(var prop in this._values) {
      if (this.exists(prop)) {
        keys.push(prop);
      }
    }
    return keys;
  };

  pt.toString = function (formatted, ident) {
    if (formatted) {
      return JSON.stringify(this._values, null, ident || '\t');
    }
    return JSON.stringify(this._values);
  };

  return StringMap;
})();
