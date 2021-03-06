/**
 * TextRenderer
 * returns only the textual part of the token
 */

export default class TextRenderer {
  // no need for block level renderers
  strong (text) {
    return text
  }

  em (text) {
    return text
  }

  codespan (text) {
    return text
  }

  del (text) {
    return text
  }

  text (text) {
    return text
  }

  link (href, title, text) {
    return '' + text
  }

  image (href, title, text) {
    return '' + text
  }

  br () {
    return ''
  }
}
