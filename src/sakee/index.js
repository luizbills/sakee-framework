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
