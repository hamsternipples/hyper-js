'use strict'

import { define_prop, define_props } from '@hyper/utils'
import { define_value, define_getter } from '@hyper/utils'
import { error, is_str, is_obv, is_fn, not_fn, is_obv_type } from '@hyper/utils'
import { is_truthy, is_falsy, is_void, is, isnt } from '@hyper/utils'
import { emit, remove } from '@hyper/listeners'
import { remove_every as compactor, new_array } from '@hyper/array'

import { is_array, undefined } from '@hyper/global'

export { is_obv, is_obv_type }

// knicked from: https://github.com/dominictarr/observable/blob/master/index.js
// * exported classes
// * remove utility functions (micro-optimization, reduces readability)
// * change from object traversal to arrays
//  * change all() from `for (var k in ary) ary[k](val)` -> `for (var i = 0; i < ary.length; i++) ary[i](val)`
//  * then, in remove() use `.splice` instead of `delete`. however, to avoid the case that a listener is removed from inside of a listener, the value is set to null and only compacted after 10 listeners have been removed
// * add `._obv` property to all returned functions (necessary for hyper-hermes to know that it's an observable instead of a context)
// * changed `value` to only propagate when the value has actually changed. to force all liseners to receive the current value, `call observable.set()` or `observable.set(observable())`


export const ensure_obv = (obv) => {
  if (not_fn(obv) || !is_str(obv._obv))
    error('expected an observable')
}


// one-way binding: bind lhs to rhs -- starting with the rhs value
export const bind1 = (l, r) => {
  l(r())
  return r(l)
}

// two-way binding: bind lhs to rhs and rhs to lhs -- starting with the rhs value
export const bind2 = (l, r) => {
  l(r())
  let remove_l = l(r), remove_r = r(l)
  return () => { remove_l(); remove_r() }
}

// An observable that stores a value.
if (DEBUG) var VALUE_LISTENERS = 0
if (DEBUG) var OBV_ID = 0
export const value = (initial, _obv) => {
  const obv = (val, do_immediately) => {
    return (
      is_void(val) ? obv.v  // getter
    : not_fn(val) ? (       // is a set
      is(obv.v, val) ? undefined : // only set if obv.v === val (but use Object.is instead of ===, so it gets NaN and +0/-0)
        emit(obv.l,
          obv.v, // previous value
          obv.v = val  // new value
        ), val // return the value
      )
    : ( // is a listener function
        obv.l.push(val),
        (DEBUG && VALUE_LISTENERS++),
        (
          // if the value is uninitialised, or do_immediately is falsey, don't call he listener back immediately with the value.
          is_void(obv.v) || is_falsy(do_immediately)
          ? obv.v
          : val(obv.v)
        ), () => { // listener
          remove(obv.l, val)
          DEBUG && VALUE_LISTENERS--
        }
      )
    )
  }

  // if the value is already an observable, then just return it
  if (is_obv(initial)) {
    return initial
  } else {
    obv.v = initial
  }

  obv.l = []
  obv._obv = 'value'
  if (DEBUG) obv._id = OBV_ID++
  if (DEBUG) obv._type = 'value'
  if (DEBUG) obv.gc = () => compactor(obv.l)
  return obv
}

// an observable that stores a value (same as value), but optionally, the value can be a getter function
export const value2 = (initial) => {
  const obv = (val, do_immediately) => {
    return (
      is_void(val) ? (is_fn(obv.v) ? obv.v() : obv.v) // getter
    : not_fn(val) ? (
      is(obv.v, val) ? undefined : // only set if obv.v === val (but use Object.is instead of ===, so it gets NaN and +0/-0)
        emit(obv.l,
          is_fn(obv.v) ? obv.v() : obv.v, // previous value
          is_fn(obv.v) ? val : obv.v = val  // new value
        ), val // return the value
      )
    : (
        obv.l.push(val),
        (DEBUG && VALUE_LISTENERS++),
        (
          is_void(obv.v) || is_falsy(do_immediately)
          ? obv.v
          : val(obv.v)
        ), () => { // listener
          remove(obv.l, val)
          DEBUG && VALUE_LISTENERS--
        }
      )
    )
  }

  // if the value is already an observable, then just return it
  if (is_obv(initial)) {
    return initial
  } else {
    obv.v = initial
  }

  obv.l = []
  obv._obv = 'value'
  if (DEBUG) obv._id = OBV_ID++
  if (DEBUG) obv._type = 'value2'
  if (DEBUG) obv.gc = () => compactor(obv.l)
  return obv
}

