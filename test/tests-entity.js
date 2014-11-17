QUnit.test("Entity", function(assert) {
  var id = sakee.entity.create();
  assert.ok(id > 0, ".create()");

  var bool = sakee.entity.destroy(id);
  assert.ok(bool === true, ".destroy(entityId)");

  var bool = sakee.entity.exists(id);
  assert.ok(bool === false, ".exists(entityId)");

  var id2 = sakee.entity.create();
  var id3 = sakee.entity.create();
  assert.ok(id2 === id, "id recycled");

  sakee.entity.destroy(id);
  sakee.entity.destroy(id2);
});



