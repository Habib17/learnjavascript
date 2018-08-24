module.exports = function off(element, event, fn) {
  element.removeEventListener(event, fn, false);
};