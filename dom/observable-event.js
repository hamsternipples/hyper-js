
import { error, each } from '@hyper/utils'
import { is_obv, ensure_obv, bind2, transform, compute } from '@hyper/dom/observable'
import { on, off, dispatch_event, prevent_default } from '@hyper/dom/dom-base'


// listen to any event, reading `attr` and calling `listener` with the value.
// `attr` can also be a function which can be used to transform the value passed to listener.
export function listen (element, event, attr, listener, do_immediately, opts) {
  if (DEBUG && typeof listener !== 'function') error(`listener isn't a function`)
  let on_event = (e) => { listener(typeof attr === 'function' ? attr(e) : attr ? element[attr] : e) }
  on(element, event, on_event, opts)
  do_immediately && attr && on_event()
  return () => off(element, event, on_event, opts)
}

// observe any event, reading any attribute.
// returns an observable.
export function obv_event (element, attr = 'value', event = 'keyup', event_filter, listener) {
  event_filter = typeof event_filter === 'function' ? event_filter
    : ((e) => e.which === 13 && !e.shiftKey)

  observable._obv = 'event'
  return observable

  function observable (val) {
    return (
      val === undefined ? val
    : typeof val !== 'function' ?  undefined //read only
    : (typeof listener === 'function' ? listener
        : (listener = (e) => event_filter(e) ? (val(element[attr], e), prevent_default(e), true) : false), // BADNESS!! val is defined in the observable function!
        (on(element, event, listener), () => {
          off(element, event, listener)
        })
      )
    )
  }
}


// returns an event listener (for example, to be used in combination with addEventListener)
// which will modify the value of `obv` whenever the returned function is called.
export function update_obv (obv, update_fn) {
  if (DEBUG) ensure_obv(obv)
  if (DEBUG) if (typeof update_fn !== 'function') error('update_fn should be a function which updates the obv value, eg. (v) => !v')
  return (evt) => obv(update_fn(evt, obv()))
}


//observe html element - aliased as `input`
export { attribute as input }
export function attribute (element, attr = 'value', event = 'input') {
  observable._obv = 'attribute'
  return observable

  function observable (val, do_immediately) {
    return (
      val === undefined ? element[attr]
    : typeof val !== 'function' ?
        dispatch_event(element, event, element[attr] = val)
    : (is_obv(val) && val(observable), // 2-way bindings
        listen(element, event, attr, val, do_immediately))
    )
  }
}

// observe a select element
export function select (element, attr = 'value', event = 'change') {
  const get_attr = (idx = element.selectedIndex) => ~idx ? element.options[idx][attr] : null
  const set_attr = (val) => {
    var options = element.options, i = 0
    for (; i < options.length; i++) {
      if (options[i][attr] == val) {
        // TODO: don't dispatch if the value is the same?
        return dispatch_event(element, event, get_attr(element.selectedIndex = i))
      }
    }
  }

  observable._obv = 'select'
  return observable

  function observable (val, do_immediately) {
    return (
      val === undefined ? element.options[element.selectedIndex][attr]
    : typeof val !== 'function' ? set_attr(val)
    : listen(element, event, get_attr, val, do_immediately)
    )
  }
}

//toggle based on an event, like mouseover, mouseout
export function toggle (el, up_event, down_event) {
  var _val = false
  var on_up = (listener) => () => _val || listener.call(el, _val = true)
  var on_down = (listener) => () => _val && listener.call(el, _val = false)

  observable._obv = 'toggle'
  return observable

  function observable (val) {
    return (
      val === undefined ? _val
    : typeof val !== 'function' ? undefined // read only
    : (
        on(el, up_event, on_up = on_up(val)),
        on(el, down_event || up_event, on_down = on_down(val)),
        () => { // unlisten
          off(el, up_event, on_up)
          off(el, down_event || up_event, on_down)
        }
      )
    )
  }
}

export function add_event (cleanupFuncs, e, event, listener, opts) {
  on(e, event, listener, opts)
  cleanupFuncs.z(() => { off(e, event, listener, opts) })
}

