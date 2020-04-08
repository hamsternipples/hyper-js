
// Cleanup: this imports a whole bunch of stuff.
//          perhaps think about something maybe a little lighter.
import obj_like from './lodash/isObject'
import { setTimeout, clearTimeout } from '@hyper/global'
import { Array, is_array } from '@hyper/global'
import { Object, noop } from '@hyper/global'

export { is_array, noop }

// array stuff
import {
  slice,
  each,
  each_reverse,
  call_each,
  every,
  reverse_props,
  concat,
  empty_array,
  array_idx,
  compact,
  remove_every,
  flatten,
  ensure_array,
  uniq,
} from '@hyper/array'
// reexport them
export {
  slice,
  each,
  each_reverse,
  call_each,
  every,
  reverse_props,
  concat,
  empty_array,
  array_idx,
  compact,
  remove_every,
  flatten,
  ensure_array,
  uniq,
}


export const error = (message, type = Error) => {
  if (message instanceof Error) throw message
  else throw new type(message)
}

export const __debug = (msg) => {
  if (msg) console.log('entering the debugger. reason:\n    ' + msg)
  if (typeof DEBUG !== 'undefined') debugger
  else console.warn('continuing... (debug not enabled)')
}

export const int = (s) => parseInt(s, 10)
export const hex = (s) => parseInt(s, 16)
export const float = parseFloat

export const is_fn = (fn) => typeof fn === 'function'
export const not_fn = (fn) => typeof fn !== 'function'
export { is_fn as is_func, is_fn as is_function }
export { not_fn as not_func, not_fn as not_function }

export const is_obj = (obj) => typeof obj === 'object'
export const not_obj = (obj) => typeof obj !== 'object'
export { is_obj as is_object }
export { not_obj as not_object }

export const is_str = (str) => typeof str === 'string'
export const not_str = (str) => typeof str !== 'string'
export { is_str as is_string }
export { not_str as not_string }

export const is_num = (num) => typeof num === 'number'
export const not_num = (num) => typeof num !== 'number'
export { is_num as is_number }
export { not_num as not_number }

export const is_bool = (bool) => typeof bool === 'boolean'
export const not_bool = (bool) => typeof bool !== 'boolean'
export { is_bool as is_boolean }
export { not_bool as not_boolean }

export const is_void = (v) => typeof v === 'undefined'
export const not_void = (v) => typeof v !== 'undefined'
export { is_void as is_undefined }
export { not_void as not_undefined }

export const is_nil = (v) => v == null
export const not_nil = (v) => v != null

export const is_empty = (value) => (!value || not_obj(value))
  ? !value
  : !(is_array(value)
    ? value
    : Object.keys(value)).length

export const is_obv = (obv) => is_fn(obv) && obv._obv
export const is_obv_type = (obv, type) => is_fn(obv) && (obv._obv === type)

// swaps two elements in an array/object
export const swap = (o, to, from) => {
  var t = o[to]
  o[to] = o[from]
  o[from] = t
}

export const obj_aliases = (proto, aliases, k) => {
  for (k in aliases) proto[k] = proto[aliases[k]]
}

// `cb(obj, array[i])` gets called `array.length` times
export const obj_apply = (obj, array, cb) => {
  for (let item of array) cb(obj, item)
  return obj
}

// `cb(obj, array[i], array2[j])` gets called `array.length * array2.length` times
export const obj_apply2 = (obj, array, array2, cb) => {
  for (let item of array)
    for (let item2 of array2)
      cb(obj, item, item2)
  return obj
}

export const parseJSON = (string) => {
  try {
    return JSON.parse(string)
  } catch (e) {
    return string || ''
  }
}

export const objJSON = (s) => {
  try {
    return typeof s === 'string' ? JSON.parse(s) : s
  } catch (e) {}
  return {}
}

export const pick = (object, keys) => {
  var x, data = {}

  if (typeof keys === 'function') {
    for (x in object) {
      if (keys(object[x], x)) {
        data[x] = object[x]
      }
    }
  } else {
    for (x = 0; x < keys.length; x++) {
      data[keys[x]] = object[keys[x]]
    }
  }

  return data
}

// @Cleanup: this looks to be a duplicate of the above `is_empty`
export const isEmpty = (value) => {
  return !value ||
    (typeof value.length === 'number' && !value.length) ||
    (typeof value.size === 'number' && !value.size) ||
    (typeof value === 'object' && !Object.keys(value).length)
}

export const stringify = (value) => (!value || typeof value !== 'object') ? value : JSON.stringify(value)

