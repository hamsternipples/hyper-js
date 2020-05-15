import { bounding_rect } from '@hyper/dom-base'
import { next_tick } from '@hyper/utils'
import { new_ctx, ctx_el } from '@hyper/dom/hyper-ctx'
import { obv_toggle_fn } from '@hyper/dom/observable'
import ctx_boink from '@hyper/dom/ctx_boink'

import './edit-menu.less'

const render_edit_menu = (G, items) => {
  var { h, s, m, v, z } = G
  var show_menu_obv
  var edit_menu_el
  const show_menu = () => {
    if (!edit_menu_el) {
      show_menu_obv = v(1)
      var s = {}
      var width = G.o.width()
      var height = G.o.height()
      var rect = bounding_rect(edit_el)

      if (rect.x < (width / 2)) {
        // opens to the right
        s.left = rect.x + rect.width
      } else {
        // opens to the left
        s.right = rect.x
      }

      if (rect.y < (height / 2)) {
        // opens downward
        s.top = rect.y
      } else {
        // opens upward
        s.bottom = height - rect.bottom
      }

      z(() => edit_menu_el.rm())
      ctx_el(G.top).aC(
        edit_menu_el =
        h('ul.edit-menu', {visible: show_menu_obv, s},
          items.map(([inner, boink, opts = {}]) => {
            return h('li', {...opts, boink: m(show_menu_obv, () => {
              return boink() || false
            })}, inner)
          })
        )
      )
      // when clicking anywhere in the top context, close the menu.
      next_tick(() => {
        ctx_boink(G.top)([edit_el, edit_menu_el], (ev) => {
          show_menu_obv(0)
          return true
        })
      })
    } else {
      obv_toggle_fn(show_menu_obv)()
    }
  }
  var edit_el = h('.edit-button', {boink: show_menu},
    // knicked from youtube
    s('svg', {viewBox: '0 0 24 24', width: 24},
      s('g',
        s('path', {d: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'})
      )
    ),
  )

  return h('.relative-container', edit_el)
}

export default render_edit_menu