// https://www.html5rocks.com/en/mobile/touchandmouse/
// https://www.html5rocks.com/en/mobile/touch/
// look into `passive: true` as a replacement for the `preventDefault` functionality.
// it turns out that if the event listener is passive, then it's unable to prevent the
// default functionality -- which, if the element is an anchor 'a' element, then the
// default functionality is to navigate to another page, and that cannot be prevented
// with a passive handler, ever.
//
// so, the solution is to use a different element than 'a' (I have begun to use 'b')
// and passively do the click handler on there and process the click events with
// a custom click/touchstart handler which is capable of handling the clicks, but
// also allowing for navigation away from the page.
//
//      -kenny (2020-02-14)
export function boink (cleanupFuncs, el, obv, opts) {
  // passing attr=0 here to tell it to not grab the value of any attribute on the el.
  cleanupFuncs.push(
    listen(el, 'click', 0, (ev) => { is_obv(obv) ? obv(!obv()) : obv.call(el, ev, el) }, 0, opts),
    listen(el, 'touchstart', 0, (ev) => { prevent_default(ev); is_obv(obv) ? obv(!obv()) : obv.call(el, ev, el) }, 0, opts)
  )
}

export function press (cleanupFuncs, el, obv, pressed = true, normal = false) {
  // passing attr=0 here to tell it to not grab the value of any attribute on the el.
  cleanupFuncs.push(
    listen(el, 'mouseup', 0, () => { obv(normal) }),
    listen(el, 'mousedown', 0, () => { obv(pressed) }),
    listen(el, 'touchend', 0, (e) => { prevent_default(e); obv(normal) }),
    listen(el, 'touchstart', 0, (e) => { prevent_default(e); obv(pressed) })
  )
}

export function observe_event (cleanupFuncs, el, observe_obj) {
  let s, v
  for (s in observe_obj) {
    v = observe_obj[s]
    // observable
    if (s === 'boink') {
      boink(cleanupFuncs, el, v)
    }
    else if (s === 'press') {
      press(cleanupFuncs, el, v)
    }
    else if (s === 'input' || s === 'value') {
      cleanupFuncs.z(attribute(el, observe_obj[s+'.attr'], observe_obj[s+'.on'])(v))
    }
    else if (s === 'disabled') {
      cleanupFuncs.z(attribute(el, s, observe_obj[s+'.on'])(v))
    }
    else if (s === 'hidden') {
      // cleanupFuncs.z(v(v => { el.style.display = v ? 'none' : '' }, 1))
      cleanupFuncs.z(v(v => { el.hidden = v }))
    }
    else if (s === 'hover') {
      cleanupFuncs.z(toggle(el, 'mouseover', 'mouseout')(v))
    }
    else if (s === 'touch') {
      cleanupFuncs.z(toggle(el, 'touchstart', 'touchend')(v))
    }
    else if (s === 'mousedown') {
      cleanupFuncs.z(toggle(el, 'mousedown', 'mouseup')(v))
    }
    else if (s === 'focus') {
      cleanupFuncs.z(toggle(el, 'focus', 'blur')(v))
    }
    else if (s.slice(0, 'select'.length) === 'select') {
      // 'select_value' or 'select:value' (by value)
      // 'select_label' or 'select:label' (select the label)
      s = select(el, s.slice('select'.length + 1) || 'value')
      cleanupFuncs.z(
        is_obv(v)
          ? bind2(s, v)
          : s(v)
      )
    }
    else {
    // case 'keyup':
    // case 'keydown':
    // case 'touchstart':
    // case 'touchend':
      if (!~s.indexOf('.')) {
        if (DEBUG && typeof v !== 'function') error('observer must be a function')
        cleanupFuncs.z(
          obv_event(el, observe_obj[s+'.attr'], (observe_obj[s+'.event'] || s), observe_obj[s+'.valid'])(v)
        )
      }
    }
  }
}
