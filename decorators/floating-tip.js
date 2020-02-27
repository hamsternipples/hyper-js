import { h, set_style } from '@hyper/dom/hyper-hermes'
import { doc, body, doc_el, on, off, IS_IE } from '@hyper/dom/dom-base'

// @Cleanup: this code is pretty nasty. I think decorators/tip is a bit better.
// someday, revisit this and update it if necessary, otherwise delete it.

// also, I'm not sure where the styles for this are, either

function floatingTip (node, text, width) {
  if (text == null) return { teardown () {} }
  var top = 3
  var left = 3
  var maxw = 300
  var speed = 10
  var timer = 20
  var endalpha = 95
  var alpha = 0
  var T,t,c,b,height,hidden

  var onmousemove = function (e) {
    if (hidden) return
    var u = ANCIENT && IS_IE ? event.clientY + doc_el.scrollTop : e.pageY
    var l = ANCIENT && IS_IE ? event.clientX + doc_el.scrollLeft : e.pageX
    set_style(T, {
      top: u - height
      left: l + left
    })
  }

  var show = function (v, w) {
    hidden = false
    if (!T) {
      body.appendChild(
        T = h('div', {id: 'T', style: {opacity: 0, filter: 'alpha(opacity=0)'}},
          // t = h('div', {id: 'Ttop'}),
          c = h('div', {id: 'Tcont'})
          // b = h('div', {id: 'Tbot'})
        )
      )

      // TODO: use global addEventListener a la `rolex`
      on(doc, 'mousemove', onmousemove)
    }
    T.style.display = 'block'
    c.innerHTML = typeof text === 'function' ? text() : text
    T.style.width = width ? width + 'px' : 'auto'
    if (ANCIENT && IS_IE && !width) {
      // t.style.display = 'none'
      // b.style.display = 'none'
      T.style.width = T.offsetWidth // + 'px'
      // t.style.display = 'block'
      // b.style.display = 'block'
    }
    if (T.offsetWidth > maxw) T.style.width = maxw + 'px'
    height = ~~T.offsetHeight + top
    clearInterval(T.timer)
    T.timer = setInterval(function () { fade(1) }, timer)
  }

  var fade = function (d) {
    var a = alpha
    if ((a != endalpha && d == 1) || (a != 0 && d === -1)) {
      var i = speed
      if (endalpha - a < speed && d === 1) {
        i = endalpha - a
      } else if (alpha < speed && d === -1) {
        i = a
      }
      alpha = a + (i * d)
      T.style.opacity = alpha * .01
      T.style.filter = 'alpha(opacity=' + alpha + ')'
    } else {
      clearInterval(T.timer)
      if (hidden = d === -1) T.style.display = 'none'
    }
  }

  var hide = function () {
    clearInterval(T.timer)
    T.timer = setInterval(function () { fade(-1) }, timer)
  }

  on(node, 'mouseenter', function onmouseenter () { show() })
  on(node, 'mouseleave', function onmouseleave () { hide() })

  return {
    teardown() {
      off(node, 'mouseenter', onmouseenter)
      off(node, 'mouseleave', onmouseleave)
      if (T) {
        clearInterval(T.timer)
        off(doc, 'mousemove', onmousemove)
        doc.body.removeChild(T)
      }
    }
  }
}

export default floatingTip
