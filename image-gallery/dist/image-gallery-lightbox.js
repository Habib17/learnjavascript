/* global ImageGallery, $ */

/**
 * A light-box extension for image gallery.
 *
 * Requires JQuery + SimpleLightbox (https://github.com/dbrekalo/simpleLightbox).
 */
ImageGallery.Lightbox = function(imageGallery, options) {

  var SimpleLightbox = $.SimpleLightbox;

  var imagesSelector = options.selectors.images;

  imageGallery.on('gallery:create', function(gallery) {

    $(gallery.element).on('click', imagesSelector, function(event) {

      var el = event.target;

      var startIdx = 0;

      var urls = gallery.images.map(function(img, idx) {
        if (img === el) {
          startIdx = idx;
        }

        return $(img).attr('data-full-src') || img.src;
      });

      SimpleLightbox.open({
        items: urls,
        startAt: startIdx
      });
    });

  });

};