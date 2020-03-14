import debounce from './lodash/debounce'
import { after } from '@hyper/utils'
import { win, body, on, off, bounding_rect } from '@hyper/dom-base'

// !!! this most likely breaks something !!!
// please review...

export default function onScroll (el, percent_or_px, handler) {
  let _el = el && el.scrollHeight ? el : win
  let body = el && el.scrollHeight ? el : body
  let throttled = debounce(_onScroll, 100, {leading: true, trailing: true, maxWait: 200})
  // let throttled = () => { console.log('scroll?'); _throttled.apply(this, arguments) }
  let timeout

  on(_el, 'scroll', throttled)
  let obj = {
    cancel () {
      off(_el, 'scroll', throttled)
    }
  }
  after(1, () => {
    if (timeout) clearTimeout(timeout)
    throttled()
  })

  return obj

  function _onScroll (e) {
    if (obj.working) return timeout ? null : timeout = after(0.01, throttled)
    let rect = bounding_rect(body)
    let bottom_px = win.pageYOffset + win.innerHeight

    if ((percent_or_px < 1 && (rect.height * percent_or_px) < bottom_px) || (rect.height - percent_or_px) < bottom_px) {
      obj.working = true
      handler(function () {
        after(0.01, throttled)
        obj.working = false
      })
    }
  }
}
