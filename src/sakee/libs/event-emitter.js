// based on https://github.com/joyent/node/blob/master/lib/events.js
var EventEmitter = (function() {

  function EventEmitter () {
    this._events = {};
  }

  var pt = EventEmitter.prototype;

  var _slice = Array.prototype.slice;

  pt.emit = function(type) {
    var handler;

    handler = this._events[type];

    if (handler == null) {
      return false;
    }

    var data = _slice.call(arguments, 1);

    if(typeof handler === 'function') {
      switch (data.length) {
        // fast cases
        case 0:
          handler.call(this);
          break;
        case 1:
          handler.call(this, data[0]);
          break;
        case 2:
          handler.call(this, data[0], data[1]);
          break;
        // slower
        default:
          handler.apply(this, data);
      }
    }
    else {
      var len = handler.length;
      var listeners = handler.slice();
      for (var i = 0; i < len; i++) {
        listeners[i].apply(this, data);
      }
    }

    return true;
  };

  pt.on = function(type, listener) {
    var handler = this._events[type];

    if(handler == null) {
      this._events[type] = listener;
    }
    else if (typeof handler === 'function') {
      this._events[type] = [handler, listener];
    }
    else {
      this._events[type].push(listener);
    }

    return this;
  };

  pt.once = function(type, listener) {
    var fired = false;

    function g() {
      this.off(type, g);

      if (!fired) {
        fired = true;
        listener.apply(null, arguments);
      }
    }

    this.on(type, g);

    return this;
  };

  pt.off = function(type, listener) {
    switch(arguments.length) {
      // remove all events types
      case 0:
        this._events = {}
        break;
      // remove specific event type
      case 1:
        this._events[type] = null;
        break;
      // remove specific listener
      case 2:
        var list = this._events[type];
        if (list == null) {
          return this;
        }
        else if (list === listener) {
          this._events[type] == null;
        }
        else {
          var len = list.length;
          for(var i = 0; i < len; i++) {
            if (list[i] === listener) {
              if (len === 1) {
                this._events[type] = null;
              }
              else {
                list.splice(i, 1);
              }
            }
          }
        }
    }
    return this;
  }

  EventEmitter.listenerCount = function(emitter, type) {
    var ret;
    if (!emitter._events || !emitter._events[type]) {
      ret = 0;
    }
    else if (typeof emitter._events[type] === 'function') {
      ret = 1;
    }
    else {
      ret = emitter._events[type].length;
    }
    return ret;
  };

  return EventEmitter;
})();
