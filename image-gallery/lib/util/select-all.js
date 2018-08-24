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