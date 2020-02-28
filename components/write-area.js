
import nl_elastic from '@hyper/decorators/nlElastic'
import { is_str, after } from '@hyper/utils'
import { prevent_default } from '@hyper/dom/dom-base'

import './write-area.less'

// @Improve: make it so that when pressing cmd/ctrl+enter, it sends the comment

export default function write_area (G, cb, placeholder) {
  var { h, v, t, c, z } = G
  var txt = v()
  var sending = v(0)
  var tip = v()
  var clear_tip = () => tip(null)
  var send_it = () => {
    if (TMP) console.log('send it!', txt())
    sending(1) // disable the textarea and button.
    cb(txt(), (err) => {
      sending(0) // enable both the textarea and the button
      var cls = err ? 'error' : 'success'

      tip(
        h('.tip.'+cls, {boink: clear_tip}, err
          ? is_str(err)
            ? str
            : 'unknown error'
          : (txt(''), 'sent successfully')
        )
      )

      after(3, clear_tip)

      textarea.c(cls, 1, 0.5)
    })

  }
  var textarea = h('textarea', {
    onkeydown: (e) => {
      if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') return send_it(), prevent_default(e)
    },
    onfocus: clear_tip,
    value: txt,
    disabled: sending,
    placeholder: placeholder || 'write your comment...',
  })

  z(nl_elastic(textarea))

  if (TMP) window.txt = txt, window.textarea = textarea

  return h('.write-area',
    textarea,
    tip,
    h('button.send', {
      disabled: sending,
      hidden: t(txt, txt => !txt),
      boink: send_it,
    }, t(sending, v => v ? 'sending...' : 'send'))
  )
}
