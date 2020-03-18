
import { is_obv, error, is_str } from '@hyper/utils'

// import marked from '@hyper/marked/marked'
import Lexer from '@hyper/marked/Lexer'
import Parser from '@hyper/marked/Parser'

import './hyper-markdown.less'

// another (broken) version is based off of umarkdown. it aims to be smaller, but have less features. marked was chosen to be adapted because of its full support for gh-flavoured markedown.

export default function markdown (G) {
  let { h, t, N } = G
  let parser = new Parser(G)
  // @Incomplete: this could become an async function to allow for plugins like code formatting to perform their operations async
  let render = (txt) => parser(Lexer(txt.trim()))
  // @Incomplete: loose list item formatting is broken. here is an example:
  /*
  - [ ] first
  - [x] second
  lala <- this sets it to 'loose' and everything becomes a paragraph
  - [ ] third
  */
  return function render_md (txt) {
    return N(G, () => {
      return h('.markdown', is_obv(txt)
        ? t(txt, render)
        : render(txt)
      )
    })
  }
}
