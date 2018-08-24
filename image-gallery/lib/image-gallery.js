var EventEmitter = require('events');

var inherits = require('inherits');

var xtend = require('xtend');

var layout = require('image-layout/layouts/fixed-partition');


var DEFAULT_OPTIONS = {
  selectors: {
    image: 'img'
  },
  use: []
};

var selectAll = require('./util/select-all'),
    attr = require('./util/attr');


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