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