export const camelize = (k) => ~k.indexOf('-') ? k.replace(/-+(.)?/g, (tmp, c) => (c || '').toUpperCase()) : k

// I imagine that something better can be done than this...
export const define_getter = (get, set = void 0, enumerable = true, configurable = true) => ({ get, set, enumerable, configurable })
export const define_value = (value, writable = false, enumerable = true, configurable = true) => ({ value, writable, enumerable, configurable })
export const define_prop = (obj, prop, def) => Object.defineProperty(obj, prop, def)
export const define_props = (obj, prop_defs) => Object.defineProperties(obj, prop_defs)

export const slasher = (_path, strip_leading) => {
  // strip trailing slash
  var path = _path.replace(/\/$/, '')
  // (optionally) strip leading slash
  return strip_leading && path[0] === '/' ? path.slice(1) : path
}

// get a value from options then return the value (or the default passed)
// puts object into "slow mode" though
export const extract_opts_val = (opts, key, _default) => {
  var val
  if (val = opts[key]) delete opts[key]
  return val === void 9 ? _default : val
}

// knicked from: https://github.com/elidoran/node-optimal-object/blob/master/lib/index.coffee
export const optimal_obj = (obj) => {
  Object.create(obj)
  var enforcer = () => obj.blah
  // call twice to ensure v8 optimises the object
  enforcer()
  enforcer()
}

// merges all of `objs` into a new object (doesn't modify any of the `objs`)
export const merge = (...objs) => {
  return Object.assign({}, ...objs)
}

// merges all of the properties from `obj[1 .. *]` into `obj[0]` and returns `obj[0]`
export const extend = (...obj) => {
  return DEBUG && !obj.length
    ? error(`don't call extend with 0 arguments`)
    : Object.assign(...obj)
}

export { extend as assign }

// knicked from: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
export const mergeDeep =(target, ...sources) => {
  if (!sources.length) return target
  var key, src_obj, source = sources.shift()

  if (obj_like(target) && obj_like(source)) {
    for (key in source) {
      if (obj_like(src_obj = source[key])) {
        if (!target[key]) target[key] = {}
        mergeDeep(target[key], src_obj)
      } else {
        Object.assign(target, { [key]: src_obj })
      }
    }
  }

  return mergeDeep(target, ...sources)
}

// same as above, but also concats arrays
export const mergeDeepArray =(target, ...sources) => {
  if (!sources.length || !obj_like(target)) return target
  var key, src_val, obj_val, source

  if (obj_like(source = sources.shift())) {
    for (key in source) {
      src_val = source[key]
      obj_val = target[key]
      if (is_array(src_val) || is_array(obj_val)) {
        target[key] = (obj_val || []).concat(src_val)
      } else if (obj_like(src_val)) {
        if (!obj_val) target[key] = {}
        mergeDeep(obj_val, src_val)
      } else {
        Object.assign(target, { [key]: src_val })
      }
    }
  }

  return mergeDeep(target, ...sources)
}

export const now = Date.now

// left_pad((1234).toString(16), 20, '0')
// > "000000000000000004d2"
export const left_pad = (nr, n = 2, str = '0') => Array(n - (nr+'').length + 1).join(str) + nr

export const kind_of = (val) => val === null ? 'null'
  : typeof val !== 'object' ? typeof val
  : is_array(val) ? 'array'
  : {}.toString.call(val).slice(8, -1).toLowerCase()

let next_ticks = []
export const next_tick = (cb, ...args) => {
  if (!next_ticks.i) {
    next_ticks.i = setTimeout(() => {
      for (let n, i = 0; i < next_ticks.length; i++)
        next_ticks[i].c.apply(null, next_ticks[i].a)
      next_ticks = []
    }, 1)
  }
  if (!cb) next_ticks.p = new Promise((resolve) => cb = resolve)
  next_ticks.push({c: cb, a: args})
  return next_ticks.p
}

export const after = (seconds, cb, ...args) => {
  if (typeof seconds === 'function')
    return next_tick(cb, ...args)
  let id = setTimeout(() => {
    if (typeof cb === 'function') cb(...args)
  }, seconds * 1000)
  if (!cb) return new  Promise((resolve) => cb = resolve)
  return () => clearTimeout(id)
}

// not working. incomplete. I don't know exactly what I want yet. nocommit
export const time_curve = (sec, curve, cb) => {
  var f = get_beizer(curve)
  var t0 = 0
  raf(() => {
    var ts = performance.now()
    if (!first_t) first_t = now
    var delta = (ts - t0)
  })
}

// @Incomplete: also add the timeline in meditatior
