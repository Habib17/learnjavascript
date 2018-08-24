(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ImageGallery = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var ImageGallery = _dereq_(2);

module.exports = ImageGallery;

///// extensions

ImageGallery.LazyLoading = _dereq_(3);
ImageGallery.Responsive = _dereq_(4);

},{"2":2,"3":3,"4":4}],2:[function(_dereq_,module,exports){
var EventEmitter = _dereq_(9);

var inherits = _dereq_(11);

var xtend = _dereq_(12);

var layout = _dereq_(10);


var DEFAULT_OPTIONS = {
  selectors: {
    image: 'img'
  },
  use: []
};

var selectAll = _dereq_(8),
    attr = _dereq_(5);


/**
 * Create a new image gallery on a given DOM element.
 *
 * @param {String|DOMElement} $el
 * @param {Object} options
 */
function ImageGallery(selector, options) {

  if (!(this instanceof ImageGallery)) {
    return new ImageGallery(selector, options);
  }

  EventEmitter.call(this);

  this.setMaxListeners(0);

  var nodes;

  var self = this;

  // selector argument
  if (typeof selector === 'string') {
    nodes = selectAll(selector);
  } else

  // dom node argument
  if (!selector.length) {
    nodes = [ selector ];
  }

  // node list argument
  else {
    nodes = selector;
  }

  // TODO(nikku): unwrap jQuery

  options = xtend({}, DEFAULT_OPTIONS, options);

  // initialize extensions

  options.use.forEach(function(ext) {
    if (!ext) {
      throw undefinedExtension();
    }

    ext(self, options);
  });

  // create galleries
  var imageSelector = options.selectors.image;

  this.galleries = nodes.map(function(node) {
    return self.createGallery(node, imageSelector);
  });

  this.emit('init');
}

inherits(ImageGallery, EventEmitter);

module.exports = ImageGallery;

/**
 * Layout the gallery after its meta-data has been loaded.
 *
 * @param {Gallery} gallery
 */
ImageGallery.prototype.layout = function(gallery) {

  var containerWidth = gallery.width = gallery.element.offsetWidth;

  var result = layout(gallery.layoutData, {
    align: 'center',
    containerWidth: containerWidth,
    idealElementHeight: gallery.imageHeight,
    spacing: gallery.imageSpacing
  });

  this.emit('gallery:layout', gallery, result);

  result.positions.forEach(function(position, idx) {
    var img = gallery.images[idx];

    img.style.width = position.width + 'px';
    img.style.height = position.height + 'px';
  });
};

ImageGallery.prototype.destroy = function() {
  this.emit('destroy');
};

/**
 * Create gallery on a given element for the
 * specified images.
 *
 * @param {DOMNode} $el
 * @param {String} imageSelector
 * @return {Gallery}
 */
ImageGallery.prototype.createGallery = function($el, imageSelector) {

  var self = this;

  var images = selectAll(imageSelector, $el);

  var imageHeight = attr($el, 'data-image-height');

  // inherit optimal height from container
  if (imageHeight === 'inherit') {
    imageHeight = $el.offsetHeight;
  } else {
    imageHeight = parseInt(imageHeight, 10) || 300;
  }

  var imageSpacing = parseInt(attr($el, 'data-image-spacing'), 10) || 0;

  var gallery = {
    element: $el,
    images: images,
    imageHeight: imageHeight,
    imageSpacing: imageSpacing,
    layoutData: [],
    loading: images.length
  };

  self.emit('gallery:create', gallery);

  // parse dimensions asynchronously

  images.forEach(function(img, idx) {

    var dimensions = getDimensions(img);

    if (dimensions) {
      return self.setImageDimensions(gallery, idx, dimensions);
    }

    img.onload = function(e) {
      // we loaded and are able to access the dimensions
      // no need to trigger us again
      delete img.onload;

      self.setImageDimensions(gallery, idx, getDimensions(img));
    };

  });

  return gallery;
};

ImageGallery.prototype.setImageDimensions = function(gallery, idx, dimensions) {

  var self = this;

  gallery.loading--;
  gallery.layoutData[idx] = dimensions;

  if (gallery.loading <= 0) {
    self.layout(gallery);
  }
};


/////// utilities /////////////////////////////////////


/**
 * Parse image dimensions from data attribute.
 *
 * @param {DOMImage} img
 *
 * @return {Dimensions}
 */
function getDimensions(img) {

  if (img.complete) {
    return {
      width: img.width,
      height: img.height
    };
  }

  var dimensionsStr = attr(img, 'data-dimensions');

  if (!dimensionsStr) {
    return null;
  }

  var dimensions = dimensionsStr.split(',').map(function(str) {
    return parseInt(str, 10);
  });

  return {
    width: dimensions[0],
    height: dimensions[1]
  };
}


function undefinedExtension() {
  return new Error('undefined extension, check options.use');
}
},{"10":10,"11":11,"12":12,"5":5,"8":8,"9":9}],3:[function(_dereq_,module,exports){
var on = _dereq_(7),
    off = _dereq_(6),
    attr = _dereq_(5);

/**
 * An image gallery preloader.
 *
 * @param {ImageGallery} imageGallery
 * @param {Object} options
 */
module.exports = function(imageGallery, options) {

  function loadImage(el, source) {
    var img = new Image();

    img.onload = function() {

      /**
       * Emitting event with (img, newSource, oldSource)
       */
      imageGallery.emit('image:preloaded', el, source, el.src);

      el.src = source;
    };

    img.src = source;
  }

  function preloadGallery(gallery) {
    gallery.preload = true;

    gallery.images.forEach(function(img) {
      var src = attr(img, 'data-full-src');

      if (src) {
        loadImage(img, src);
      }
    });
  }

  function processScroll() {
    imageGallery.galleries.forEach(function(gallery) {
      if (gallery.preload !== true && elementInViewport(gallery.element)) {
        preloadGallery(gallery);
      }
    });
  }

  function elementInViewport(el) {
    var rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.top <= (window.innerHeight || document.documentElement.clientHeight)
    );
  }


  on(window, 'touchmove', processScroll);
  on(window, 'scroll', processScroll);

  imageGallery.on('init', processScroll);

  imageGallery.on('destroy', function() {
    off(window, 'touchmove', processScroll);
    off(window, 'scroll', processScroll);
  });
};
},{"5":5,"6":6,"7":7}],4:[function(_dereq_,module,exports){
var on = _dereq_(7),
    off = _dereq_(6);

/**
 * Making the image gallery react to window resize.
 *
 * @param {ImageGallery} imageGallery
 * @param  {Object} options
 */
module.exports = function(imageGallery, options) {

  var resizeListener = function(event) {

    imageGallery.galleries.forEach(function(gallery) {

      var width = gallery.element.offsetWidth;

      // width change, trigger relayout
      if (width !== gallery.width) {
        imageGallery.layout(gallery);
      }
    });
  };

  on(window, 'resize', resizeListener);

  imageGallery.on('destroy', function() {
    off(window, 'resize', resizeListener);
  });
};

},{"6":6,"7":7}],5:[function(_dereq_,module,exports){
module.exports = function attr(element, name, value) {

  if (typeof value === 'undefined') {
    return element.getAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
};
},{}],6:[function(_dereq_,module,exports){
module.exports = function off(element, event, fn) {
  element.removeEventListener(event, fn, false);
};
},{}],7:[function(_dereq_,module,exports){
module.exports = function on(element, event, fn) {
  element.addEventListener(event, fn, false);
};
},{}],8:[function(_dereq_,module,exports){
function slice(arrayLike) {
  return Array.prototype.slice.call(arrayLike);
}

/**
 * Select dom elements matching selector.
 *
 * @param {String} selector
 * @param {DOMNode} [$el=document]
 * @return {Array<DOMNode>}
 */
module.exports = function selectAll(selector, $el) {
  return slice(($el || document).querySelectorAll(selector));
};
},{}],9:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],10:[function(_dereq_,module,exports){
/**
 * Algorithm: fixed-partition
 *
 * The algorithm outlined by Johannes Treitz in "The algorithm
 * for a perfectly balanced photo gallery" (see url below).
 *
 * Options:
 *   - containerWidth      Width of the parent container (in pixels)
 *   - idealElementHeight  Ideal element height (in pixels)
 *   - spacing             Spacing between items (in pixels)
 *
 * @throws
 * @see https://www.crispymtn.com/stories/the-algorithm-for-a-perfectly-balanced-photo-gallery
 * @param {object[]} elements
 * @param {object} options
 * @return {object}
 */
module.exports = function(elements, options) {
	var i, n, positions = [], elementCount;

	var spacing = options.spacing || 0;
	var containerWidth = options.containerWidth;
	var idealHeight = options.idealElementHeight || (containerWidth / 3);
	if (!containerWidth) throw new Error('Invalid container width');

	// calculate aspect ratio of all photos
	var aspect;
	var aspects = [];
	var aspects100 = [];
	for (i = 0, n = elements.length; i < n; i++) {
		aspect = elements[i].width / elements[i].height;
		aspects.push(aspect);
		aspects100.push(Math.round(aspect * 100));
	}

	// calculate total width of all photos
	var summedWidth = 0;
	for (i = 0, n = aspects.length; i < n; i++) {
		summedWidth += aspects[i] * idealHeight;
	}

	// calculate rows needed
	var rowsNeeded = Math.round(summedWidth / containerWidth)

	// adjust photo sizes
	if (rowsNeeded < 1) {
		// (2a) Fallback to just standard size
		var xSum = 0, width;
		elementCount = elements.length;

		var padLeft = 0;
		if (options.align === 'center') {
			var spaceNeeded = (elementCount-1)*spacing;
			for (var i = 0; i < elementCount; i++) {
				spaceNeeded += Math.round(idealHeight * aspects[i]) - (spacing * (elementCount - 1) / elementCount);
			}
			padLeft = Math.floor((containerWidth - spaceNeeded) / 2);
		}

		for (var i = 0; i < elementCount; i++) {
			width = Math.round(idealHeight * aspects[i]) - (spacing * (elementCount - 1) / elementCount);
			positions.push({
				y: 0,
				x: padLeft + xSum,
				width: width,
				height: idealHeight
			});
			xSum += width;
			if (i !== n - 1) {
				xSum += spacing;
			}
		}
		ySum = idealHeight;
	} else {
		// (2b) Distribute photos over rows using the aspect ratio as weight
		var partitions = linear_partition(aspects100, rowsNeeded);
		var index = 0;
		var ySum = 0, xSum;
		for (i = 0, n = partitions.length; i < n; i++) {
			var element_index = index;
			var summedRatios = 0;
			for (j = 0, k = partitions[i].length; j < k; j++) {
				summedRatios += aspects[element_index + j];
				index++;
			}

			xSum = 0;
			height = Math.round(containerWidth / summedRatios);
			elementCount = partitions[i].length;
			for (j = 0; j < elementCount; j++) {
				width = Math.round((containerWidth - (elementCount - 1) * spacing) / summedRatios * aspects[element_index + j]);
				positions.push({
					y: ySum,
					x: xSum,
					width: width,
					height: height
				});
				xSum += width;
				if (j !== elementCount - 1) {
					xSum += spacing;
				}
			}
			ySum += height;
			if (i !== n - 1) {
				ySum += spacing;
			}
		}
	}

	return {
		width: containerWidth,
		height: ySum,
		positions: positions
	};
};

/**
 * Partitions elements into rows.
 *
 * @author Johannes Treitz <https://twitter.com/jtreitz>
 * @see https://www.crispymtn.com/stories/the-algorithm-for-a-perfectly-balanced-photo-gallery
 * @param {int[]} seq
 * @param {int} k
 * @return {int[][]}
 */
var linear_partition = function(seq, k) {
	var ans, i, j, m, n, solution, table, x, y, _i, _j, _k, _l;
	var _m, _nn;

	n = seq.length;
	if (k <= 0) {
		return [];
	}
	if (k > n) {
		return seq.map(function(x) {
			return [x];
		});
	}
	table = (function() {
		var _i, _results;
		_results = [];
		for (y = _i = 0; 0 <= n ? _i < n : _i > n; y = 0 <= n ? ++_i : --_i) {
			_results.push((function() {
				var _j, _results1;
				_results1 = [];
				for (x = _j = 0; 0 <= k ? _j < k : _j > k; x = 0 <= k ? ++_j : --_j) {
					_results1.push(0);
				}
				return _results1;
			})());
		}
		return _results;
	})();
	solution = (function() {
		var _i, _ref, _results;
		_results = [];
		for (y = _i = 0, _ref = n - 1; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
			_results.push((function() {
				var _j, _ref1, _results1;
				_results1 = [];
				for (x = _j = 0, _ref1 = k - 1; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
					_results1.push(0);
				}
				return _results1;
			})());
		}
		return _results;
	})();
	for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
		table[i][0] = seq[i] + (i ? table[i - 1][0] : 0);
	}
	for (j = _j = 0; 0 <= k ? _j < k : _j > k; j = 0 <= k ? ++_j : --_j) {
		table[0][j] = seq[0];
	}
	for (i = _k = 1; 1 <= n ? _k < n : _k > n; i = 1 <= n ? ++_k : --_k) {
		for (j = _l = 1; 1 <= k ? _l < k : _l > k; j = 1 <= k ? ++_l : --_l) {

			m = [];
			for (x = _m = 0; 0 <= i ? _m < i : _m > i; x = 0 <= i ? ++_m : --_m) {
				m.push([Math.max(table[x][j - 1], table[i][0] - table[x][0]), x]);
			}

			var minValue, minIndex = false;
			for (_m = 0, _nn = m.length; _m < _nn; _m++) {
				if (_m === 0 || m[_m][0] < minValue) {
					minValue = m[_m][0];
					minIndex = _m;
				}
			}

			m = m[minIndex];
			table[i][j] = m[0];
			solution[i - 1][j - 1] = m[1];
		}
	}
	n = n - 1;
	k = k - 2;
	ans = [];
	while (k >= 0) {
		ans = [
			(function() {
				var _m, _ref, _ref1, _results;
				_results = [];
				for (i = _m = _ref = solution[n - 1][k] + 1, _ref1 = n + 1; _ref <= _ref1 ? _m < _ref1 : _m > _ref1; i = _ref <= _ref1 ? ++_m : --_m) {
					_results.push(seq[i]);
				}
				return _results;
			})()
		].concat(ans);
		n = solution[n - 1][k];
		k = k - 1;
	}
	return [
		(function() {
			var _m, _ref, _results;
			_results = [];
			for (i = _m = 0, _ref = n + 1; 0 <= _ref ? _m < _ref : _m > _ref; i = 0 <= _ref ? ++_m : --_m) {
				_results.push(seq[i]);
			}
			return _results;
		})()
	].concat(ans);
};

},{}],11:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],12:[function(_dereq_,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[1])(1)
});