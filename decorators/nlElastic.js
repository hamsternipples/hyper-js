
import { each, assign, float, next_tick } from '@hyper/utils'
import { win, body, getComputedStyle, set_style } from '@hyper/dom-base'
import { on, off } from '@hyper/dom-base'
import { get_prop_value, int_prop_value, sum_prop_values } from '@hyper/dom-base'
import { value } from '@hyper/dom/observable'

import raf from '@hyper/dom/request-animation-frame'

import h from '@hyper/dom/hyper-hermes'

function nlElastic (node) {
  var ta = node
  var $ta = node

  // modern platforms should error
  // if (DEBUG && $ta.elastic) error('this is already an elastic textarea')

  // modern platforms will error
  if (DEBUG && ta.nodeName !== 'TEXTAREA') error('node is not a textarea')
  if (DEBUG && (ANCIENT && !getComputedStyle)) error('getComputedStyle not supported on this platform')

  // set these properties before measuring dimensions
  // assign($ta.style, {
  //   overflow: 'hidden',
  //   overflowY: 'hidden',
  //   wordWrap: 'break-word',
  // })

  // var elastic = $ta.elastic = {w: value(), h: value()}

  var ta_height = value()
  var ta_overflowY = value()

  set_style($ta, {
    overflow: 'hidden',
    overflowY: ta_overflowY,
    wordWrap: 'break-word',
    height: ta_height,
  })

  if (ANCIENT) {
    // force text reflow
    var text = ta.value
    ta.value = ''
    ta.value = text
  }

  var mirrorInitStyle =
    'position:absolute;top:-999px;right:auto;bottom:auto;' +
    'left:0;overflow:hidden;box-sizing:content-box;' +
    'min-height:0 !important;height:0 !important;padding:0;' +
    'word-wrap:break-word;border:0' + (ANCIENT
    ? '-webkit-box-sizing:content-box;-moz-box-sizing:content-box;' : '')

  var taStyle = getComputedStyle(ta)
  var borderBox = get_prop_value(taStyle, 'box-sizing') === 'border-box' || (ANCIENT && (
      get_prop_value(taStyle, '-moz-box-sizing') === 'border-box' ||
      get_prop_value(taStyle, '-webkit-box-sizing') === 'border-box'))

  var boxOuter = borderBox ? [
    // width
    sum_prop_values(taStyle, 'border-right-width|padding-right|padding-left|border-left-width'),
    //height
    sum_prop_values(taStyle, 'border-top-width|padding-top|padding-bottom|border-bottom-width'),
  ] : [0, 0]

  var minHeightValue = int_prop_value(taStyle, 'min-height')
  var heightValue = int_prop_value(taStyle, 'height')
  var minHeight = Math.max(minHeightValue, heightValue) - boxOuter[1]
  var maxHeight = int_prop_value(taStyle, 'max-height')
  var copyStyle = 'font-family|font-size|font-weight|font-style|letter-spacing|line-height|text-transform|word-spacing|text-indent'.split('|')

  var active, mirror

  const forceAdjust = () => {
    active = false
    adjust()
  }

  if (ANCIENT) {
    // Opera returns max-height of -1 if not set
    maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4
  }

  // append mirror to the DOM
  body.aC(mirror = h('textarea', {
    aria: { hidden: 'true' },
    tabindex: -1,
    style: mirrorInitStyle,
  }))

  var mirror_width = value()
  set_style(mirror, {
    overflowY: ta_overflowY,
    width: mirror_width,
  })


  const initMirror = () => {
    var mirrorStyle = mirrorInitStyle

    // copy the essential styles from the textarea to the mirror
    taStyle = getComputedStyle(ta)
    each(copyStyle, (val) => {
      mirrorStyle += val + ':' + get_prop_value(taStyle, val) + ';'
    })

    if (ANCIENT) mirror.setAttribute('style', mirrorStyle)
    else mirror.style = mirrorStyle
  }

  const adjust = () => {
    // active flag prevents actions in function from calling adjust again
    if (!active) {
      // @Performance: all of this reading and writing of values likely causes many layout recalcs.
      // probably want to do it in an animation frame or something... eg. read it all, then set it in raf
      // another (better) way to do it will be to make the values obvs and then when the system is in place to only update dom values in an animation frame, it'll alraedy be done.
      var taHeight = float(ta_height() || 0)
      var taComputedStyleWidth = get_prop_value(getComputedStyle(ta), 'width')
      var mirrorHeight, width, overflow
      active = true

      mirror.value = ta.value // optional whitespace to improve animation

      // ensure getComputedStyle has returned a readable 'used value' pixel width
      if (taComputedStyleWidth.substr(-2) === 'px') {
        // update mirror width in case the textarea width has changed
        mirror_width(float(taComputedStyleWidth) - boxOuter[0])
      }

      mirrorHeight = mirror.scrollHeight

      // if max-height is set, then have it scroll.
      if (mirrorHeight > maxHeight) {
        mirrorHeight = maxHeight
        overflow = 'scroll'
      } else if (mirrorHeight < minHeight) {
        mirrorHeight = minHeight
      }

      mirrorHeight += boxOuter[1] + 24
      ta_overflowY(overflow || 'hidden')

      if (taHeight < mirrorHeight) {
        // ta.style.height = mirrorHeight + 'px'
        ta_height(mirrorHeight)
      }

      // small delay to prevent an infinite loop
      next_tick(() => {
        // elastic.h(mirrorHeight)
        // elastic.w(width)
        active = false
      })
    }
  }

  // listen
  if (ANCIENT && 'onpropertychange' in ta && 'oninput' in ta) {
    ta['oninput'] = ta.onkeyup = adjust
  } else {
    on(ta, 'input', adjust)
  }

  on(ta, 'resize', forceAdjust)

  next_tick(() => {
    initMirror()
    adjust()
  })

  return () => {
    mirror.rm()
    off(ta, 'resize', forceAdjust)
    if (!ANCIENT) off(ta, 'input', adjust)
  }
}

export default nlElastic
