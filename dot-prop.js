// knicked from: https://github.com/jquense/expr
// inspired by: https://github.com/sindresorhus/dot-prop
// Based on Kendo UI Core expression code <https://github.com/telerik/kendo-ui-core#license-information>

import { is_str, is_array, not_nil, new_array } from '@hyper/global'

const Cache = (max_size) => {
  var size = 0, values = {}
  const clear = () => {
    size = 0
    values = {}
  }

  return {
    clear,
    get: (key) => values[key],
    set: (key, value) => {
      size >= max_size && clear()
      not_nil(values[key]) && size++
      return values[key] = value
    }
  }
}


const SPLIT_REGEX = /[^.^\]^[]+|(?=\[\]|\.\.)/g
const DIGIT_REGEX = /^\d+$/
const LEAD_DIGIT_REGEX = /^\d/
const SPEC_CHAR_REGEX = /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g
const CLEAN_QUOTES_REGEX = /^\s*(['"]?)(.*?)(\1)\s*$/
const MAX_CACHE_SIZE = 512

const pathCache = Cache(MAX_CACHE_SIZE)
const setCache = Cache(MAX_CACHE_SIZE)
const getCache = Cache(MAX_CACHE_SIZE)

export const getter_no_fn = (path, safe) => {
  let parts = normalizePath(path)
  return function (data) {
    return getterFallback(parts, safe, data)
  }
}

export const getter_fn = (path, safe, data = 'data') => {
  let key = path + '_' + safe
  return getCache.get(key) || getCache.set(
      key,
      new Function(data, 'return ' + expr(path, data, safe))
  )
}

export const getter = (path, safe) => {
  let chunks = path.split('[]').map((chunk, idx) => {
    return getter_fn(idx === 0 ? chunk : chunk.slice(1), safe)
  })

  return (obj) => {
    let res = chunks[0](obj)
    let idx = 1
    while (chunks[idx] && is_array(res)) {
      res = Array.prototype.concat.apply([], res.map(chunks[idx]))
      idx += 1
    }
    return res
  }
}

export const getterCSP = (path, safe) => {
  let chunks = path.split('[]').map((chunk, idx) => {
    return getter_no_fn(idx === 0 ? chunk : chunk.slice(1), safe)
  })
  return (obj) => {
    let res = chunks[0](obj)
    let idx = 1
    while (chunks[idx] && is_array(res)) {
      res = Array.prototype.concat.apply([], res.map(chunks[idx]))
      idx += 1
    }
    return res
  }
}

export const setterCSP = (path) => {
  let parts = normalizePath(path)
  return (data, value) => setterFallback(parts, data, value)
}

export const setter = (path) => {
  return setCache.get(path) || setCache.set(
      path,
      new Function(
        'data, value',
        expr(path) + ' = value'
      )
  )
}

export const get = (obj, path, default_value) => {
  let value = getter(path, true)(obj)
  return value === undefined ? default_value : value
}

export const set = (obj, path, value) => {
  return setter(path, true)(obj, value)
}

export const join = (segments) => {
  return segments.reduce((path, part) => (
    path +
    (isQuoted(part) || DIGIT_REGEX.test(part)
      ? '[' + part + ']'
      : (path ? '.' : '') + part
    )
  ), '')
}

export const forEach = (path, cb, thisArg) => {
  each(split(path), cb, thisArg)
}

function setterFallback (parts, data, value) {
  let index = 0
  let len = parts.length
  while (index < len - 1) data = data[parts[index++]]
  data[parts[index]] = value
}

function getterFallback (parts, safe, data) {
  let index = 0
  let len = parts.length
  while (index < len) {
    if (data != null || !safe) {
      data = data[parts[index++]]
    } else {
      return
    }
  }
  return data
}

export const normalizePath = (path) => {
  return pathCache.get(path)
    || pathCache
      .set(path, split(path)
        .map((part) => part.replace(CLEAN_QUOTES_REGEX, '$2'))
  )
}

export const split = (path) => {
  return path.match(SPLIT_REGEX) || []
}

export const expr = (expression = '', param = 'data', safe = false) => {
  if (expression && expression.charAt(0) !== '[') expression = '.' + expression

  return safe ? makeSafe(expression, param) : param + expression
}

function each (parts, iter, thisArg) {
  var idx = 0, len = parts.length, part

  for (; idx < len; idx++) {
    part = parts[idx]

    if (part) {
      if (shouldBeQuoted(part)) {
        part = '"' + part + '"'
      }

      var isBracket = isQuoted(part)
      var isArray = !isBracket && /^\d+$/.test(part)

      iter.call(thisArg, part, isBracket, isArray, idx, len - 1)
    }
  }
}

function isQuoted (str) {
  return (
    is_str(str) && ~["'", '"'].indexOf(str[0])
  )
}

function makeSafe (path, param) {
  var result = param
  var parts = split(path)

  each(parts, (part, isBracket, isArray, idx, last) => {
    part = isBracket || isArray ? '[' + part + ']' : '.' + part
    result += part + (idx === last ? ')' : ' || {})')
  })

  return new_array(parts.length + 1).join('(') + result
}

function shouldBeQuoted (part) {
  return !isQuoted(part) && (
    (part.match(LEAD_DIGIT_REGEX) && !part.match(DIGIT_REGEX))
    || SPEC_CHAR_REGEX.test(part)
  )
}
