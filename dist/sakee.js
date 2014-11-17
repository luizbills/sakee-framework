/*! sakee v0.1.0 <<%= pkg.url =>>
 *  Copyright 2014 Luiz "Bills" <luizpbills@gmail.com>
 *  Licensed under MIT License
 */
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

var EntityManager = (function() {

  function EntityManager(root) {
    this.root = root;
    this.lastEntityId = 0;
    this._aliveEntities = new StringMap();
    this._recycledIDs = [];
  }

  var pt = EntityManager.prototype;

  pt.create = function(components) {
    var entityId = this._recycledIDs.pop() || ++this.lastEntityId;
    this._aliveEntities.set(entityId, true);
    this.root.system.emit('create entity', entityId);
    if (components != null) {
      var len = components.length;
      for(var i = 0; i < len; i++) {
        this.root.component.get(components[i]).createData(entityId);
      }
    }
    return entityId;
  };

  pt.addComponent = function(entityId, componentName) {
    var component = this.root.component.get(componentName);
    return component.createData(entityId);
  };

  pt.getComponent = function(entityId, componentName) {
    var component = this.root.component.get(componentName);
    return component.getData(entityId);
  };

  pt.removeComponent = function(entityId, componentName) {
    var component = this.root.component.get(componentName);
    return component.removeData(entityId);
  };

  pt.hasComponent = function(entityId, componentName) {
    var component = this.root.component.get(componentName);
    return component.hasData(entityId);
  };


  pt.destroy = function(entityId) {
    if (this._aliveEntities.remove(entityId)) {
      this._recycledIDs.push(entityId);
      this.root.system.emit('destroy entity', entityId);
      return true;
    }
    return false;
  };

  pt.exists = function(entityId) {
    return this._aliveEntities.exists(entityId);
  };

  return EntityManager;
})();

var ComponentManager = (function() {

  // class ComponentManager
  function ComponentManager(root) {
    this.root = root;
    this._components = new StringMap();
  }

  var pt = ComponentManager.prototype;

  pt.set = function(name, dataModel) {
    var name = ("" + name).toLowerCase();

    if (this._components.exists(name)) {
      throw new Error('Component named \"' + name + "\" already exists.");
    }

    var comp = new Component(name, dataModel, this.root);
    this._components.set(name, comp);

    return comp;
  };

  pt.get = function(name) {
    var name = ("" + name).toLowerCase(),
      component = this._components.get(name);

    if (component == null) {
      throw new Error('Component named \"' + name + "\" don't exist.");
    }

    return this._components.get(name);
  };

  // class Component
  function Component(name, dataModel, root) {
    this.name = name;
    this.root = root;
    this._dataModel = dataModel;
    this._entitiesData = new StringMap();
  }

  pt = Component.prototype;

  pt.createData = function(entityId) {
    if (this.hasData(entityId)) {
      return this.getData(entityId);
    }

    var data = this._allocData();
    this._entitiesData.set(entityId, data);
    this.root.system.emit('add component', entityId, this.name);

    return data;
  };

  pt.getData = function(entityId) {
    if (!this.hasData(entityId)) {
      throw new Error('Entity(id=' + entityId + ') don\'t have component "' + this.name + '"');
    }
    return this._entitiesData.get(entityId);
  };

  pt.hasData = function(entityId) {
    return this._entitiesData.exists(entityId);
  };

  pt.removeData = function(entityId) {
    if (!this.hasData(entityId)) {
      return false;
    }

    this._entitiesData.remove(entityId);
    this.root.system.emit('remove component', entityId, this.name);

    return true;
  };

  pt._allocData = function() {
    var data;

    if (typeof this._dataModel === 'function') {
      data = new this._dataModel();
    } else {
      data = Object.create(this._dataModel);
    }

    return data;
  };

  return ComponentManager;
})();


