
import { error, is_array } from '@hyper/utils'
import { ctx_el } from '@hyper/dom/hyper-hermes'
import { remove_every, each } from '@hyper/array'
import { boink } from '@hyper/dom/observable-event'

// the way in works is it'll call the callback, and if the callback's return is truthy, then the callback will be removed and won't be called again.

var handlers = new WeakMap
const ctx_boink = (G) => {
  var handler = handlers.get(G)
  if (handler) return handler

  var el = ctx_el(G)
  var click_handlers = []

  // context click handler
  boink(G.X, el, (ev) => {
    var path = ev.path, i = 0

    each(click_handlers, ([not_on_this_el, cb], idx) => {
      if (!not_on_this_el || !(is_array(not_on_this_el)
        ? not_on_this_el.some(el => path.includes(el))
        : path.includes(not_on_this_el))) {
        if (!cb(ev)) click_handlers[idx] = null, i++
      }
    })

    // remove the nulls
    if(i > 0) remove_every(click_handlers)

    // truthy value tells it to continue to propagate the event.
    // otherwise the boink function will stop the event's propagation.
    return 1
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
  G.Z(() => { handlers.delete(G) })
  return handler
}

export default ctx_boink
