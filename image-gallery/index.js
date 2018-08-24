var ImageGallery = require('./lib/image-gallery');

module.exports = ImageGallery;

///// extensions

ImageGallery.LazyLoading = require('./lib/lazy-loading');
ImageGallery.Responsive = require('./lib/responsive');
