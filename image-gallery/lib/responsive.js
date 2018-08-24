var on = require('./util/on'),
    off = require('./util/off');

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
