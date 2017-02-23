const EventSystem = {
  registry: {},

  publish: function(name, data) {
    this.registry[name].map(cb => cb(data));
  },

  subscribe: function(name, cb) {
    if (!(name in this.registry)) {
      this.registry[name] = [];
    }
    this.registry[name].push(cb);
  }
};

export default EventSystem;