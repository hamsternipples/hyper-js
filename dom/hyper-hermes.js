// hyper-hermes
// knicked from https://github.com/dominictarr/hyperscript
// many modifications...
// also took some inspiration from https://github.com/Raynos/mercury

// ctx shortcut guide:
// `ctx.x()`: call this to cleanup by calling all the `cleanupFuncs`
// `ctx.X`: array of all the functions to call on cleanup
// Z(fn): `cleanupFuncs.push(fn)` - add a function to the list

// Node shortcut guide:
// `node.aC(el, cleanupFuncs)`: append a child to `node`
// `node.iB(el, before_node, cleanupFuncs)`: insert `el` into `node` before `before_node`
// `node.rC(el)`: remove child `el` from `node`

import { is_obv } from './observable'
import { observe_event, add_event } from './observable-event'
import { define_prop, kind_of, array_idx, define_value, error } from '@hyper/utils'
import { each, call_each, every } from '@hyper/utils'
import { after, next_tick } from '@hyper/utils'
import { define_props, define_getter } from '@hyper/utils'
import { is_bool, is_num, is_str, is_fn, is_obj, is_array } from '@hyper/utils'
import { random_id } from '@hyper/random'

import { win, doc, customElements } from '@hyper/global'
import { isNode, txt, comment, cE } from '@hyper/dom-base'
import { lookup_parent_with_attr } from '@hyper/dom-base'
// import { set_style } from '@hyper/dom/style'
import { Node_prototype } from '@hyper/dom-base'

// add your own (or utilise this to make your code smaller!)
export let short_attrs = {
  s: 'style',
  c: 'class',
  class: 'className',
  for: 'htmlFor',
  html: 'innerHTML'
}
// however, when using setAttribute, these need to be reversed
// export let short_attrs_rev = { style: 's', className: 'class', htmlFor: 'for', innerHTML: 'html' }
export let short_attrs_rev = ((obj, k, ret = {}) => {
  every(obj, (val, k) => ret[val] = k)
  return ret
})(short_attrs)

// common_tags can be used to save bytes:
// h(1,{value:11})
//     vs.
// h('input',{value:11})
// when common_tags = ['div','input']
//
// however, it's less efficient if either a class or id has to be specified:
// h(0,{c:'lala'})
//     vs.
// h('div.lala')
//
// this does not currently work (but it could):
// h('0.lala')
//     vs.
// h('div.lala')
//
// however this does:
// h(2)
// when common_tags = ['div','input','div.lala']
export var common_tags = ['div']

