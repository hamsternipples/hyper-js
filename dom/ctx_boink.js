
import { error } from '@hyper/utils'
import { ctx_el } from '@hyper/dom/hyper-hermes'
import { remove_every, each } from '@hyper/array'
import { boink } from '@hyper/dom/observable-event'

// nocommit
// - new function `ctx_el` - which returns the element for the ctx now G.E.frame
// - rename to ctx_boink

// the way in works is it'll call the callback, and if the callback's return is truthy, then the callback will be removed and won't be called again.

var handlers = new WeakMap
const ctx_boink = (G) => {
  var handler, el
  if (handler = handlers.get(G)) return handler

  var el = ctx_el(G)
  var click_handlers = []

  // context click handler
  boink(G.x, el, (ev) => {
    var path = ev.path

    each(click_handlers, ([not_on_this_el, cb], idx) => {
      if (!not_on_this_el || !path.includes(not_on_this_el)) {
        if (!cb(ev)) click_handlers[idx] = null
      }
    })

    // remove the nulls
    remove_every(click_handlers)

    // tells it to continue to propagate the event.
    // otherwise the boink function will stop the event's propagation.
    return true
  }, true) // true = capture

  handler = (not_on_this_el, cb) => {
    click_handlers.push([not_on_this_el, cb])
  }

  // handler = {
  //   only_next (not_on_this_el, cb) {
  //     click_handlers.push([not_on_this_el, cb])
  //   },
  //
  //   on_every (not_on_this_el, cb) {}
  // }

  handlers.set(G, handler)
  G.z(() => { handlers.delete(G) })
  return handler
}

export default ctx_boink
