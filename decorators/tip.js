
import { h } from '@hyper/dom/hyper-hermes'
import { body, on, off, bounding_rect } from '@hyper/dom-base'
import { set_style } from '@hyper/dom/style'

function tip (node, text, offset = 5) {
  var el
  var onmouseleave = (event) => {
    if (el) ANCIENT
      ? el.style.display = 'none'
      : el.hidden = 1
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

    if (ANCIENT) el.style.display = 'block'
    else el.hidden = 0

    set_style(el, {
      top: offset + rect.top - r.top,
      left: Math.ceil(rect.right - (rect.width / 2)),
      marginLeft: -Math.ceil((el.clientWidth-4) / 2),
    })
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

  return RACTIVE ? { teardown } : teardown
}

export default tip
