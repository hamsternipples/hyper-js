
import { is_fn } from '@hyper/global'
import { after, next_tick } from '@hyper/utils'
import { new_ctx, ctx_el } from '@hyper/dom/hyper-ctx'
import eases from '@hyper/eases'

import './whammy.css'

export default (G, msg, seconds = 2, ease = 'fast', animation = 'whammy') => {
  var {h} = G
  var el = h('.whammy', {
    style: { animation: `${animation} ${seconds}s ${eases[ease] || ease} 1 normal forwards` }
  }, is_fn(msg) ? msg(G) : msg)

  ctx_el(G.top).aC(el)

  if (seconds) after(seconds, () => {
    el.style.opacity = 0
    after(1, () => el.rm()) // max 1s fade out :) this isn't the 90's
  })

  return el
}
