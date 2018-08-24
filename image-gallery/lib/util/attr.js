module.exports = function attr(element, name, value) {

  if (typeof value === 'undefined') {
    return element.getAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
};