export const inc = (obv, n = 1) => obv((obv.v || 0) + n)
export const dec = (obv, n = 1) => obv((obv.v || 0) - n)
export const mul = (obv, n = 2) => obv((obv.v || 0) * n)
export const div = (obv, n = 2) => obv((obv.v || 0) / n)
export const set = (obv, val) => emit(obv.l, obv.v, obv.v = val)
export const toggle = (obv) => obv(!obv.v)

export const obv_inc_fn = (obv) => {
  return (n = 1) => emit(obv.l, obv.v, obv.v = obv.v + n)
}
export const obv_dec_fn = (obv) => {
  return (n = 1) => emit(obv.l, obv.v, obv.v = obv.v - n)
}
export const obv_mul_fn = (obv) => {
  return (n = 2) => emit(obv.l, obv.v, obv.v = obv.v * n)
}
export const obv_div_fn = (obv) => {
  return (n = 2) => emit(obv.l, obv.v, obv.v = obv.v / n)
}
export const obv_toggle_fn = (obv) => {
  return () => emit(obv.l, obv.v, obv.v = !obv.v)
}
export const obv_set_fn = (obv) => {
  return (val) => emit(obv.l, obv.v, obv.v = is_void(val) ? obv.v : val)
}
export const obv_once_fn = (obv) => {
  return (fn, do_immediately, _stop_listening) => {
    _stop_listening = obv((val, prev) => {
      fn(val, prev)
      _stop_listening()
    }, do_immediately)
    return _stop_listening
  }
}


// an observable object
// @Incomplete: find a solution here because this isn't necessarily possible to be used with `pure_getters`
export const obv_obj = (initialValue, _keys) => {
  // if the value is already an observable, then just return it
  // this is actually incorrect, because maybe we want a new object that observes different keys
  // this kind of needs a little more thought, I think :)
  if (initialValue && initialValue._obv === 'object') return initialValue

  let obj = {}
  let obvs = {}
  let keys = []
  let props = {
    _obv: define_value('object'),
    // TODO: implement get/set,on/off for compatibility with scuttlebutt?
    get: define_value((path, default_value) => {
      let o = obj, p, paths = is_array(path) ? path
        : typeof path === 'string' && ~path.indexOf('.') ? path.split('.')
        : [path]

      while (p = paths.unshift()) {
        if ((o = obj[p]) === undefined) {
          o = obj[p] = {}
        }
      }

      return o
    }),
    set: define_value((v) => {
      for (let k of keys) {
        if (obvs[k] && v[k]) obvs[k](v[k])
      }
    })
  }

  for (let k of is_array(_keys) ? _keys : Object.keys(initialValue)) {
    let _obv, v = initialValue[k]
    if (v !== undefined) {
      if (v._obv === 'value') obvs[k] = v, keys.push(k)
      else if (v._obv) props[k] = define_value(v)
      else keys.push(k)
    }
  }

  for (let k of keys) props[k] = define_getter(              // define_getter defaults to allow the prop to be enumerable and reconfigurable
    () => (obvs[k] || (obvs[k] = value(initialValue[k])))(), // get
    (v) => obvs[k](v)                                        // set
  )

  // @Incomplete - needs to have cleanup. what's the point of observing something if you can't listen to its changes...
  //               which means you'll need to stop listening at some point, too
  define_props(obj, props)
  return obj
}

/*
##property
observe a property of an object, works with scuttlebutt.
could change this to work with backbone Model - but it would become ugly.
*/

export const property = (model, key) => {
  obv._obv = 'property'
  if (DEBUG) obv._id = OBV_ID++
  if (DEBUG) obv._type = 'property'
  return obv

  function obv (val) {
    return (
      is_void(val) ? model.get(key)
    : not_fn(val) ? model.set(key, val)
    : (on(model, 'change:'+key, val), val(model.get(key)), () => {
        off(model, 'change:'+key, val)
      })
    )
  }
}


