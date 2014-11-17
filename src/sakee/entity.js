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
