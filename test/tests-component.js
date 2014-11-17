QUnit.test("Component", function(assert) {
  var entId = sakee.entity.create();

  var comp1 = sakee.component.set('Comp1', {
    x: 2,
    y: 0
  });

  var comp2 = sakee.component.set('Comp2', function() {
    var comp = {
      k: 5
    };
    return comp;
  });

  assert.ok('createData' in comp1, ".set(name, data)");

  sakee.entity.addComponent(entId, comp1.name);
  assert.ok(comp1.hasData(entId), "instance.setData(entityId)");

  sakee.entity.removeComponent(entId, comp1.name);
  assert.ok(!comp1.hasData(entId), "instance.hasData(entityId)");
  assert.ok(!comp1.hasData(entId), "instance.removeData(entityId)");

  sakee.entity.addComponent(entId, comp1.name);
  sakee.entity.addComponent(entId, comp2.name);

  assert.ok(comp1.getData(entId).x == 2 && comp2.getData(entId).k == 5, "instance.getData(entityId)");
});