// @Improvement:
// there is an inefficiency here where `down` will get called as many times as there are listeners.
// it's just a middle-man.
// it could be improved to store its own listeners and only subscribe to obv when it has listenrs.

// listens to `obv`, calling `down` with the value first before passing it on to the listener
// when set, it'll call `up` (if it's set), otherwise `down` with the set value before setting
// that transformed value in `obv`
export const transform = (obv, down, up) => {
  if (DEBUG) ensure_obv(obv)

  observable._obv = obv._obv
  return observable

  function observable (arg, do_immediately) {
    return (
      is_void(arg) ? down(obv())
    : not_fn(arg) ? obv((up || down)(arg))
    : obv((cur, old) => { arg(down(cur, old)) }, do_immediately)
    )
  }
}



// transform an array of obvs
if (DEBUG) var COMPUTE_LISTENERS = 0
export const compute = (obvs, compute_fn) => {
  var is_init = 1, len = obvs.length
  var obv_vals = new_array(len)
  // @Incomplete: move this to obv.l
  var removables = [], fn

  var obv = (arg, do_immediately) => {
    // this is probably the clearest code I've ever written... lol
    return (
      is_void(arg) ? (                // 1. no arg: getter... eg. obv()
        is_void(obv.v) ? (
          obv.v = compute_fn.apply(null, obv_vals))
      : obv.v)
    : not_fn(arg) ? (                 // 2. arg is a value: setter... eg. obv(1234)
      obv.v === arg ? undefined       // same value? do nothing
      : emit(obv.l, obv.v, obv.v = arg), arg) // emit changes to liseners
    : (obv.l.push(arg),               // arg is a function. add it to the listeners
      (DEBUG && COMPUTE_LISTENERS++), // dev code to help keep leaks from getting out of control
      (is_falsy(do_immediately) ? 0   // if is_falsy(do_immediately), do notihng
        : arg(obv.v)),                // otherwise call the listener with the current value
      () => { remove(obv.l, arg); DEBUG && COMPUTE_LISTENERS-- }) // unlisten function
    )
  }

  obv.l = []
  obv._obv = 'value'
  if (DEBUG) obv._id = OBV_ID++
  if (DEBUG) obv._type = 'compute'
  if (DEBUG) obv.gc = () => compactor(obv.l)
  obv.x = () => { for (fn of removables) fn() }

  // @Speed: check to see if there is an imporovement on memory/speed, changing this to `each((fn, i) => { ... }`. because of the length variable savings passing to new_array - the 'let ' cost, it still comes to almost the same byte size.. ±6bytes.
  // the `let` is important here. (var won't work)
  for (let i = 0; i < len; i++) {
    fn = obvs[i]
    if (is_obv(fn)) {
      removables.push(fn((v, _prev) => {
        _prev = obv_vals[i]
        obv_vals[i] = v
        if (isnt(_prev, v) && !is_init)
          obv(compute_fn.apply(null, obv_vals))
      }, is_init))
    } else {
      // items in the obv array can also be literals
      obv_vals[i] = is_fn(fn) ? fn() : fn
    }
  }

  // set the inited values
  obv.v = compute_fn.apply(null, obv_vals)
  is_init = 0

  return obv
}

export const calc = (obvs, compute_fn) => {
  var len = obvs.length, fn
  var obv_vals = new_array(len)

  for (var i = 0; i < len; i++) {
    obv_vals[i] = is_fn(fn = obvs[i]) ? fn() : fn
  }

  return compute_fn.apply(null, obv_vals)
}

export const boolean = (obv, truthy, falsey) => {
  return (
    transform(obv,
      (val) => val ? truthy : falsey,
      (val) => val == truthy ? true : false
    )
  )
}

export const obv_property = (obj, key, obv) => {
  define_prop(obj, key, define_getter(() => obv(), (v) => { obv(v) }))
  return () => { define_prop(obj, key, define_value(o(), true)) }
}

export const PRINT_COUNTS = () => {
  let counts = { value: VALUE_LISTENERS, compute: COMPUTE_LISTENERS }
  console.log(counts)
  return counts
}