function hyper_hermes (create_element) {
  var cleanupFuncs = []
  var cleanup = () => { call_each(cleanupFuncs) }
  var add_to_cleanupFuncs = (fn) => {
    cleanupFuncs.push(
      DEBUG && !is_fn(fn)
      ? error('adding a non-function value to cleanupFuncs')
      : fn
    )
    return fn
  }

  if (DEBUG) {
    var push_fn = cleanupFuncs.push
    cleanupFuncs.push = (fn, ...args) => {
      if (typeof fn !== 'function') debugger
      if (args.length) debugger
      push_fn.call(cleanupFuncs, fn, ...args)
    }
  }

  function h(...args) {
    let e
    function item (l) {
      let r, s, i, o, k
      function parse_selector (string) {
        r = string.split(/([\.#]?[a-zA-Z0-9_:-]+)/)
        if (/^\.|#/.test(r[1])) e = create_element('div')
        each(r, (v) => {
          if (v && (i = v.length)) {
            if (!e) {
              e = create_element(v, args)
            } else {
              if ((k = v[0]) === '.' || k === '#') {
                if (s = v.slice(1, i)) {
                  if (k === '.') e.classList.add(s)
                  else e.id = s
                }
              }
            }
          }
        })
      }

      if (!e && is_num(l) && l < common_tags.length)
        // we overwrite 'l', so it does not try and add a text node of its number to the element
        l = parse_selector(common_tags[l])

      if (l != null)
      if (is_str(l)) {
        if (!e) {
          parse_selector(l)
        } else {
          e.aC(txt(l, cleanupFuncs))
        }
      } else if (
        is_num(l)
        || is_bool(l)
        || l instanceof Date
        || l instanceof RegExp
      ) {
        var str = txt(l.toString())
        e.aC(str, cleanupFuncs)
      } else if (
        is_array(l)
        || isNode(l)
        || l instanceof win.Text
      ) {
        e.aC(l, cleanupFuncs)
      } else if (is_obj(l)) {
        // is a promise
        if (is_fn(l.then)) {
          e.aC(r = comment(DEBUG ? '1:promise-value' : 1))
          l.then((v) => {
            let node = make_child_node(e, v, cleanupFuncs)
            if (DEBUG && r.p !== e) error('promise unable to insert itself into the dom because parentNode has changed')
            else e.rC(node, r), add_to_cleanupFuncs(() => node.rm())
          })
        } else for (k in l) set_attr(e, k, l[k], cleanupFuncs)
      } else if (is_fn(l)) {
        make_obv_child_node(e, l, cleanupFuncs)
      } else if (DEBUG) {
        error('unknown/unsupported item being appended to element')
      }
    }

    while (args.length) {
      item(args.shift())
    }

    return e
  }

  h.x = cleanupFuncs
  h.Z = cleanupFuncs.Z = add_to_cleanupFuncs
  h.X = h.cleanup = cleanup

  return h
}

// these two probably need to be moved to dom-base
// instead of saving them into a set, we just lookup_parent_with_attr(e, 'roadtrip')
// export let roadtrips = new Set
// this is so that custom attributes can be used to define custom behaviour
export let custom_attrs = {
  decorators: (cleanupFuncs, e, fn) => {
    if (is_array(fn)) each(fn, decorator => cleanupFuncs.Z(decorator(e)))
    else cleanupFuncs.Z(fn(e))
  },
  boink: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {boink: fn}) },
  press: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {press: fn}) },
  hover: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {hover: fn}) },
  focused: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {focus: fn}) },
  selected: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {select: fn}) },
  checked: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {select: fn}) }, // duplicate of selected
  input: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {input: fn}) },
  value: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {input: fn}) }, // duplicate of input
  disabled: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {disabled: fn}) },
  hidden: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {hidden: fn}) },
  visible: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {visible: fn}) },
  go: (cleanupFuncs, e, url, roadtrip) => {
    // call on next_tick, to make sure the element is added to the dom.
    next_tick(() => {
      // set the event handler:
      observe_event(cleanupFuncs, e, {boink: () => {
        if (!roadtrip) {
          // look upward to see if one of the container elements has a roadtrip in it
          roadtrip = lookup_parent_with_attr(e, 'roadtrip')
          if (DEBUG && !roadtrip) {
            console.info('element:', e)
            error(`using 'go' attr when no roadtrip is defined for a parent element`)
          } else {
            roadtrip = roadtrip.roadtrip
          }
        }

        roadtrip.goto(is_fn(url) ? url() : url)
      }})
    })
  }
}

