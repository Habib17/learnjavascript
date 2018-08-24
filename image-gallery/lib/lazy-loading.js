var on = require('./util/on'),
    off = require('./util/off'),
    attr = require('./util/attr');

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