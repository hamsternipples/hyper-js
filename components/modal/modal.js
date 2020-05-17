import { new_ctx, ctx_el } from '@hyper/dom/hyper-ctx'

import './modal.css'

export default function modal (G, opts = {}) {
  var frame = ctx_el(G = G.top)
  var close = () => {
    if (opts.close) opts.close()
    // rm both cleans and removes the element
    el.rm()
  }
  var el = new_ctx(G, (G) => {
    var {h, v, t} = G
    var background_closes_modal = !opts.no_background_close
    var no_close_button = opts.close_button != 1
    var title = v(opts.title || null) // null so that it gets a value. if it remains undefined, the obv won't init.
    var content = v(opts.content(G))
    var footer = v(opts.footer)

    var el =
    h('.modal-background', {
      extend: { content, footer, title, close },
      boink: (ev) => {
        return ev.target === el && background_closes_modal && close()
      },
      keydown: (ev) => {
        return ev.which === 27 && background_closes_modal && close()
      }
    },
      h('.modal',
        t(title, (title) => title ?
          h('h1.header', title,
            no_close_button ? null
              : {style: {paddingRight: '40px'}},
            no_close_button ? null
              : h('.modal-close', {boink: close}, h('i.close'))
          ) :
          h('.headerless',
            no_close_button ? null
              : h('.modal-close', {boink: close}, h('i.close'))
          )
        ),
        h('.modal-content', content),
        t(footer, (foot) => foot ?
          h('.modal-footer', footer) : null
        )
      )
    )

    return el
  })

  frame.aC(el)
  return el
}