export const set_attr = (e, key_, v, cleanupFuncs = e.X) => {
  if (DEBUG) assert_cleanupFuncs(cleanupFuncs)
  // convert short attributes to long versions. s -> style, c -> className
  var s, o, i, k = short_attrs[key_] || key_
  if (is_fn(v)) {
    next_tick(() => {
      if (is_fn(o = custom_attrs[k])) {
        o(cleanupFuncs, e, v)
      } else if (is_obv(v)) {
        // setAttribute was used here, primarily for svg support.
        // we may need to make a second version or something which works well with svg, perhaps instead using setAttributeNode
        // however, as mentioned in this article it may be desirable to use property access instead
        // https://stackoverflow.com/questions/22151560/what-is-happening-behind-setattribute-vs-attribute
        // observable (write-only) value
        cleanupFuncs.Z(v.call(e, (v) => {
          set_attr(e, k, v, cleanupFuncs)
        }, 1)) // 1 = do_immediately
        s = e.nodeName
        if (s === 'INPUT') observe_event(cleanupFuncs, e, {input: v})
        if (s === 'SELECT') observe_event(cleanupFuncs, e, k === 'label' ? {select_label: v} : {select: v})
        if (s === 'TEXTAREA') observe_event(cleanupFuncs, e, {value: v})
      } else {
        // normal function. listen to the event
        if (k.substr(0, 2) === 'on') {
          // passive listener by default
          // eg. onkeyup: (ev) => ev.preventDefault() // <-- *NOT* ok.
          add_event(cleanupFuncs, e, k.substr(2), v, false)
        } else if (k.substr(0, 6) === 'before') {
          // passive + capture
          // @Incomplete: I don't really have a use-case for this, but I imagine that one would want to preventDefault, if capturing the event. I don't know, so for now it's passive
          // eg. beforekeyup: (ev) => ev.preventDefault() // <-- *NOT* ok.
          add_event(cleanupFuncs, e, k.substr(6), v, true)
        } else {
          // non-passive (used to do things like prevent keys)
          // eg. keyup: (ev) => ev.preventDefault() // <-- this is ok.
          add_event(cleanupFuncs, e, k, v, null)
        }
      }
    })
  } else {
    if (k === 'assign' || k === 'extend') {
      // for(s in v) e[s] = v[s]
      Object.assign(e, v)
    } else if (k === 'data') {
      if (is_obj(v))
        for(s in v) e.dataset[s] = v[s]
      else if (DEBUG) error('data property should be passed as an object')
    } else if (k === 'multiple') {
      e.multiple = !!v
    } else if (k === 'contenteditable') {
      e.contentEditable = !!v
    } else if (k === 'autofocus') {
      after(0.01, () => e.focus())
    } else if (k === 'autoselect') {
      after(0.01, () => {
        e.focus()
        o = [v[0] || 0, v[1] || -1]
        e.setSelectionRange.apply(e, range)
      })
    } else if (k === 'selected') {
      e.defaultSelected = e.selected = !!v
    } else if (k === 'checked') {
      e.defaultChecked = e.checked = !!v
    } else if (k === 'value') {
      e.defaultValue = e.value = v
    } else if (k === 'htmlFor') {
      e[k] = isNode(v) ? (v.id || (v.id = random_id()))
        : DEBUG && !is_str(v) ? error('invalid element or id for label')
        : v
    } else if (k === 'class') {
      if (v) {
        o = e.classList
        if (is_array(v)) each(v, s => s && o.add(s))
        else if (is_obj(v))
          every(v, (val, s) => {
            is_obv(val)
            ? cleanupFuncs.Z(val((v) => o.toggle(s, v), 1))
            : o.toggle(s, val)
          })
        else o.add(v)
      }
    } else if ((i  = (k === 'on')) || k === 'before') {
      // 'before' is used to denote the capture phase of event propagation
      // see: http://stackoverflow.com/a/10654134 to understand the capture / bubble phases
      // before: {click: (do) => something}
      if (is_obj(v)) {
        for (s in v)
          if (is_fn(o = v[s]))
            add_event(cleanupFuncs, e, s, o, i ? false : true)
          else if (DEBUG) error('unknown event listener')
      }
    } else if (k === 'html') {
      e.innerHTML = v
    } else if (k === 'observe') {
      // I believe the set-timeout here is to allow the element time to be added to the dom.
      // it is likely that this is undesirable most of the time (because it can create a sense of a value 'popping' into the dom)
      // so, likely I'll want to move the whole thing out to a function which is called sometimes w/ set-timeout and sometimes not.
      next_tick(() => observe_event(cleanupFuncs, e, v))
    } else if (k === 'style') {
      if (is_str(v)) {
        e.style.cssText = v
      } else {
        set_style(e, v, cleanupFuncs)
      }
    } else if (~k.indexOf('-')) {
      // in weird cases with stuff like data- or other attrs containing hyphens, use setAttribute
      e.setAttribute(k, v)
    } else if (v !== undefined) {
      if (is_array(v)) {
       // not sure if this will cause problems. I can't think of any other reason to pass an array of values, unless there are multiple listeners or decorators or something. leaving it for now..
       for (i = 0; i < v.length; i++) {
         set_attr(e, k, v[i], cleanupFuncs)
       }
     } else if (is_fn(o = custom_attrs[k])) {
        o(cleanupFuncs, e, v)
      } else if (~(i = k.indexOf(':'))) {
        // for namespaced attributes, such as xlink:href
        // (I'm really not aware of any others than xlink... PRs accepted!)
        // ref: http://stackoverflow.com/questions/7379319/how-to-use-creatensresolver-with-lookupnamespaceuri-directly
        // ref: https://developer.mozilla.org/en-US/docs/Web/API/Document/createNSResolver
        if (k.substr(0, i) === 'xlink') {
          e.setAttributeNS('http://www.w3.org/1999/xlink', k.substr(++i), v)
        } else {
          error('unknown namespace for attribute: ' + k)
        }
      } else {
        // for svgs you have to setAttribute. for example, s('rect', {cx: 5}) will fail, as cx is a read-only property
        // however, it is worth noting that setAttribute is about 30% slower than setting the property directly
        // https://jsperf.com/setattribute-vs-property-assignment/7
        // it's likely a not-null check for e.namespaceURI is less overhead than using setAttribute for everyone
        if (doc.isDefaultNamespace(e.namespaceURI)) e[k] = v
        else e.setAttribute(short_attrs_rev[k] || k, v)
      }
    }
  }
}

