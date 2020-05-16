import { mergeDeep, objJSON, extend, next_tick } from '@hyper/utils'
import { define_prop, error } from '@hyper/utils' // @Temporary: for deprecations
import { is_fn, is_str, is_obj } from '@hyper/utils'
import { random_id } from '@hyper/random'

import { value } from '@hyper/dom/observable'
import obj_value from '@hyper/obv/obj_value'
import ResizeSensor from '@hyper/dom/resize-sensor'

// @Encapsusation: the plugin should make its own h context instaed of using the global one.
import { h } from '@hyper/dom/hyper-hermes'
import { doc, body, win, base_path } from '@hyper/dom-base'
import { dom_loaded, isNode, getElementById } from '@hyper/dom-base'
import { new_ctx, el_ctx, global_ctx } from '@hyper/dom/hyper-ctx'
import { raf } from '@hyper/global'



function pluginBoilerplate (frame, parentNode, _config, _data, DEFAULT_CONFIG, _onload, _afterload) {
  var tmp, id, G, ctx, E, width, height, _dpr, args
  var C = mergeDeep({}, objJSON(_config), DEFAULT_CONFIG)

  // if a string is provided for the frame, try and find the frame by id, else make a fixud position full-size frame
  id = is_str(frame)
    ? ((tmp = getElementById(frame)) && tmp.id) || frame
    : random_id()

  tmp = {
    s: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      // width: '100%',
      // height: '100%',
      overflow: 'hidden'
    }
  }

  // this allows for custom listeners and/or styles to be added to the generated parentNode
  if (is_obj(parentNode) && !isNode(parentNode)) tmp = mergeDeep(tmp, parentNode)

  G = global_ctx()
  // frame = isNode(frame) ? frame : h('div#'+id, tmp)
  frame = new_ctx(G, (_ctx) => {
    ctx = _ctx.top = _ctx // save the plugin frame's context

    // don't need to use the new_ctx's h to make the element, cause it doesn't have any properties that need to be cleaned up.. slightly hacky.
    return isNode(frame) ? frame : G.h('div#'+id, tmp)
  })

  if (!isNode(parentNode)) parentNode = body
  parentNode.aC(frame, G.X)

  frame._G = G
  if (DEBUG) win.GG = G
  ctx.E = E = { body: doc.body, win: win }
  if (DEBUG) define_prop(E, 'frame', {get: () => error('deprecated. use `frame = el_ctx(G)` now')})

  // @Incomplete - device orientation
  // https://crosswalk-project.org/documentation/tutorials/screens.html
  // https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Managing_screen_orientation
  tmp = screen.orientation
  G.o.orientation = value(tmp.type.split('-').concat(tmp.angle))
  tmp.onchange = (e) => { G.o.orientation((tmp = e.target).type.split('-').concat(tmp.angle)) }

  // TODO: add device motion events
  // https://developers.google.com/web/fundamentals/native-hardware/device-orientation/

  // width, height & resize put on the frame ctx, because the frame can be smaller than the global context's width/height
  ctx.o.width = value(width = frame.clientWidth || C.width || 300)
  ctx.o.height = value(height = frame.clientHeight || C.height || 300)
  ctx.o.resize = obj_value({width, height})

  if ((_dpr = Math.round(win.devicePixelRatio || 1)) > 4) _dpr = 4
  G.o.dpr = value(_dpr)

  frame._id = id

  ;(function (_cleanup) {
    frame.cleanup = () => {
      parentNode = frame.p
      if (parentNode) parentNode.rC(frame)
      if (is_fn(_cleanup)) _cleanup()
    }
  })(frame.cleanup)

  G.Z(frame.cleanup)

  // DEPRECATED!! - I don't like this at all!!
  // we're going to go with a new way of setting and getting
  // all initialised data are put in the D object, the D object will be  able to be cloned/serialised
  // these are the conditions (which are essentially the starting conditions)
  // they can either be values, objects (w/ sub-values), or obvs
  // after init, the only other time conditions are chaged, is if inst.reset({cond: 'new value'})
  // and then the template will be reset (remade) with the new condition's value
  // however, if reset({cond: my_obv}) is called with an observable, then the observable is used directly.
  // this is by design, because then that allows two different temcplates to use the same data structure
  //
  // if (!(set_config = frame.set_config)) {
  //   set_config = frame.set_config = value(C)
  //   set_config((C) => {
  //     var k, v, o
  //     console.log('setting config:', C)
  //     for (k in C) {
  //       v = C[k]
  //       if (typeof (o = G[k]) === 'undefined') {
  //         G[k] = value(v)
  //       } else {
  //         o(v)
  //       }
  //     }
  //   })
  // }

  // extend(ctx, { C, E })

  // next thing is, `onload` should operate exactly the same as `reload`
  // it's just the function that is called which will return a working vdom.
  // the only difference between onload and reload is that cleanup is supposed to have been called between the two.

  ;(function (onload) {
    function loader () {
      var e, i = 0, resize
      var once_loaded = (e) => {
        frame.aC(e)
        if (is_fn(_afterload)) _afterload(frame, e)
      }

      frame.empty()

      if (is_fn(onload)) {
        if (e = new_ctx(ctx, onload)) {
          if (e.then) e.then(once_loaded)
          else once_loaded(e)
        }
      }

      raf(() => {
        resize = new ResizeSensor(frame, () => {
          width = frame.clientWidth
          height = frame.clientHeight
          raf(() => {
            ctx.o.width(width)
            ctx.o.height(height)
            ctx.o.resize({width, height})
          })
        })

        G.Z(() => resize.detach())
      })
    }

    dom_loaded(loader)
  })(_onload)

  return args
}

// re-exported
export { doc, body, win }
export { pluginBoilerplate }
export default pluginBoilerplate
