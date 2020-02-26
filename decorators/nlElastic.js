
import { each, assign, next_tick, int } from '@hyper/utils'
import { win, body, getComputedStyle } from '@hyper/dom/dom-base'
import { on, off } from '@hyper/dom/dom-base'
import { get_prop_value, int_prop_value, sum_prop_values } from '@hyper/dom/dom-base'

import raf from '@hyper/dom/request-animation-frame'

import h from '@hyper/dom/hyper-hermes'

function nlElastic (node, keypath, padding = 24) {
  var ta = node
  var $ta = node

  // if elastic already applied (or is the mirror element)
  // if Ractive, then just exit.
  if (RACTIVE && $ta.dataset.elastic) return
  // modern platforms should error
  if (DEBUG && $ta.dataset.elastic) error('this is already an elastic textarea')

  // ensure the element is a textarea, and browser is capable
  // if Ractive, just exit, cause it's a programmer error or an old browser
  if (RACTIVE && ta.nodeName !== 'TEXTAREA' || (ANCIENT && !getComputedStyle)) return
  // modern platforms will error
  if (DEBUG && ta.nodeName !== 'TEXTAREA') error('node is not a textarea')
  if (DEBUG && (ANCIENT && !getComputedStyle)) error('getComputedStyle not supported on this platform')

  // set these properties before measuring dimensions
  assign($ta.style, {
    overflow: 'hidden',
    overflowY: 'hidden',
    wordWrap: 'break-word',
  })

  // force text reflow
  var text = ta.value
  ta.value = ''
  ta.value = text

  if (RACTIVE) var ractive = Ractive.getNodeInfo(node).ractive
  var mirrorInitStyle =
    'position:absolute;top:-999px;right:auto;bottom:auto;' +
    'left:0;overflow:hidden;box-sizing:content-box;' +
    (ANCIENT
    ? '-webkit-box-sizing:content-box;-moz-box-sizing:content-box;' :'') +
    'min-height:0 !important;height:0 !important;padding:0;' +
    'word-wrap:break-word;border:0'

  var taStyle = getComputedStyle(ta)
  var borderBox = get_prop_value(taStyle, 'box-sizing') === 'border-box' || (ANCIENT && (
      get_prop_value(taStyle, '-moz-box-sizing') === 'border-box' ||
      get_prop_value(taStyle, '-webkit-box-sizing') === 'border-box'))
  var boxOuter = !borderBox ? {width: 0, height: 0} : {
    width: sum_prop_values(taStyle, 'border-right-width|padding-right|padding-left|border-left-width'),
    height: sum_prop_values(taStyle, 'border-top-width|padding-top|padding-bottom|border-bottom-width'),
  }
  var minHeightValue = int_prop_value(taStyle, 'min-height')
  var heightValue = int_prop_value(taStyle, 'height')
  var minHeight = Math.max(minHeightValue, heightValue) - boxOuter.height
  var maxHeight = int_prop_value(taStyle, 'max-height')
  var copyStyle = 'font-family|font-size|font-weight|font-style|letter-spacing|line-height|text-transform|word-spacing|text-indent'.split('|')
  var mirrored, active, mirror

  var forceAdjust = () => {
    active = false
    adjust()
  }

  var teardown = () => {
    mirror.rm()
    off(ta, 'resize', forceAdjust)
    if (!ANCIENT) off(ta, 'input', adjust)
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
    data: { elastic: true },
  }))

  $ta.dataset.elastic = true

  /*
   * methods
   */

  function initMirror () {
    var mirrorStyle = mirrorInitStyle

    mirrored = ta
    // copy the essential styles from the textarea to the mirror
    taStyle = getComputedStyle(ta)
    each(copyStyle, (val) => {
      mirrorStyle += val + ':' + get_prop_value(taStyle, val) + ';'
    })

    if (ANCIENT) mirror.setAttribute('style', mirrorStyle)
    else mirror.style = mirrorStyle
  }

  function adjust () {
    if (mirrored !== ta) {
      initMirror()
    }

    // active flag prevents actions in function from calling adjust again
    if (!active) {
      // @Performance: all of this reading and writing of values likely causes many layout recalcs.
      // probably want to do it in an animation frame or something... eg. read it all, then set it in raf
      var taHeight = ta.style.height ? int(ta.style.height) : 0
      var taComputedStyleWidth = get_prop_value(getComputedStyle(ta), 'width')
      var mirrorHeight, width, overflow
      active = true

      mirror.value = ta.value // optional whitespace to improve animation
      mirror.style.overflowY = ta.style.overflowY

      // ensure getComputedStyle has returned a readable 'used value' pixel width
      if (taComputedStyleWidth.substr(taComputedStyleWidth.length - 2, 2) === 'px') {
        // update mirror width in case the textarea width has changed
        width = int(taComputedStyleWidth) - boxOuter.width
        mirror.style.width = width + 'px'
      }

      mirrorHeight = mirror.scrollHeight

      if (mirrorHeight > maxHeight) {
        mirrorHeight = maxHeight
        overflow = 'scroll'
      } else if (mirrorHeight < minHeight) {
        mirrorHeight = minHeight
      }
      mirrorHeight += boxOuter.height + 24
      ta.style.overflowY = overflow || 'hidden'

      if (taHeight < mirrorHeight) {
        ta.style.height = mirrorHeight + 'px'
        if (RACTIVE) raf(() => ractive.fire('elastic:resize', $ta))
      }

      // small delay to prevent an infinite loop
      next_tick(() => active = false)
    }
  }

  // listen
  if (ANCIENT && 'onpropertychange' in ta && 'oninput' in ta) {
    // IE9
    ta['oninput'] = ta.onkeyup = adjust
  } else {
    on(ta, 'input', adjust)
    // ta['oninput'] = adjust
  }

  on(ta, 'resize', forceAdjust)

  if (RACTIVE) {
    if (keypath) ractive.observe(keypath, function (v) {
      forceAdjust()
    })

    ractive.on('elastic:adjust', function () {
      initMirror()
      forceAdjust()
    })
  }

  next_tick(adjust)

  return RACTIVE ? { teardown } : teardown
}

export default nlElastic