export const arrayFragment = (parent, arr, cleanupFuncs) => {
  if (DEBUG) assert_cleanupFuncs(cleanupFuncs)
  var v, frag = doc.createDocumentFragment()
  var activeElement = (el) => el === (parent.activeElement || doc.activeElement)
  // function deepActiveElement() {
  //   let a = doc.activeElement
  //   while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement
  //   return a
  // }

  // append nodes to the fragment, with parent node as parent
  for (v of arr) frag.aC(make_child_node(parent, v, cleanupFuncs))

  if (arr._obv === 'array') {
    var obv_arr_begin = comment(DEBUG ? '5:obv-arr-begin' : 5)
    var obv_arr_end = comment(DEBUG ? '6:obv-arr-end' : 6)
    var container_nodes = (idx) => {
      return idx > 0
        ? obv_arr_end
        : idx
          ? 0
          : obv_arr_begin
    }

    frag.aC(obv_arr_end)
    frag.iB(obv_arr_begin, frag.n[0])
    function onchange (ev) {
      // this should remain a 'var' -- otherwise terser will deoptimise it.
      var i, j, o, oo, len = arr.length
      var type = ev.type
      if (type == 'unshift') {
        for (i = ev.values.length - 1; i >= 0; i--) {
          o = make_child_node(parent, ev.values[i], cleanupFuncs)
          parent.iB(
            isNode(o) ? o : txt(o),
            arr[0] || container_nodes(0),
            cleanupFuncs
          )
        }
      }
      else if (type == 'push') {
        for (i = 0; i < ev.values.length; i++) {
          j = arr.length + ev.values.length - i - 1
          o = make_child_node(parent, ev.values[i], cleanupFuncs)
          parent.iB(
            isNode(o) ? o : txt(o),
            arr[j] || container_nodes(j),
            cleanupFuncs,
          )
        }
      }
      else if (type == 'pop') {
        arr.rm([len-1])
      }
      else if (type == 'shift') {
        arr.rm([0])
      }
      else if (type == 'splice') {
        if ((j = ev.idx) < 0) j += len // -idx
        // experimental:
        if (ev.remove) for (i = 0; i < ev.remove; i++) {
          if (o = arr[j++]) {
            oo = make_child_node(parent, ev.add[i], cleanupFuncs)
            if (oo) parent.rC(isNode(oo) ? oo : txt(oo), o)
            else o.rm()
          }
        }
        if (ev.add) for (i = 0; i < ev.add.length; i++) {
          o = make_child_node(parent, ev.add[i], cleanupFuncs)
          parent.iB(
            isNode(o) ? o : txt(o),
            arr[j] || container_nodes(j),
            cleanupFuncs
          )
        }
        // working (just in case rC has some weird cases):
        // if (ev.remove) for (i = 0; i < ev.remove; i++)
        //   if (o = arr[j++]) o.rm()
        // if (ev.add) for (i = 0; i < ev.add.length; i++)
        //   parent.iB(isNode(o = ev.add[i]) ? o : txt(o), arr[j])

      }
      else if (type == 'sort') {
        // technically no longer used, but still exists mainly for comparison purposes
        // although less element swaps are done with quiksort, it may be taxing on paint performance...
        // looking into it eventually :)
        for (i = 0, oo = ev.orig; i < arr.length; i++) {
          o = arr[i]
          if (i !== (j = oo.indexOf(o))) {
            if (activeElement(o) || o.focused === 1) i = 1
            o.rm()
            parent.iB(
              o,
              arr[i - 1] || container_nodes(i - 1),
              cleanupFuncs
            )
            if (i === 1) o.focus(), o.focused = 0
          }
        }
      }
      else if (type == 'replace') {
        o = make_child_node(parent, ev.val, cleanupFuncs)
        oo = ev.old
        if (activeElement(o) || o.focused === 1) i = 1
        if (activeElement(oo)) oo.focused = 1
        parent.rC(o, oo)
        if (i === 1) o.focus(), o.focused = 0
      }
      else if (type == 'insert') {
        if ((i = ev.idx) < 0) i += len // -idx
        parent.iB(ev.val, arr[i], cleanupFuncs)
      }
      else if (type == 'reverse') {
        for (i = 0, j = +(arr.length / 2); i < j; i++)
          arr.emit('change', {type: 'swap', from: i, to: arr.length - i - 1 })
      }
      else if (type == 'move') {
        if ((i = ev.from) < 0) i += len // -idx
        if ((j = ev.to) < 0) j += len   // -idx
        o = arr[i]
        if (activeElement(o)) i = 1
        parent.iB(
          o,
          arr[j] || container_nodes(j),
          cleanupFuncs
        )
        if (i === 1) o.focus()
      }
      else if (type == 'swap') {
        ev.j = h('div.swap', o = {s: {display: 'none'}})
        ev.k = h('div.swap', o)
        if ((i = ev.from) < 0) i += len // -idx
        if ((j = ev.to) < 0) j += len   // -idx
        oo = arr[i]
        o = arr[j]
        if (activeElement(o)) i = 1
        else if (activeElement(oo)) i = 2
        parent.rC(ev.j, oo)
        parent.rC(ev.k, o)
        parent.rC(o, ev.j)
        parent.rC(oo, ev.k)
        if (i === 1) o.focus()
        else if (i === 2) oo.focus()
      }
      else if (type == 'remove') {
        if ((i = ev.idx) < 0) i += len // -idx
        arr[i].rm()
      }
      else if (type == 'set') {
        if ((i = ev.idx) < 0) i += len // -idx
        parent.rC(ev.val, arr[i])
      }
      else if (type == 'empty') {
        for (i = 0; i < arr.length; i++)
          arr[i].rm()
      }
      else if (DEBUG) {
        console.log('unknown event', ev)
      }
    }

    arr.parent = parent
    arr.sub(onchange)
    cleanupFuncs.Z(() => { arr.unsub(onchange) })
  }
  return frag
}

