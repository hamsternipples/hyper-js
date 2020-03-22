import { pick, compact, is_array, isEmpty, stringify, parseJSON } from '@hyper/utils'

export const pathVars = (path) => {
  let m = path.match(/\/:\w+/g)
  return m ? m.map((name) => name.substr(2)) : []
}

export const pathToRegExp = (path) => {
  return new RegExp(
    pathToRegExpString(path)
      .replace(/^\^(\\\/)?/, '^\\/?')
      .replace(/(\\\/)?\$$/, '\\/?$'),
    'i'
  )
}

export const pathToStrictRegExp = (path) => {
  return new RegExp(pathToRegExpString(path))
}

function pathToRegExpString (path) {
  return ('^' + path + '$')
    .replace(/\/:\w+(\([^)]+\))?/g, '(?:\/([^/]+)$1)')
    .replace(/\(\?:\/\(\[\^\/]\+\)\(/, '(?:/(')
    .replace(/\//g, '\\/')
}

export const parseHash = (hash, keys) => {
  try {
    var parsed = compact(parseJSON(decodeURIComponent(hash.substr(2))))

    return keys
      ? pick(parsed, keys)
      : parsed
  } catch (e) {
    return {}
  }
}

export const joinPaths = (...parts) => {
  return parts.join('/').replace(/\/+/g, '/')
}

export const parseUri = (uri) => {
  var parts = uri.match(/^(?:([\w+.-]+):\/\/([^/]+))?([^?#]*)?(\?[^#]*)?(#.*)?/)

  return {
    protocol: parts[1] || '',
    host: parts[2] || '',
    path: parts[3] || '',
    qs: parts[4] || '',
    hash: parts[5] || ''
  }
}

export const parseQS = (qs, keys) => {
  var index, parsed = {}, pairs, pair, k, v, c, i = 0

  if (~(index = qs.indexOf('?'))) {
    if ((pairs = qs.substr(index + 1).split('&')) && (c = pairs.length)) {
      for (; i < c; i++) {
        pair = pairs[i].split('=')
        k = decodeURIComponent(pair[0])
        v = decodeURIComponent(pair[1])
        if (k && v) {
          v = parseJSON(v)
          if (is_array(parsed[k])) {
            parsed[k].push(v)
          } else if (parsed[k] === undefined) {
            parsed[k] = v
          } else {
            parsed[k] = [parsed[k], v]
          }
        }
      }
    }
  }

  return keys
    ? pick(parsed, keys)
    : parsed
}

export const stringifyHash = (data) => {
  data = compact(data)

  return data.length
    ? '#!' + encodeURIComponent(stringify(data))
    : ''
}

export const stringifyQS = (data) => {
  var qs = ''

  for (var x in data) {
    if (data.hasOwnProperty(x) && !isEmpty(data[x])) {
      qs += '&' + encodeURIComponent(x) + '=' + encodeURIComponent(stringify(data[x]))
    }
  }

  return qs
    ? '?' + qs.substr(1)
    : ''
}
