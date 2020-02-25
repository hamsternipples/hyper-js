
// Cleanup: this imports a whole bunch of stuff.
//          perhaps think about something maybe a little lighter.
import obj_like from './lodash/isObject'

export function noop () {}

export function error (message, type = Error) {
  if (message instanceof Error) throw message
  else throw new type(message)
}

export function __debug (msg) {
  if (msg) console.log('entering the debugger. reason:\n    ' + msg)
  if (typeof DEBUG !== 'undefined') debugger
  else console.warn('continuing... (debug not enabled)')
}

export const int = (s) => parseInt(s, 10)

export const is_array = Array.isArray
export const is_empty = (value) => (!value || typeof value !== 'object') ? !value : !(is_array(value) ? value : Object.keys(value)).length

export const is_fn = (fn) => typeof fn === 'function'
export { is_fn as is_func, is_fn as is_function }

export const is_obj = (obj) => typeof obj === 'object'
export { is_obj as is_object }

export const is_str = (str) => typeof str === 'string'
export { is_str as is_string }

export const is_num = (num) => typeof num === 'number'
export { is_num as is_number }

export const is_bool = (bool) => typeof bool === 'boolean'
export { is_bool as is_boolean }


// micro-optimization: http://jsperf.com/for-vs-foreach/292
export function each (arr, fn, _this = arr, i) {
  for (i = 0; i < arr.length; ++i) fn.call(_this, arr[i], i)
}

export function each_reverse (arr, fn, _this = arr, i) {
  for (i = arr.length - 1; i >= 0; i--) fn.call(_this, arr[i], i)
}

export function call_each (arr, _this = arr, i) {
  for (i = 0; i < arr.length; ++i) arr[i].call(_this)
}

export function every (obj, fn, _this = obj, k) {
  for (k in obj) fn.call(_this, obj[k], k)
}

export function concat (arr1, arr2) {
  var l1 = arr1.length
  var l2 = arr2.length
  var res = empty_array(l1 + l2)
  var i = 0, i2 = 0
  for (; i < l1; i++) res[i] = arr1[i]
  for (; i2 < l2; i2++) res[i + i2] = arr2[i2]
  return res
}

export function empty_array (n, init_value = 0) {
  var array = Array(n)
  while (n-- > 0) array[n] = typeof init_value === 'function' ? init_value(n) : init_value
  return array
}

export const array_idx = (len, idx) => idx < 0 ? len + idx : idx

// same as lodash.compact, but does the compaction inline on the same array by resizing it
export function compact (array) {
  var i = -1,
      len = array.length,
      idx = -1

  while (++i < len) {
    var value = array[i]
    if (value) {
      if (i !== ++idx) array[idx] = value
    }
  }
  array.length = idx + 1
  return array
}

// removes (using splice) by strict-comparison all of `value` (default: null) from an array
export function remove_every (array, value = null) {
  var i = -1, len = array.length, to_remove = 0
  while (++i < len) {
    while (array[i + to_remove] === value) to_remove++
    if (to_remove > 0) {
      array.splice(i, to_remove)
      to_remove = 0
    }
  }

  return array
}

// lightweight version of flatten which only flattens 1 level deep.
export function flatten (array) {
  let res = []
  for (let v of array) is_array(v) ? res.push(...v) : res.push(v)
  return res
}

export function ensure_array (value) {
  return is_array(value) ? value : [value]
}

// unique array values using Set.
export function uniq (array) {
  return Array.from(new Set(array).values())
}

// swaps two elements in an array/object
export function swap (o, to, from) {
  var t = o[to]
  o[to] = o[from]
  o[from] = t
}

export function obj_aliases (proto, aliases, k) {
  for (k in aliases) proto[k] = proto[aliases[k]]
}

// `cb(obj, array[i])` gets called `array.length` times
export function obj_apply (obj, array, cb) {
  for (let item of array) cb(obj, item)
  return obj
}

// `cb(obj, array[i], array2[j])` gets called `array.length * array2.length` times
export function obj_apply2 (obj, array, array2, cb) {
  for (let item of array)
    for (let item2 of array2)
      cb(obj, item, item2)
  return obj
}

export function parseJSON (string) {
  try {
    return JSON.parse(string)
  } catch (e) {
    return string || ''
  }
}

export function objJSON (s) {
  try {
    return typeof s === 'string' ? JSON.parse(s) : s
  } catch (e) {}
  return {}
}

export function pick (object, keys) {
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
export function isEmpty (value) {
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

export function slasher (_path, strip_leading) {
  // strip trailing slash
  var path = _path.replace(/\/$/, '')
  // (optionally) strip leading slash
  return strip_leading && path[0] === '/' ? path.slice(1) : path
}

// get a value from options then return the value (or the default passed)
// puts object into "slow mode" though
export function extract_opts_val (opts, key, _default) {
  var val
  if (val = opts[key]) delete opts[key]
  return val === void 9 ? _default : val
}

// knicked from: https://github.com/elidoran/node-optimal-object/blob/master/lib/index.coffee
export function optimal_obj (obj) {
  Object.create(obj)
  var enforcer = () => obj.blah
  // call twice to ensure v8 optimises the object
  enforcer()
  enforcer()
}

// merges all of `objs` into a new object (doesn't modify any of the `objs`)
export function merge (...objs) {
  return Object.assign({}, ...objs)
}

// merges all of the properties from `obj[1 .. *]` into `obj[0]` and returns `obj[0]`
export function extend (...obj) {
  return Object.assign(...obj)
}

export { extend as assign }

// knicked from: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
export function mergeDeep(target, ...sources) {
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
export function mergeDeepArray(target, ...sources) {
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

// left_pad((1234).toString(16), 20, '0')
// > "000000000000000004d2"
export const left_pad = (nr, n = 2, str = '0') => Array(n - (nr+'').length + 1).join(str) + nr

export const kind_of = (val) => val === null ? 'null'
  : typeof val !== 'object' ? typeof val
  : is_array(val) ? 'array'
  : {}.toString.call(val).slice(8, -1).toLowerCase()

let next_ticks = []
export function next_tick (cb, ...args) {
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

export function after (seconds, cb, ...args) {
  if (typeof seconds === 'function')
    return next_tick.apply(this, arguments)
  let id = setTimeout(() => {
    if (typeof cb === 'function') cb(...args)
  }, seconds * 1000)
  if (!cb) return new  Promise((resolve) => cb = rexolve)
  return id
}
