// hyper-hermes
// knicked from https://github.com/dominictarr/hyperscript
// many modifications...
// also took some inspiration from https://github.com/Raynos/mercury

// TODO: to make errors a bit more user-friedly, I began utilising the error function.
//       however, when building the plugin library, an errorless version should be created (to reduce size)
//       additionally, other things unnecessary (old/unused) things can be omitted as wel, for further savings.

import { is_obv } from './observable'
import { observe_event, add_event } from './observable-event'
import { define_prop, kind_of, array_idx, define_value, error } from '@hyper/utils'
import { each, every } from '@hyper/utils'
import { is_bool, is_num, is_str, is_fn, is_obj, is_array } from '@hyper/utils'
import { after, next_tick } from '@hyper/utils'

import { win, doc, customElements } from './dom-base'
import { isNode, txt, comment, cE } from './dom-base'
import { lookup_parent_with_attr } from './dom-base'
import { Node_prototype } from './dom-base'

// add your own (or utilise this to make your code smaller!)
export let short_attrs = { s: 'style', c: 'class', for: 'htmlFor' }
// however, when using setAttribute, these need to be reversed
export let short_attrs_rev = { style: 's', className: 'class', htmlFor: 'for' }

// can be used to save bytes:
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
export let common_tags = ['div']

function hyper_hermes (create_element) {
  let cleanupFuncs = []
  let z = (fn) => {
    cleanupFuncs.push(
      DEBUG && !is_fn(fn)
      ? error('adding a non-function value to cleanupFuncs')
      : fn
    )
    return fn
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
          e.aC(txt(l))
        }
      } else if (is_num(l)
        || is_bool(l)
        || l instanceof Date
        || l instanceof RegExp ) {
          e.aC(txt(l.toString()))
      } else if (is_array(l)) {
        e.aC(l, cleanupFuncs)
      } else if (isNode(l) || l instanceof win.Text) {
        e.aC(l)
      } else if (is_obj(l)) {
        // is a promise
        if (is_fn(l.then)) {
          e.aC(r = comment(DEBUG ? '1:promise-value' : 1))
          l.then((v) => {
            let node = make_node(e, v, cleanupFuncs)
            if (DEBUG && r.parentNode !== e) error('promise unable to insert itself into the dom because parentNode has changed')
            else e.rC(node, r), z(() => node.rm())
          })
        } else for (k in l) set_attr(e, k, l[k], cleanupFuncs)
      } else if (is_fn(l)) {
        make_obv_node(e, l, cleanupFuncs)
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
  h.z = cleanupFuncs.z = z
  h.cleanup = () => { call_each(cleanupFuncs) }

  return h
}

// these two probably need to be moved to dom-base
// instead of saving them into a set, we just lookup_parent_with_attr(e, 'roadtrip')
// export let roadtrips = new Set
// this is so that custom attributes can be used to define custom behaviour
export let custom_attrs = {
  boink: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {boink: fn}) },
  press: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {press: fn}) },
  hover: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {hover: fn}) },
  focused: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {focus: fn}) },
  selected: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {select: fn}) },
  checked: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {select: fn}) }, // duplicate of selected
  input: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {input: fn}) },
  value: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {input: fn}) }, // duplicate of input
  disabled: (cleanupFuncs, e, fn) => { observe_event(cleanupFuncs, e, {disabled: fn}) },
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

