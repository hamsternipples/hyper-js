import { new_ctx, ctx_el } from '@hyper/dom/hyper-ctx'

import './modal.css'

export default function modal (G, opts = {}) {
  var frame = ctx_el(G = G.top)
  var close = () => {
    if (opts.close) opts.close()
    // rm both cleans and removes the element
    el.rm()
  }
  var el = new_ctx(G, function (G) {
    var {h, v, t} = G
    opts.title = v(opts.title || null) // null so that it gets a value. if it remains undefined, the obv won't init.
    opts.content = v(opts.content(G))
    opts.footer = v(opts.footer)
    var no_close_button = opts.close_button != 1

    var el =
    h('.modal-background', {
      boink: (ev) => {
        ev.target === el && !opts.no_background_close && close()
      },
      keydown: (ev) => {
        ev.which === 27 && !opts.no_background_close && close()
      }
    },
      h('.modal',
        t(opts.title, (title) => title ?
          h('h1.header', opts.title,
            no_close_button ? null : {style: {paddingRight: '40px'}},
            no_close_button ? null :
              h('.modal-close', {boink: close}, h('i.close'))
          ) :
          h('.headerless',
            no_close_button ? null :
              h('.modal-close', {boink: close}, h('i.close'))
          )
        ),
        h('.modal-content', opts.content),
        t(opts.footer, (foot) => foot ?
          h('.modal-footer', opts.footer) : null
        )
      )
    )

    return el
  })

  el.close = close
  frame.aC(el)
  return el
}