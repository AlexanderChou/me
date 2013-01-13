define(function(require, exports) {

  // Attribute
  // -----------------
  // Thanks to:
  //  - http://documentcloud.github.com/backbone/#Model
  //  - http://yuilibrary.com/yui/docs/api/classes/AttributeCore.html
  //  - https://github.com/berzniz/backbone.getters.setters


  // ���� attributes �ĳ�ʼ��
  // attributes ����ʵ����ص�״̬��Ϣ���ɶ���д�������仯ʱ�����Զ���������¼�
  exports.initAttrs = function(config, dataAttrsConfig) {

    // �ϲ����� data-attr ������
    if (dataAttrsConfig) {
      config = config ? merge(dataAttrsConfig, config) : dataAttrsConfig;
    }

    // Get all inherited attributes.
    var specialProps = this.propsInAttrs || [];
    var inheritedAttrs = getInheritedAttrs(this, specialProps);
    var attrs = merge({}, inheritedAttrs);
    var userValues;

    // Merge user-specific attributes from config.
    if (config) {
      userValues = normalize(config, true);
      merge(attrs, userValues);
    }

    // Automatically register `this._onChangeAttr` method as
    // a `change:attr` event handler.
    parseEventsFromInstance(this, attrs);

    // initAttrs ���ڳ�ʼ��ʱ���õģ�Ĭ�������ʵ���Ͽ϶�û�� attrs�������ڸ�������
    this.attrs = attrs;

    // ������ setter �����ԣ�Ҫ�ó�ʼֵ set һ�£��Ա�֤��������Ҳһͬ��ʼ��
    setSetterAttrs(this, attrs, userValues);

    // Convert `on/before/afterXxx` config to event handler.
    parseEventsFromAttrs(this, attrs);

    // �� this.attrs �ϵ� special properties �Ż� this ��
    copySpecialProps(specialProps, this, this.attrs, true);
  };


  // Get the value of an attribute.
  exports.get = function(key) {
    var attr = this.attrs[key] || {};
    var val = attr.value;
    return attr.getter ? attr.getter.call(this, val, key) : val;
  };


  // Set a hash of model attributes on the object, firing `"change"` unless
  // you choose to silence it.
  exports.set = function(key, val, options) {
    var attrs = {};

    // set("key", val, options)
    if (isString(key)) {
      attrs[key] = val;
    }
    // set({ "key": val, "key2": val2 }, options)
    else {
      attrs = key;
      options = val;
    }

    options || (options = {});
    var silent = options.silent;

    var now = this.attrs;
    var changed = this.__changedAttrs || (this.__changedAttrs = {});

    for (key in attrs) {
      if (!attrs.hasOwnProperty(key)) continue;

      var attr = now[key] || (now[key] = {});
      val = attrs[key];

      if (attr.readOnly) {
        throw new Error('This attribute is readOnly: ' + key);
      }

      // invoke setter
      if (attr.setter) {
        val = attr.setter.call(this, val, key);
      }

      // ��ȡ����ǰ�� prev ֵ
      var prev = this.get(key);

      // ��ȡ��Ҫ���õ� val ֵ
      // ��Ϊ����ʱ���� merge �������Ա��� prev ��û�и��ǵ�ֵ
      if (isPlainObject(prev) && isPlainObject(val)) {
        val = merge(merge({}, prev), val);
      }

      // set finally
      now[key].value = val;

      // invoke change event
      // ��ʼ��ʱ�� set �ĵ��ã��������κ��¼�
      if (!this.__initializingAttrs && !isEqual(prev, val)) {
        if (silent) {
          changed[key] = [val, prev];
        }
        else {
          this.trigger('change:' + key, val, prev, key);
        }
      }
    }

    return this;
  };


  // Call this method to manually fire a `"change"` event for triggering
  // a `"change:attribute"` event for each changed attribute.
  exports.change = function() {
    var changed = this.__changedAttrs;

    if (changed) {
      for (var key in changed) {
        if (changed.hasOwnProperty(key)) {
          var args = changed[key];
          this.trigger('change:' + key, args[0], args[1], key);
        }
      }
      delete this.__changedAttrs;
    }

    return this;
  };


  // Helpers
  // -------

  var toString = Object.prototype.toString;
  var hasOwn = Object.prototype.hasOwnProperty;

  var isArray = Array.isArray || function(val) {
    return toString.call(val) === '[object Array]';
  };

  function isString(val) {
    return toString.call(val) === '[object String]';
  }

  function isFunction(val) {
    return toString.call(val) === '[object Function]';
  }

  function isWindow(o) {
    return o != null && o == o.window;
  }

  function isPlainObject(o) {
    // Must be an Object.
    // Because of IE, we also have to check the presence of the constructor
    // property. Make sure that DOM nodes and window objects don't
    // pass through, as well
    if (!o || toString.call(o) !== "[object Object]" ||
        o.nodeType || isWindow(o)) {
      return false;
    }

    try {
      // Not own constructor property must be Object
      if (o.constructor &&
          !hasOwn.call(o, "constructor") &&
          !hasOwn.call(o.constructor.prototype, "isPrototypeOf")) {
        return false;
      }
    } catch (e) {
      // IE8,9 Will throw exceptions on certain host objects #9897
      return false;
    }

    // Own properties are enumerated firstly, so to speed up,
    // if last one is own, then all properties are own.
    for (var key in o) {}

    return key === undefined || hasOwn.call(o, key);
  }

  function isEmptyObject(o) {
    for (var p in o) {
      if (o.hasOwnProperty(p)) return false;
    }
    return true;
  }

  function merge(receiver, supplier) {
    var key, value;

    for (key in supplier) {
      if (supplier.hasOwnProperty(key)) {
        value = supplier[key];

        // ֻ clone ����� plain object�������ı��ֲ���
        if (isArray(value)) {
          value = value.slice();
        }
        else if (isPlainObject(value)) {
          var prev = receiver[key];
          isPlainObject(prev) || (prev = {});

          value = merge(prev, value);
        }

        receiver[key] = value;
      }
    }

    return receiver;
  }

  var keys = Object.keys;

  if (!keys) {
    keys = function(o) {
      var result = [];

      for (var name in o) {
        if (o.hasOwnProperty(name)) {
          result.push(name);
        }
      }
      return result;
    }
  }

  function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  }


  function getInheritedAttrs(instance, specialProps) {
    var inherited = [];
    var proto = instance.constructor.prototype;

    while (proto) {
      // ��Ҫ�õ� prototype �ϵ�
      if (!proto.hasOwnProperty('attrs')) {
        proto.attrs = {};
      }

      // �� proto �ϵ����� properties �ŵ� proto.attrs �ϣ��Ա�ϲ�
      copySpecialProps(specialProps, proto.attrs, proto);

      // Ϊ��ʱ�����
      if (!isEmptyObject(proto.attrs)) {
        inherited.unshift(proto.attrs);
      }

      // ���ϻ���һ��
      proto = proto.constructor.superclass;
    }

    // Merge and clone default values to instance.
    var result = {};
    for (var i = 0, len = inherited.length; i < len; i++) {
      result = merge(result, normalize(inherited[i]));
    }

    return result;
  }

  function copySpecialProps(specialProps, receiver, supplier, isAttr2Prop) {
    for (var i = 0, len = specialProps.length; i < len; i++) {
      var key = specialProps[i];

      if (supplier.hasOwnProperty(key)) {
        receiver[key] = isAttr2Prop ? receiver.get(key) : supplier[key];
      }
    }
  }


  var EVENT_PATTERN = /^(on|before|after)([A-Z].*)$/;
  var EVENT_NAME_PATTERN = /^(Change)?([A-Z])(.*)/;

  function parseEventsFromInstance(host, attrs) {
    for (var attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        var m = '_onChange' + ucfirst(attr);
        if (host[m]) {
          host.on('change:' + attr, host[m]);
        }
      }
    }
  }

  function parseEventsFromAttrs(host, attrs) {
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        var value = attrs[key].value, m;

        if (isFunction(value) && (m = key.match(EVENT_PATTERN))) {
          host[m[1]](getEventName(m[2]), value);
          delete attrs[key];
        }
      }
    }
  }

  // Converts `Show` to `show` and `ChangeTitle` to `change:title`
  function getEventName(name) {
    var m = name.match(EVENT_NAME_PATTERN);
    var ret = m[1] ? 'change:' : '';
    ret += m[2].toLowerCase() + m[3];
    return ret;
  }


  function setSetterAttrs(host, attrs, userValues) {
    var options = { silent: true };
    host.__initializingAttrs = true;

    for (var key in userValues) {
      if (userValues.hasOwnProperty(key)) {
        if (attrs[key].setter) {
          host.set(key, userValues[key].value, options);
        }
      }
    }

    delete host.__initializingAttrs;
  }


  var ATTR_SPECIAL_KEYS = ['value', 'getter', 'setter', 'readOnly'];

  // normalize `attrs` to
  //
  //   {
  //      value: 'xx',
  //      getter: fn,
  //      setter: fn,
  //      readOnly: boolean
  //   }
  //
  function normalize(attrs, isUserValue) {
    // clone it
    attrs = merge({}, attrs);

    for (var key in attrs) {
      var attr = attrs[key];

      if (isPlainObject(attr) &&
          !isUserValue &&
          hasOwnProperties(attr, ATTR_SPECIAL_KEYS)) {
        continue;
      }

      attrs[key] = {
        value: attr
      };
    }

    return attrs;
  }

  function hasOwnProperties(object, properties) {
    for (var i = 0, len = properties.length; i < len; i++) {
      if (object.hasOwnProperty(properties[i])) {
        return true;
      }
    }
    return false;
  }


  // ���� attrs �� value ��˵������ֵ����Ϊ�ǿ�ֵ�� null, undefined, '', [], {}
  function isEmptyAttrValue(o) {
    return o == null || // null, undefined
        (isString(o) || isArray(o)) && o.length === 0 || // '', []
        isPlainObject(o) && isEmptyObject(o); // {}
  }

  // �ж�����ֵ a �� b �Ƿ���ȣ�ע�������������ֵ���жϣ������ʵ� === �� == �жϡ�
  function isEqual(a, b) {
    if (a === b) return true;

    if (isEmptyAttrValue(a) && isEmptyAttrValue(b)) return true;

    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;

    switch (className) {

      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are
        // equivalent; thus, `"5"` is equivalent to `new String("5")`.
        return a == String(b);

      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `equal`
        // comparison is performed for other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);

      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values.
        // Dates are compared by their millisecond representations.
        // Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;

      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
            a.global == b.global &&
            a.multiline == b.multiline &&
            a.ignoreCase == b.ignoreCase;

      // ���ж���������� primitive ֵ�Ƿ����
      case '[object Array]':
        var aString = a.toString();
        var bString = b.toString();

        // ֻҪ������ primitive ֵ��Ϊ����������������� false
        return aString.indexOf('[object') === -1 &&
            bString.indexOf('[object') === -1 &&
            aString === bString;
    }

    if (typeof a != 'object' || typeof b != 'object') return false;

    // ���ж����������Ƿ���ȣ�ֻ�жϵ�һ��
    if (isPlainObject(a) && isPlainObject(b)) {

      // ��ֵ����ȣ����̷��� false
      if (!isEqual(keys(a), keys(b))) {
        return false;
      }

      // ����ͬ������ֵ���ȣ����̷��� false
      for (var p in a) {
        if (a[p] !== b[p]) return false;
      }

      return true;
    }

    // ����������� false, �Ա������е��� change �¼�û����
    return false;
  }

});