export function set_attr (e, key_, v, cleanupFuncs = []) {
  // convert short attributes to long versions. s -> style, c -> className
  var s, o, i, k = short_attrs[key_] || key_
  if (is_fn(v)) {
    next_tick(() => {
      if (is_fn(o = custom_attrs[k])) {
        o(cleanupFuncs, e, v)
      } else if (k.substr(0, 2) === 'on') {
        add_event(cleanupFuncs, e, k.substr(2), v, false)
      } else if (k.substr(0, 6) === 'before') {
        add_event(cleanupFuncs, e, k.substr(6), v, true)
      } else {
        // setAttribute was used here, primarily for svg support.
        // we may need to make a second version or something which works well with svg, perhaps instead using setAttributeNode
        // however, as mentioned in this article it may be desirable to use property access instead
        // https://stackoverflow.com/questions/22151560/what-is-happening-behind-setattribute-vs-attribute
        // observable (write-only) value
        cleanupFuncs.z(v.call(e, (v) => {
          set_attr(e, k, v, cleanupFuncs)
        }, 1)) // 1 = do_immediately
        s = e.nodeName
        if (s === 'INPUT') observe_event(cleanupFuncs, e, {input: v})
        if (s === 'SELECT') observe_event(cleanupFuncs, e, k === 'label' ? {select_label: v} : {select: v})
        if (s === 'TEXTAREA') observe_event(cleanupFuncs, e, {value: v})
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
    } else if (k === 'for') {
      e.htmlFor = v
    } else if (k === 'class') {
      if (v) {
        o = e.classList
        if (is_array(v)) each(v, s => s && o.add(s))
        else if (is_obj(v))
          every(v, val => {
            is_obv(val)
            ? cleanupFuncs.z(val((v) => o.toggle(s, v), 1))
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
      if (is_fn(o = custom_attrs[k])) {
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

export function arrayFragment (e, arr, cleanupFuncs) {
  var v, frag = doc.createDocumentFragment()
  var activeElement = (el) => el === (e.activeElement || doc.activeElement)
  // function deepActiveElement() {
  //   let a = doc.activeElement
  //   while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement
  //   return a
  // }

  // append nodes to the fragment, with parent node as e
  for (v of arr) frag.aC(make_node(e, v, cleanupFuncs))

  if (arr.observable === 'array') {
    // TODO: add a comment to know where the array begins and ends (a la angular)
    function onchange (ev) {
      // this should remain a 'var' -- otherwise terser will deoptimise it.
      var i, j, o, oo, len = arr.length
      var type = ev.type
      if (type == 'unshift') {
        for (i = ev.values.length - 1; i >= 0; i--)
          e.insertBefore(isNode(o = ev.values[i]) ? o : txt(o), arr[0])
      }
      else if (type == 'push') {
        for (i = 0; i < ev.values.length; i++)
          e.insertBefore(isNode(o = ev.values[i]) ? o : txt(o), arr[arr.length + ev.values.length - i - 1])
      }
      else if (type == 'pop') {
        e.removeChild(arr[len-1])
      }
      else if (type == 'shift') {
        e.removeChild(arr[0])
      }
      else if (type == 'splice') {
        if ((j = ev.idx) < 0) j += len // -idx
        // experimental:
        if (ev.remove) for (i = 0; i < ev.remove; i++) {
          if (o = arr[j++]) {
            if (oo = ev.add[i]) e.replaceChild(isNode(oo) ? oo : txt(oo), o)
            else e.removeChild(o)
          }
        }
        if (ev.add) for (i = 0; i < ev.add.length; i++)
          e.insertBefore(isNode(o = ev.add[i]) ? o : txt(o), arr[j])
        // working (just in case replaceChild has some weird cases):
        // if (ev.remove) for (i = 0; i < ev.remove; i++)
        //   if (o = arr[j++]) e.removeChild(o)
        // if (ev.add) for (i = 0; i < ev.add.length; i++)
        //   e.insertBefore(isNode(o = ev.add[i]) ? o : txt(o), arr[j])

      }
      else if (type == 'sort') {
        // technically no longer used, but still exists mainly for comparison purposes
        // although less element swaps are done with quiksort, it may be taxing on paint performance...
        // looking into it eventually :)
        for (i = 0, oo = ev.orig; i < arr.length; i++) {
          o = arr[i]
          if (i !== (j = oo.indexOf(o))) {
            if (activeElement(o) || o.focused === 1) i = 1
            e.removeChild(o)
            e.insertBefore(o, arr[i - 1])
            if (i === 1) o.focus(), o.focused = 0
          }
        }
      }
      else if (type == 'replace') {
        o = ev.val
        oo = ev.old
        if (activeElement(o) || o.focused === 1) i = 1
        if (activeElement(oo)) oo.focused = 1
        e.replaceChild(o, oo)
        if (i === 1) o.focus(), o.focused = 0
      }
      else if (type == 'insert') {
        if ((i = ev.idx) < 0) i += len // -idx
        e.insertBefore(ev.val, arr[i])
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
        e.insertBefore(o, arr[j])
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
        e.replaceChild(ev.j, oo)
        e.replaceChild(ev.k, o)
        e.replaceChild(o, ev.j)
        e.replaceChild(oo, ev.k)
        if (i === 1) o.focus()
        else if (i === 2) oo.focus()
      }
      else if (type == 'remove') {
        if ((i = ev.idx) < 0) i += len // -idx
        e.removeChild(arr[i])
      }
      else if (type == 'set') {
        if ((i = ev.idx) < 0) i += len // -idx
        e.replaceChild(ev.val, arr[i])
      }
      else if (type == 'empty') {
        for (i = 0; i < arr.length; i++)
          e.removeChild(arr[i])
      }
      else if (DEBUG) {
        console.log('unknown event', ev)
      }
    }

    arr.on('change', onchange)
    cleanupFuncs.z(() => { arr.off('change', onchange) })
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

export var h = new_dom_context(1)
export function new_dom_context (no_cleanup) {
  // TODO: turn this into ctx = new Context ((el, args) => { ... })
  //  -- and, turn the context fn into a class??
  var ctx = hyper_hermes((el, args, i) => {
    return !~el.indexOf('-') ? cE(el)
      : (i = special_elements[el]) !== undefined ? new (customElements.get(el))(...args.splice(0, i))
      : new (customElements.get(el))
  })

  if (!no_cleanup) h.z(() => ctx.cleanup())
  ctx.context = new_dom_context
  return ctx
}

export var s = new_svg_context(1)
export function new_svg_context (no_cleanup) {
  var ctx = hyper_hermes((el) => doc.createElementNS('http://www.w3.org/2000/svg', el))

  if (!no_cleanup) s.z(() => ctx.cleanup())
  ctx.context = new_svg_context
  return ctx
}

export function make_node (e, v, cleanupFuncs, placeholder) {
  return isNode(v) ? v
    : is_array(v) ? arrayFragment(e, v, cleanupFuncs)
    : is_fn(v) ? (
      is_obv(v) ? make_obv_node(e, v, cleanupFuncs) : (() => {
        while (is_fn(v)) v = v.call(e, e)
        return make_node(e, v, cleanupFuncs)
      })()
    )
    : v == null ? comment(DEBUG ? '0:null' : 0)
    : is_fn(v.then) ? (v.then((v) => {
      let node = make_node(e, v, cleanupFuncs)
      if (DEBUG && placeholder.parentNode !== e) error('promise unable to insert itself into the dom because parentNode has changed')
      else e.rC(node, placeholder), cleanupFuncs.z(() => node.rm())
    }), placeholder = comment(DEBUG ? '2:promise-value' : 2))
    : txt(v)
}

export function make_obv_node (e, v, cleanupFuncs = []) {
  var r, o, nn, clean = [], placeholder
  if (is_fn(v)) {
    if (is_obv(v)) {
      // observable
      e.aC(r = comment(DEBUG ? '3:obv-value' : 3))
      e.aC(placeholder = comment(DEBUG ? '4:obv-bottom' : 4))
      cleanupFuncs.z(v((val) => {
        nn = make_node(e, val, cleanupFuncs)
        if (is_array(r)) {
          each(r, v => {
            // this removes all previous elements in the array before adding them below with the insertBefore
            if (v) {
              if (v.then) v.then(e => e.rm())
              else if (isNode(v)) v.rm()
              else if (DEBUG) error('element in removal array is not a node')
            } else if (DEBUG) error('somehow a null value got saved into the removal array')
          })
          // each(r, v => e.rm())
        } else if (r) {
          if (DEBUG && r.parentNode !== e) error('obv unable to replace child node because parentNode has changed')
          else e.rC(nn, r)
        }

        e.iB(nn, placeholder)
        /*
        not totally sure this is working. I'm trying to save the resulting element back into the array that's used for removal. for example, imagine that I have a string or a number and I add it the dom, when I go to remove them, it won't know what elements they were.
        similarly, for promises, once they resolve, it should set the element in the array with the resolved node.
                     -kenny 2020-02-25
        */
        r = is_array(val)
          ? (each(val, (v, i) => {
            if (v != null) {
              if (v.then) {
                v.then(v => val[i] = v)
              } else if (!isNode(v)) {
                val[i] = nn.childNodes[i]
              } else if (DEBUG) error('uhh???')
            }
          }), val)
          : nn
      }), /* cleanup fn -> */ () => (placeholder.rm(), r && is_array(r) ? each(r, r => r.rm()) : r.rm()))
    } else {
      // normal function
      o = make_node(e, v, cleanupFuncs)
      if (o != null) r = e.aC(o, cleanupFuncs)
    }
    r = make_node(e, r, cleanupFuncs)
  } else {
    r = make_node(e, v, cleanupFuncs)
  }
  return r
}

export function set_style (e, style, cleanupFuncs = []) {
  if (is_obj(style)) {
    every(style, (val, k, setter) => {
      // this is to make positioning elements a whole lot easier.
      // if you want a numeric value for some reason for something other than px, coerce it to a string first, eg. {order: '1', 'grid-column-start': '3'}
      setter = (v) => { e.style[k] = is_num(v) && k !== 'opacity' ? v + 'px' : v }
      if (is_obv(val)) {
        cleanupFuncs.push(val(setter, 1))
      } else {
        if (DEBUG && !is_str(val) && !is_num(val)) error('unknown value for style: '+k)
        else setter(val)
      }
    // }
    })
  } else {
    e.setAttribute('style', style)
  }
}

// shortcut to append multiple children (w/ cleanupFuncs)
Node_prototype.iB = function (el, ref, cleanupFuncs) {
  return this.insertBefore(make_obv_node(this, el, cleanupFuncs), ref)
}

// shortcut to append multiple children (w/ cleanupFuncs)
Node_prototype.aC = function (el, cleanupFuncs) {
  return this.appendChild(isNode(el) ? (el.parentNode !== this ? el : undefined) : make_obv_node(this, el, cleanupFuncs))
}

// shortcut to replaceChild
Node_prototype.rC = function (new_child, old_child) {
  return this.replaceChild(new_child, old_child)
}

// shortcut to apply attributes as if they were the second argument to `h('.lala', {these ones}, ...)`
Node_prototype.set = function (obj, cleanupFuncs) {
  every(obj, (v, k) => set_attr(this, k, v, cleanupFuncs))
}

// https://jsperf.com/remove-all-child-nodes/2.atom
Node_prototype.empty = function (child) {
  while (child = this.firstChild) this.removeChild(child)
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
