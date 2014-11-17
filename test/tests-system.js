QUnit.test("System", function(assert) {

  var VelocityComp = sakee.component.set('velocity', {
    x: 0,
    y: 0
  });

  var countUpdateSystem = 0;
  var countUpdateEntity = 0;

  var Moviment = sakee.system.set('Moviment', {
    filter: {
      velocity: true
    },

    priority: {
      update: 100
    },

    events: {
      'update system': function() {
        countUpdateSystem++;
      },

      'update entity': function(id) {
        countUpdateEntity++;
      }
    }
  });

  // test #1
  assert.ok(Moviment != null, '.set(name, data)');

  var testEntity = sakee.entity.create();
  sakee.system.emit('update');

  sakee.entity.addComponent(testEntity, 'velocity');
  sakee.system.emit('update');

  sakee.entity.removeComponent(testEntity, 'velocity');
  sakee.system.emit('update');

  Moviment.disable();
  sakee.system.emit('update');
  Moviment.enable();

  sakee.entity.addComponent(testEntity, 'velocity');
  sakee.entity.destroy(testEntity);
  sakee.system.emit('update');

  // test #2
  assert.equal(countUpdateEntity, 1, 'system filter working!');

  // test #3
  assert.equal(countUpdateSystem, 4, 'system update loop working!');
});