export var special_elements = {}
define_prop(special_elements, 'define', define_value((name, fn, args) => {
  // if (DEBUG) console.log('defining', name, args)
  customElements.define(name, fn)
  special_elements[name] = is_num(args)
    ? args
    : is_array(args)
      ? args.length
      : (fn.length || 0)
}))

export const new_dom_context = (no_cleanup) => {
  var ctx = hyper_hermes((el, args, i) => {
    return !~el.indexOf('-') ? cE(el)
      : (i = special_elements[el]) !== undefined ? new (customElements.get(el))(...args.splice(0, i))
      : new (customElements.get(el))
  })

  if (!no_cleanup) h.Z(() => ctx.cleanup())
  ctx.context = new_dom_context
  return ctx
}

export const new_svg_context = (no_cleanup) => {
  var ctx = hyper_hermes((el) => doc.createElementNS('http://www.w3.org/2000/svg', el))

  if (!no_cleanup) s.Z(() => ctx.cleanup())
  ctx.context = new_svg_context
  return ctx
}

export var h = new_dom_context(1)
export var s = new_svg_context(1)

export const make_child_node = (parent, v, cleanupFuncs, _placeholder) => {
  if (DEBUG) assert_cleanupFuncs(cleanupFuncs)
  return isNode(v) ? v
    : is_array(v) ? arrayFragment(parent, v, cleanupFuncs)
    : is_fn(v) ? (
      is_obv(v) ? make_obv_child_node(parent, v, cleanupFuncs) : (() => {
        while (is_fn(v)) v = v.call(parent, parent)
        return make_child_node(parent, v, cleanupFuncs)
      })()
    )
    : v == null ? comment(DEBUG ? '0:null' : 0)
    : is_fn(v.then) ? (
      v.then((v, node) => {
        node = make_child_node(parent, v, cleanupFuncs)
        if (DEBUG && _placeholder.p !== parent) error('promise unable to insert itself into the dom because parentNode has changed')
        else parent.rC(node, _placeholder), cleanupFuncs.Z(() => node.rm())
      }),
      _placeholder = comment(DEBUG ? '2:promise-value' : 2)
    )
    : txt(v)
}

