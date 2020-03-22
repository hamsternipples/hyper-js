import { noop } from '@hyper/utils'

/**
 * Helpers
 */
const escapeTest = /[&<>"']/
const escapeReplace = /[&<>"']/g
const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/
const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g
const escapeReplacements = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}
const getEscapeReplacement = (ch) => escapeReplacements[ch]
export const escape = (html, encode) => {
  return escapeTestNoEncode.test(html)
    ? html.replace(escapeReplaceNoEncode, getEscapeReplacement)
    : html
}

const unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig

export const unescape = (html) => {
  // explicitly match decimal, hex, and named HTML entities
  return html.replace(unescapeTest, (_, n) => {
    n = n.toLowerCase()
    if (n === 'colon') return ':'
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1))
    }
    return ''
  })
}


const caret = /(^|[^\[])\^/g
export const edit = (regex, opt) => {
  regex = regex.source || regex
  opt = opt || ''
  const obj = {
    replace: (name, val) => {
      val = val.source || val
      val = val.replace(caret, '$1')
      regex = regex.replace(name, val)
      return obj
    },
    getRegex: () => {
      return new RegExp(regex, opt)
    }
  }
  return obj
}

const nonWordAndColonTest = /[^\w:]/g
const originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i
export const cleanUrl = (base, href) => {
  if (base && !originIndependentUrl.test(href)) {
    href = resolveUrl(base, href)
  }
  try {
    href = encodeURI(href).replace(/%25/g, '%')
  } catch (e) {
    return null
  }
  return href
}

const baseUrls = {}
const justDomain = /^[^:]+:\/*[^/]*$/
const protocol = /^([^:]+:)[\s\S]*$/
const domain = /^([^:]+:\/*[^/]*)[\s\S]*$/

export const resolveUrl = (base, href) => {
  if (!baseUrls[' ' + base]) {
    // we can ignore everything in base after the last slash of its path component,
    // but we might need to add _that_
    // https://tools.ietf.org/html/rfc3986#section-3
    if (justDomain.test(base)) {
      baseUrls[' ' + base] = base + '/'
    } else {
      baseUrls[' ' + base] = rtrim(base, '/', true)
    }
  }
  base = baseUrls[' ' + base]
  const relativeBase = base.indexOf(':') === -1

  if (href.substring(0, 2) === '//') {
    if (relativeBase) {
      return href
    }
    return base.replace(protocol, '$1') + href
  } else if (href.charAt(0) === '/') {
    if (relativeBase) {
      return href
    }
    return base.replace(domain, '$1') + href
  } else {
    return base + href
  }
}

export const noopTest = { exec: function noopTest () {} }

// export const merge = (obj) => {
//   let i = 1,
//     target,
//     key
//
//   for (; i < arguments.length; i++) {
//     target = arguments[i]
//     for (key in target) {
//       if (Object.prototype.hasOwnProperty.call(target, key)) {
//         obj[key] = target[key]
//       }
//     }
//   }
//
//   return obj
// }

// Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
// /c*$/ is vulnerable to REDOS.
// invert: Remove suffix of non-c chars instead. Default falsey.
export const rtrim = (str, c, invert) => {
  const l = str.length
  if (l === 0) {
    return ''
  }

  // Length of suffix matching the invert condition.
  let suffLen = 0

  // Step left until we fail to match the invert condition.
  while (suffLen < l) {
    const currChar = str.charAt(l - suffLen - 1)
    if (currChar === c && !invert) {
      suffLen++
    } else if (currChar !== c && invert) {
      suffLen++
    } else {
      break
    }
  }

  return str.substr(0, l - suffLen)
}

export const findClosingBracket = (str, b) => {
  if (str.indexOf(b[1]) === -1) {
    return -1
  }
  const l = str.length
  let level = 0,
    i = 0
  for (; i < l; i++) {
    if (str[i] === '\\') {
      i++
    } else if (str[i] === b[0]) {
      level++
    } else if (str[i] === b[1]) {
      level--
      if (level < 0) {
        return i
      }
    }
  }
  return -1
}

// function to unescape text such as: \[notalink\]\(neither this\) -> [notalink](neither this)
export const unescapes = (text) => {
  return text ? text.replace(/\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g, '$1') : text
}
