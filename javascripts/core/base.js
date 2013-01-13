define(function(require, exports, module) {

  // Base
  // ---------
  // Base ��һ�������࣬�ṩ Class��Events��Attrs �� Aspect ֧�֡�

  var Class = require('./class');
  var Events = require('./events');
  var Aspect = require('./aspect');
  var Attribute = require('./attribute');


  module.exports = Class.create({
    Implements: [Events, Aspect, Attribute],

    initialize: function(config) {
      this.initAttrs(config);
    },

    destroy: function() {
      this.off();

      for (var p in this) {
        if (this.hasOwnProperty(p)) {
          delete this[p];
        }
      }
    }
  });

});