export const make_obv_child_node = (parent, v, cleanupFuncs) => {
  if (DEBUG) assert_cleanupFuncs(cleanupFuncs)
  var r, o, nn, clean = [], placeholder
  if (is_fn(v)) {
    if (is_obv(v)) {
      // observable
      parent.aC(r = comment(DEBUG ? '3:obv-value' : 3))
      parent.aC(placeholder = comment(DEBUG ? '4:obv-bottom' : 4))
      cleanupFuncs.Z(v((val) => {
        nn = make_child_node(parent, val, cleanupFuncs)
        if (is_array(r)) {
          each(r, v => {
            // this removes all previous elements in the array before adding them below with the insertBefore
            if (v) {
              if (v.then) v.then(parent => parent.rm())
              else if (isNode(v)) v.rm()
              else if (DEBUG) error('element in removal array is not a node')
            } else if (DEBUG) error('somehow a null value got saved into the removal array')
          })
        } else if (r) {
          if (DEBUG && r.p !== parent) error('obv unable to replace child node because parentNode has changed')
          else parent.rC(nn, r)
        }

        parent.iB(nn, placeholder, cleanupFuncs)
        /*
        not totally sure this is working. I'm trying to save the resulting element back into the array that's used for removal. for example, imagine that I have a string or a number and I add it the dom, when I go to remove them, it won't know what elements they were.
        similarly, for promises, once they resolve, it should set the element in the array with the resolved node.
                     -kenny 2020-02-25

        after playing with it some time, I do not believe that anything more needs to be done here. there may be an edge case perhaps if there is a promise that returns a promise or something like that, but for now, it's good enough.
                    -kenny 2020-04-01
        */
        r = is_array(val)
          ? (each(val, (v, i) => {
            if (v != null) {
              if (v.then) {
                v.then(v => val[i] = v)
              } else if (!isNode(v)) {
                val[i] = nn.n[i]
              }
            }
          }), val)
          : nn
      }), /* cleanup fn -> */ () => (placeholder.rm(), r && is_array(r) ? each(r, r => r.rm()) : r.rm()))
    } else {
      // normal function
      o = make_child_node(parent, v, cleanupFuncs)
      if (o != null) r = parent.aC(o, cleanupFuncs)
    }
    r = make_child_node(parent, r, cleanupFuncs)
  } else {
    r = make_child_node(parent, v, cleanupFuncs)
  }
  return r
}

// inlined @hyper/dom/style (cause rollup can't figure out how to concat js files)
// @Improve: using a rollup plugin, make this syntax possible:
// > $$INLINE_MODULE$$('@hyper/dom/style')
// (and split more parts of this monster file into smaller more manageable bits)

import { camelize, float } from '@hyper/utils'
import { value2 } from '@hyper/dom/observable'

export const set_style = (e, style, cleanupFuncs = e.X) => {
  if (DEBUG) assert_cleanupFuncs(cleanupFuncs)

  if (is_obj(style)) {
    every(style, (val, k) => {
      // this is to make positioning elements a whole lot easier.
      // if you want a numeric value for some reason for something other than px, coerce it to a string first, eg. {order: '1', 'grid-column-start': '3'}
      var setter = (v) => {
        k = camelize(k)
        if (DEBUG && is_num(v) && (
          k === 'order' ||
          k === 'gridColumnStart'
        )) error(`this will automatically become '${k}': ${v}px. coerce it to a string like this '${k}': ${v}+''`)

        // numbers greater-than 1, or less-than -1 are treated as px
        // numbers from 0 - -1 are treated as percents, eg. -.6 = 60%
        // numbers from 0 - 1 are left as-is
        e.style[k] = is_num(v) && (v > 1 || v < -1)
          ? v + 'px'
          : v < 1
            ? `${-v * 100}%`
            : v
      }
      var getter = (v) => {
        v = e.style[camelize(k)]
        return v && v.substr(-2) === 'px' ? float(v) : v
      }
      if (is_obv(val)) {
        cleanupFuncs.Z(val(setter, 1))
        if (val() == null) val(getter())
      } else {
        if (DEBUG && !is_str(val) && !is_num(val))
          error(`unknown value (${val}) for style: ${k}`)
        else setter(val)
      }
    })
  } else {
    e.setAttribute('style', style)
  }
}


