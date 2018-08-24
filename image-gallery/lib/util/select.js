/**
 * Select first dom element matching selector.
 *
 * @param {String} selector
 * @param {DOMNode} [$el=document]
 * @return {DOMNode}
 */
module.exports = function select(selector, $el) {
  return ($el || document).querySelector(selector);
}