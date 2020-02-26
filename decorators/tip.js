
import h from '@hyper/dom/hyper-hermes'
import { body, on, off, bounding_rect } from '@hyper/dom/dom-base'

function tip (node, text, offset = 5) {
  var el
  var onmouseleave = (event) => {
    if (el) el.style.display = 'none'
  }

  var onmouseenter = () => {
    let r = bounding_rect(body)
    let rect = bounding_rect(node)
    if (!el) {
      body.aC(el =
        h('div', {c: 'tooltip-outer', onmouseleave, s: {position: 'absolute'}},
          h('div', {c: 'tooltip-arrow'}),
          h('div', {c: 'tooltip-inner'}, text)
        )
      )
    }
    el.style.display = 'block'
    el.style.top = offset + rect.top - r.top + 'px'
    el.style.left = Math.ceil(rect.right - (rect.width / 2)) + 'px'
    el.style.marginLeft = -Math.ceil((el.clientWidth-4) / 2) + 'px'
  }

  var teardown = () => {
    off(node, 'mouseenter', onmouseenter)
    off(node, 'mouseleave', onmouseleave)
    if (el) {
      if (ANCIENT) body.removeChild(el)
      else  el.rm()
    }
  }

  on(node, 'mouseenter', onmouseenter)
  on(node, 'mouseleave', onmouseleave)

  return RACTIVE { teardown } : teardown
}

export default tip