// hyper-ctx

// import { define_getter } from '@hyper/utils'
import { getElementById } from '@hyper/dom-base'

// default obv functions provided
import { value, transform, compute } from '@hyper/dom/observable'
import obj_value from '@hyper/obv/obj_value'
import { update_obv } from '@hyper/dom/observable-event'

export const assert_cleanupFuncs = (cleanupFuncs) => {
  if (DEBUG && (!is_array(cleanupFuncs) || !cleanupFuncs.Z)) {
    debugger
    error('bad cleanupFuncs')
  }
}

const EL_CTX = new WeakMap()
const CTX_EL = new WeakMap()

export const global_ctx = () => {
  var ctx, __lang = []
  var el = getElementById('global_ctx') || new_ctx({
    _id:0, ERROR: 'THIS IS THE GLOBAL CTX',
    o: {},
    h, s,
    // @Incomplete: it doesn't save much space. should perhaps the obvs that are not used be optional?
    v: value,
    t: transform,
    // c: compute,
    c: (obvs, compute_fn, obv) => {
      obv = compute(obvs, compute_fn)
      h.Z(obv.x)
      return obv
    },
    m: update_obv,
    V: obj_value,
    N: (fn, ...args) => new_ctx(ctx, fn, ...args),
    // this is theglobal scope... this needs to be per context
    $L: (lang) => {
      if (lang) __lang.push(lang)
      else __lang.pop()
    },
    L: (txt, ...vars) => {
      var i = 0, translation
      var len = __lang.length
      for (; i < len; i++) {
        if (translation = __lang[i][txt]) {
          return is_fn(translation) ? translation(vars) : translation
        }
      }

      return txt
    },
    X: h.X,
    Z: h.Z,
  }, (G) => {
    ctx = G
    // ensure the global ctx does not get garbage collected
    // it's writable so that in the all listeners cleaned up test,
    // we can verify that all listeners were actually all cleaned up.
    if (DEBUG) define_prop(G, 'nogc', {
      get: () => error(`you shouldn't be cleaning up the global gc`),
      set: v => {
        console.info('setting global ctx to be able to be cleaned up')
        G.nogc = v
      }
    })

    // bind the global ctx to a meta tag in the head called 'global_ctx'
    return doc.head.aC(h('meta#global_ctx'), h.X)
  })
  return EL_CTX.get(el) // el_ctx(el)
}

export const el_ctx = (el) => {
  var ctx
  while ((ctx = EL_CTX.get(el)) == null && (el = el.p) != null) {}
  return ctx || global_ctx()
}

export const el_cleanupFuncs = (el) => {
  return ctx_el(el).x
}

export const ctx_el = (ctx) => {
  var el = CTX_EL.get(ctx)
  if (DEBUG && !el) error(`for some reason, you held on to a reference to a ctx for a node which no longer exists.\nthis may be because you're referencing the ctx in its instantiation function. try accessing in on next_tick or referencing the element you're returning in the instantiation function, directly.\neg. (G) => { ... return el === el_ctx(G) }`)
  return el
}

export const el_cleanup = (el) => {
  var ctx = EL_CTX.get(el)
  if (ctx && !ctx.nogc) {
    ctx.cleanup()
    EL_CTX.delete(el)
    CTX_EL.delete(ctx)
  }
}

// not used at the moment. needs investigation
// export const cleanup_ctx = () => {
//   for (let [el, ctx] of EL_CTX.entries()) {
//     // there are definitely cases where you may hold on to a node for a little bit before reinserting it into the dom.
//     // so, maybe it should be added to a list for gc after some timeout. if it has a parent again, remove it from the list. that may still have problems though...
//     // the best solution right now is to set a field, 'nogc' to tell it not to get cleaned up
//     if (!ctx.nogc && !el.p) {
//       ctx.cleanup()
//       EL_CTX.delete(el)
//     }
//   }
// }

