(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD/RequireJS
    define(factory);
  }
  else if (typeof exports === "object") {
    // CommonJS/NodeJS
    module.exports = factory();
  }
  else {
    // Browser globals
    root.sakee = factory();
  }
})(this, function() {
'use strict';