var SystemManager = (function() {

  var _slice = Array.prototype.slice;

  function SystemManager(root) {
    this.root = root;
    this._systems = new StringMap();
    this._priorityList = {
      update: [],
      render: []
    }
  }

  var pt = SystemManager.prototype;

  pt.set = function(name, data) {
    name = ("" + name).toLowerCase();

    if (this._systems.exists(name)) {
      throw new Error('System named \"' + name + "\" already exists.");
    }

    var system = new System(name, data, this);
    this._systems.set(name, system);

    this._priorityList.update.push(name);
    if (system.data.priority.update > 0) {
      this._sortPriorityList('update');
    }

    this._priorityList.render.push(name);
    if (system.data.priority.render > 0) {
      this._sortPriorityList('render');
    }

    return system;
  };

  pt.get = function(name) {
    name = ("" + name).toLowerCase();

    if (!this._systems.exists(name)) {
      throw new Error('System named \"' + name + "\" don't exist.");
    }

    return this._systems.get(name);
  };

  pt.emit = function(type) {
    var list, i, len;

    if (type === 'update' || type === 'update system' || type === 'update entity') {
      list = this._priorityList.update;
    } else {
      list = this._priorityList.render;
    }

    len = list.length;
    for(i = 0; i < len; i++) {
      var system = this.get(list[i]);
      system.emit.apply(system, arguments);
    }
  };

  pt._sortPriorityList = function(type) {
    var list = this._priorityList[type],
      self = this;

    list.sort(function(a, b) {
      return self.get(b).data.priority[type] - self.get(a).data.priority[type];
    });
  }

  // class System
  var System = (function() {
    function System(name, data, manager) {
      EventEmitter.call(this);

      this.name = name;
      this.data = data;
      this.manager = manager;
      this._enabled = true;
      this._entities = [];
      this._config();
    }

    System.prototype = new EventEmitter;
    var pt = System.prototype;

    pt.emit = function(type) {
      if (this._enabled === false) {
        return false;
      }
      EventEmitter.prototype.emit.apply(this, arguments);
    }

    pt.enable = function() {
      this._enabled = true;
    }

    pt.disable = function() {
      this._enabled = false;
    }

    pt.toggle = function() {
      this._enabled = !this._enabled;
    }

    pt.isEnabled = function() {
      return this._enabled;
    };

    pt._config = function() {
      var priority = this.data.priority;

      if (typeof priority === 'number') {
        this.data.priority = {
          update: priority,
          render: priority
        };
        priority = this.data.priority;
      }

      if (typeof priority === 'object') {
        if (priority.update < 0 || typeof priority.update !== 'number') {
          priority.update = 0;
        }
        if (priority.render < 0 || typeof priority.render !== 'number') {
          priority.render = 0;
        }
      }
      else {
        this.data.priority = {
          update: 0,
          render: 0
        };
      }

      if (typeof this.data.filter !== 'object') {
        this.data.filter = false;
      }
      else {
        for (var compName in this.data.filter) {
          var compNameLowerCase = compName.toLowerCase();
          this.data.filter[compNameLowerCase] = !!this.data.filter[compName];
          if (compNameLowerCase !== compName) {
            delete this.data.filter[compName];
          }
        }
      }

      if (this.data.events != null) {
        for(var ev in this.data.events) {
          this.on(ev, this.data.events[ev]);
        }
        this.data.events = null;
      }

      this.on('create entity', this._filterEntity)
        .on('destroy entity', this._filterEntity)
        .on('add component', this._filterEntity)
        .on('remove component', this._filterEntity)
        .on('update', this._update)
        .on('render', this._render);
    };

    pt._filterEntity = function(entityId, component) {
      if (component != null) {
        if (this.data.filter && !(component in this.data.filter)) {
          return;
        }
      }
      this._verifyEntity(entityId, component);
    };

    pt._verifyEntity = function(entityId, component) {
      var passed;
      var index = this._entities.indexOf(entityId);

      if (!this.manager.root.entity.exists(entityId)) {
        passed = false;
      }
      else if (this.data.filter) {
        if (component != null) {
          var condition = this.data.filter[component];
          passed = (condition === this.manager.root.entity.hasComponent(entityId, component));
        }
        else {
          passed = true;
          for(component in this.data.filter) {
            var condition = this.data.filter[component];
            passed = (condition === this.manager.root.entity.hasComponent(entityId, component));

            if (passed == false) {
              break;
            }
          }
        }
      }

      if (passed === true && index === -1) {
        // add entity
        this._entities.push(entityId);
        this.emit('add entity', entityId);
      }
      else if (passed === false && index !== -1) {
        // remove entity
        this._entities.splice(index, 1);
        this.emit('remove entity', entityId);
      }
    };

    pt._update = function() {
      var i = 0,
        len = this._entities.length;

      this.emit('update system');

      for(; i < len; i++) {
        this.emit('update entity', this._entities[i]);
      }
    };

    pt._render = function() {
      var i = 0,
        len = this._entities.length;

      this.emit('render system');

      for(; i < len; i++) {
        this.emit('render entity', this._entities[i]);
      }
    };

    return System;
  })();



  return SystemManager;
})();

var sakee = {};
sakee.version = '0.1.0';

sakee.entity = new EntityManager(sakee);
sakee.component = new ComponentManager(sakee);
sakee.system = new SystemManager(sakee);
sakee.extension = new StringMap();

//native extensions
sakee.extension.set('string-map', StringMap);
sakee.extension.set('event-emitter', EventEmitter);

return sakee;


});
