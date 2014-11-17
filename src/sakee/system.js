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
