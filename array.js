
import { new_array, is_array, slice } from '@hyper/global'
export { new_array, is_array, slice }


// micro-optimization: http://jsperf.com/for-vs-foreach/292
export const each = (arr, fn, _this = arr, i) => {
  for (i = 0; i < arr.length; ++i) fn.call(_this, arr[i], i)
}

export const each_reverse = (arr, fn, _this = arr, i) => {
  for (i = arr.length - 1; i >= 0; i--) fn.call(_this, arr[i], i)
}

export const call_each = (arr, _this = arr, i) => {
  for (i = 0; i < arr.length; ++i) arr[i].call(_this)
}

export const every = (obj, fn, _this = obj, k) => {
  for (k in obj) fn.call(_this, obj[k], k)
}

export const reverse_props = (obj, k, ret = {}) => {
  every(obj, (val, k) => ret[val] = k)
  return ret
}

export const concat = (arr1, arr2) => {
  var l1 = arr1.length
  var l2 = arr2.length
  var res = empty_array(l1 + l2)
  var i = 0, i2 = 0
  for (; i < l1; i++) res[i] = arr1[i]
  for (; i2 < l2; i2++) res[i + i2] = arr2[i2]
  return res
}

export const empty_array = (n = 0, init_value = 0, _arr) => {
  _arr = new_array(n)
  while (n-- > 0) _arr[n] = typeof init_value === 'function' ? init_value(n) : init_value
  return _arr
}

export const array_idx = (len, idx) => idx < 0 ? len + idx : idx

// similar to lodash.compact.
// however, it does the compaction inline on the same array by resizing it.
// also only removes null/undefined values, instead of all falsey values.
export const compact = (array) => {
  var i = -1
  var len = array.length
  var idx = -1
  var value
  while (++i < len) {
    value = array[i]
    if (value != null) {
      if (i !== ++idx) array[idx] = value
    }
  }
  array.length = idx + 1
  return array
}

// removes (using splice) by strict-comparison all of `value` (default: null) from an array
export const remove_every = (array, value = null) => {
  var i = -1
  var len = array.length
  var to_remove = 0
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
export const flatten = (array) => {
  let res = []
  for (let v of array) is_array(v) ? res.push(...v) : res.push(v)
  return res
}

export const ensure_array = (value) => {
  return is_array(value) ? value : [value]
}

// unique array values using Set.
export const uniq = (array) => {
  return Array.from(new Set(array).values())
}