let last_id = 0
export const new_ctx = (G, fn, ...args) => {
  if (!G) G = global_ctx()
  if (DEBUG && typeof fn !== 'function') error('new_ctx is now called with a function which returns an element')

  var cleanupFuncs = []
  cleanupFuncs.Z = (fn) => {
    cleanupFuncs.push(
      DEBUG && typeof fn !== 'function'
      ? error('adding a non-function value to cleanupFuncs')
      : fn
    )
    return fn
  }
  var cleanup = (_f) => {
    while (_f = cleanupFuncs.pop()) _f()
    if (_f = ctx._h) _f.cleanup()
    if (_f = ctx._s) _f.cleanup()
  }
  var obvs = Object.create(G.o, {})
  var ctx = Object.create(G, {
    _id: define_value(++last_id),
    o: define_value(obvs),
    X: define_value(cleanupFuncs),
    Z: define_value(cleanupFuncs.Z),
    _h: define_value(null, true),
    _s: define_value(null, true),
    h: define_getter(() => ctx._h || (ctx._h = G.h.context())),
    s: define_getter(() => ctx._s || (ctx._s = G.s.context())),
    cleanupFuncs: define_value(cleanupFuncs),
    N: define_value((fn, ...args) => new_ctx(ctx, fn, ...args)),
    c: define_value((obvs, compute_fn, obv) => {
      obv = compute(obvs, compute_fn)
      if (DEBUG && !obv.x) error('not a valid cleanup function')
      cleanupFuncs.Z(obv.x)
      return obv
    }),
    parent: define_value(G),
    nogc: define_value(0),
    cleanup: define_value(cleanup),
    x: define_value(cleanup),
  })

  var el = fn(ctx, ...args)

  if (DEBUG && is_array(el)) error(`this will assign a context to your element, so an array won't work. instead, wrap these elements in a container element`)
  if (DEBUG && !isNode(el) && el != null && !el.then) error('you must return an element when creating a new context')

  var set_ctx = el => {
    // debugger
    EL_CTX.set(el, ctx)
    CTX_EL.set(ctx, el)
  }

  if (el) {
    if (el.then) {
      el.then(set_ctx)
    } else {
      set_ctx(el)
    }
  }

  return el
}

// shortcut to remove myself from the dom (and cleanup if it's got nodes)
Node_prototype.rm = function () {
  return el_cleanup(this), this.remove()
}

// shortcut to append multiple children (w/ cleanupFuncs)
Node_prototype.iB = function (el, before_node, cleanupFuncs) {
  return this.insertBefore(
    isNode(el) ? el : make_obv_child_node(this, el, cleanupFuncs),
    before_node
  )
}

// shortcut to append multiple children (w/ cleanupFuncs)
Node_prototype.aC = function (el, cleanupFuncs) {
  return this.appendChild(isNode(el) ? (el.p !== this ? el : undefined) : make_obv_child_node(this, el, cleanupFuncs))
}

// shortcut to replaceChild
Node_prototype.rC = function (new_child, old_child) {
  return this.replaceChild(new_child, old_child)
}

// shorcuts for properties
define_props(Node_prototype, {
  p: define_getter(function () { return this.parentNode }),
  n: define_getter(function () { return this.childNodes }),
  X: define_getter(function () { return ctx_el(this).x }),
})

// shortcut to apply attributes as if they were the second argument to `h('.lala', {these ones}, ...)`
Node_prototype.attrs = function (obj, cleanupFuncs = this.X) {
  every(obj, (v, k) => set_attr(this, k, v, cleanupFuncs))
}

// https://jsperf.com/remove-all-child-nodes/2.atom
Node_prototype.empty = function (child) {
  while (child = this.firstChild) child.rm()
}

// enable disable classes (with timed undo)
// set_to is truthy - add class
// set_to is falsey - remove class
// set_to is -1/undefined/null - toggle class
Node_prototype.c = function (class_name, set_to, undo_after_sec) {
  set_to = set_to != null && set_to !== -1 ? !set_to : undefined // the negated version. save 1 byte! (otherwise it would have to be !!set_to and the negation would be in the after function)
  if (undo_after_sec) {
    after(undo_after_sec, () => {
      this.classList.toggle(class_name, set_to)
    })
  }
  return this.classList.toggle(class_name, !set_to)
}

// event emitter shortcuts
Node_prototype.on = Node_prototype.addEventListener
Node_prototype.off = Node_prototype.removeEventListener

export default h
