
import { value } from '@hyper/dom/observable'
import { getComputedStyle, bounding_rect } from '@hyper/dom-base'
import { get_prop_value, int_prop_value, sum_prop_values } from '@hyper/dom-base'

function positioned (node, target) {
  if (ANCIENT) error('not supported yet. add: https://github.com/juggle/resize-observer')
  var style = getComputedStyle(node)
  var sizing = get_prop_value(style, 'box-sizing') === 'border-box' || (ANCIENT && (
      get_prop_value(taStyle, '-moz-box-sizing') === 'border-box' ||
      get_prop_value(taStyle, '-webkit-box-sizing') === 'border-box'))

  node.w = value()
  node.h = value()
  node.x = value()
  node.y = value()

  var setter = (rect) => {
    node.w(rect.width)
    node.h(rect.height)
    node.x(rect.x)
    node.y(rect.y)
  }

  var entry, obv = new ResizeObserver(entries => {
    for (entry of entries) setter(entry.contentRect)
    // for (entry of entries) setter('border-box' ? entry.borderBoxSize : entry.contentBoxSize)
  }).observe(node, {box: sizing})

  setter(bounding_rect(node))
  return () => obv.disconnect()
}

export default positioned
