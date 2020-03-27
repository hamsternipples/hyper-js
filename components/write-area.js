// @Temporary: move this out to @hyper/components/expanding-text

import nl_elastic from '@hyper/decorators/nlElastic'
import { is_str, is_obj, after, next_tick, error } from '@hyper/utils'
import { prevent_default } from '@hyper/dom-base'

import './write-area.less'

// export default const write_area = () => (G, opts, cb) {
  // var { h, v, t, c, z, L } = G
const write_area = ({h, v, t, c, z, L, $L}, lang) => (opts, cb) => {
  $L(lang) // init the language
  if (DEBUG && !is_obj(opts)) error('invalid options')
  // L
  // 1. if it receives an object, that is its primary language translation
  // 2. if it gets text, it first grabs the translation (if any) out of its primary dictionary
  //    then, if you have a different language set in your session, it takes that text and asks

  var txt = v()
  var sending = v(0)
  var tip = v()
  var clear_tip = () => tip(null)
  var send_it = () => {
    if (TMP) console.log('send it!', txt())
    sending(1) // disable the textarea and button.
    cb(txt(), (err, success) => {
      sending(0) // enable both the textarea and the button
      var cls = err ? 'error' : 'success'

      if (success || success == null) tip(
        h('.tip.'+cls, {boink: clear_tip}, err
          ? is_str(err)
            ? str
            : L('unknown error')
          : (txt(''), L(is_str(success) ? success : 'sent successfully'))
        )
      )

      after(3, clear_tip)
      textarea.c(cls, 1, 0.5) // set class to cls, then undo it after 0.5s. just make it flash a moment
    })
  }

  var textarea = h('textarea', {
    // ...opts,
    keydown: (e) => {
      if ((e.ctrlKey || e.shiftKey) && e.which === 13) {
        send_it()
        prevent_default(e)
      }
    },
    onfocus: clear_tip,
    decorators: nl_elastic,
    value: txt,
    disabled: sending,
    placeholder: L('write your comment...'),
  })

  if (TMP) window.txt = txt, window.textarea = textarea


  var write_area
  return write_area = h('.write-area', opts,
    textarea,
    tip,
    h('button.send', {
      disabled: sending,
      hidden: t(txt, txt => !txt),
      boink: send_it,
      send: send_it,
    }, t(sending, v => v
      ? L('sending...')
      : L('send')
    ))
  )
}

export default write_area
