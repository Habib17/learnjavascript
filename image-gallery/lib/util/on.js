module.exports = function on(element, event, fn) {
  element.addEventListener(event, fn, false);
};