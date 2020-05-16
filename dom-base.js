import { error, is_array, is_str, is_obj, is_nil } from '@hyper/global'
import { int, split } from '@hyper/utils'

export * from '@hyper/global'
import { doc, win, raf } from '@hyper/global'

// exported to allow other files to extend the prototype easier
export const Node_prototype = Node.prototype

// shortcut document creation functions
export const txt = (t) => doc.createTextNode(t)
export const comment = (t) => doc.createComment(t)
export const cE = (el) => doc.createElement(el)

export const qS = (query) => doc.querySelector(query)
export const qSA = (query) => doc.querySelectorAll(query)

export const isNode = (el) => el && el.nodeType
export const isText = (el) => el && el.nodeType == 3
export const getElementById = (el) => is_str(el) ? doc.getElementById(el) : el

export const which = (event) => (event = event || win.event) ? event.button : event.which

const anchor = cE('a')
// export const parse_href = (href) => (anchor.href = href, anchor)
export const href_pathname = (href) => (anchor.href = href, anchor.pathname)
export const href_query = (href) => (anchor.href = href, split(anchor.search.slice(1), '&'))
export const href_hash = (href) => (anchor.href = href, anchor.hash.slice(1))

export const get_prop_value = (obj, prop) => obj.getPropertyValue(prop)
export const int_prop_value = (obj, prop) => int(obj.getPropertyValue(prop))
export const sum_prop_values = (obj, props) => (
  is_array(props) ? props : split(props)
).reduce((total, prop) => {
  return total + int_prop_value(obj, prop)
}, 0)

export const bounding_rect = (el) => el.getBoundingClientRect()

export const scroll_to = (id_or_el) => {
  let el = getElementById(id_or_el)

  return !el ? null : isNode(el)
    ? win.scrollBy(0, bounding_rect(el).top)
    : win.scrollTo(0, 0)
}

export const get_style_prop = (element, prop) => {
  let st = element.currentStyle
  return st ? st[prop]
    : getComputedStyle ? getComputedStyle(element, null).getPropertyValue(prop)
    : element.style[prop]
}

export const element_offset = (child) => {
  let i = 0
  while ((child = child.previousSibling) != null) i++
  return i
}

export const lookup_parent_element = (el, name) => {
  while (el && el.nodeName.toLowerCase() !== name) {
    el = el.p
  }

  return el
}

export const lookup_parent_with_attr = (el, attr, filter) => {
  while (el && el[attr] === undefined && (!filter || !filter(el))) {
    el = el.p
  }

  return el
}

// by default, for performeance reasons, only passive events are used.
// if preventDefault is called, chrome will spit out an error.
// if you want non-passive, simply pass your own opts: eg.
//   on(emitter, 'click', ..., { passive: false, capture: true })
//             -kenny 14-01-2020
let event_opts = (opts) => {
  return is_nil(opts) ? false
  : is_obj(opts) ? opts
  : opts ? { passive: true, capture: true }
  : !opts ? { passive: true }
  : opts
}

// event stuff
// @Cleanup: replace all instances of 'addEventListener' with this function (to save a few bytes)
export const on = (emitter, event, listener, opts = false) => {
  if (DEBUG && emitter.tagName === 'A' && (typeof opts === 'boolean' || opts.passive)) {
    error('you are trying to listen to an event on an element which will perform page navigation. pass `{passive: false}` if you want to change the default behaviour of the anchor element')
  }
  (emitter.on || emitter.addEventListener).call(emitter, event, listener, event_opts(opts))
}

// @Cleanup: replace all instances of 'removeEventListener' with this function (to save a few bytes)
export const off = (emitter, event, listener, opts = false) => {
  (emitter.off || emitter.removeEventListener).call(emitter, event, listener, event_opts(opts))
}

// dispatch an event
// reading simulant source, it appears to be a bit more complicated than just this:
//  (but I'm not worrying about supporting old browsers). this is designed for modern browsers
// right now, val is simply being passed through... obviously it should set the correct fields though...
// which I'm going to just ignore for the time being...
export const dispatch_event = (element, event, val) => {
  (element.dispatchEvent(new Event(event)), val)
}

export const prevent_default = (event) => {
  event && (event.preventDefault(), event.stopImmediatePropagation())
  return false
}

export const stop_propagation = (event) => {
  event && (event.stopImmediatePropagation())
  return false
}

export const dom_loaded = (callback) => {
  if (ANCIENT) {
    /* Mozilla, Chrome, Opera */
    if (doc.addEventListener) {
      doc.addEventListener('DOMContentLoaded', callback)
    }
    /* Safari, iCab, Konqueror */
    else if (ANCIENT && /KHTML|WebKit|iCab/i.test(ua)) {
      var DOMLoadTimer = setInterval(function () {
        if (/loaded|complete/i.test(doc.readyState)) {
          callback()
          clearInterval(DOMLoadTimer)
        }
      }, 10)
    }
    /* Other web browsers */
    else win.onload = callback
  } else {
    if (doc.body) raf(callback)
    else on(win, 'DOMContentLoaded', callback)
  }
}
