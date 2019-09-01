import MixinEmitter from '@lib/drip/MixinEmitter'
import { value, obv_obj, observable_property } from '@lib/dom/observable'
import { empty_array, swap, define_prop, define_getter } from '@lib/utils'
import { new_ctx } from '@lib/dom/hyper-ctx'
import isEqual from '@lib/isEqual'
// import invoke from '@lib/lodash/invoke'
// import set from '@lib/lodash/set'

export class ObservableArray extends MixinEmitter(Array) {
  // this is so all derived objects are of type Array, instead of ObservableArray
  static get [Symbol.species]() { return Array }
  constructor (array) {
    super()
    this.observable = 'array'
    if (this._obv_len) this._obv_len(this.length)
    define_prop(this, 'obv_len', define_getter(() => this._obv_len || (this._obv_len = value(this.length))))
    if (Array.isArray(array) && array.length) super.push(...array)
  }

  pop () {
    if (!this.length) return
    this.emit('change', { type: 'pop' })
    if (this._obv_len) this._obv_len(this.length - 1)
    return super.pop()
  }

  push (...items) {
    if (!items.length) return this.length
    this.emit('change', { type: 'push', values: items })
    if (this._obv_len) this._obv_len(this.length + items.length)
    return super.push(...items)
  }

  reverse () {
    if (this.length <= 1) return this
    this.emit('change', { type: 'reverse' })
    return super.reverse()
  }

  shift () {
    if (!this.length) return
    this.emit('change', { type: 'shift' })
    if (this._obv_len) this._obv_len(this.length - 1)
    return super.shift()
  }

  swap (from_idx, to_idx) {
    this.emit('change', {type: 'swap', from: from_idx, to: to_idx })
    var el = super.splice(from_idx, 1)
    super.splice(to_idx, 0, el[0])
  }

  sort (compare) {
    // implementation of selection sort
    // (it's more compares, but the fewest number of swaps, which is better for dom performance)
    if (this.length <= 1) return this
    var i = 0, j, k, a = this, l = a.length
    for (; i < l; i++) {
      // smallest index val
      k = i
      for (j = i+1; j < l; j++) {
        if (compare(a[j], a[k]) <= 0) k = j
      }

      if (k !== i) {
        this.emit('change', {type: 'swap', from: k, to: i })
        swap(a, i, k)
      }
    }

    return this
  }

  empty () {
    if (this.length > 0) {
      this.emit('change', { type: 'empty' })
      if (this._obv_len) this._obv_len(0)
      this.length = 0
    }
    return this
  }

  replace (idx, val) {
    this.emit('change', { type: 'replace', val, idx, old: this[idx] })
    super.splice(idx, 1, val)
    return this
  }

  move (from_idx, to_idx) {
    this.emit('change', { type: 'move', from: from_idx, to: to_idx })
    var el = super.splice(from_idx, 1)
    super.splice(to_idx, 0, el[0])
    return this
  }

  insert (idx, val) {
    this.emit('change', { type: 'insert', val, idx })
    if (this._obv_len) this._obv_len(this.length + 1)
    super.splice(idx, 0, val)
    return this
  }

  remove (idx) {
    if (typeof idx !== 'number') {
      var iidx = this.indexOf(idx)
      if (~iidx) idx = iidx
      else return this
    }
    this.emit('change', { type: 'remove', idx })
    if (this._obv_len) this._obv_len(this.length - 1)
    super.splice(idx, 1)
    return this
  }

  splice (idx, remove, ...add) {
    if (idx === undefined || (remove !== undefined && (+idx >= this.length || +remove <= 0))) return []
    this.emit('change', { type: 'splice', idx, remove, add })
    if (this._obv_len) this._obv_len(this.length + add.length - remove)
    return super.splice(idx, remove, ...add)
  }

  unshift (...items) {
    if (!items.length) return this.length
    this.emit('change', { type: 'unshift', values: items })
    if (this._obv_len) this._obv_len(this.length + items.length)
    return super.unshift(...items)
  }

  set (idx, val) {
    if (idx < 0) idx += this.length
    if (isEqual(this[idx], val)) return
    this.emit('change', { type: 'set', idx, val })
    this[idx] = val
    return this
  }

  // @Optimise: move this out to a separate file, so that
  //            lodash/set and lodash/invoke dependencies aren't pulled in.
  //            (it was only used once in a project from a while ago)
  // setPath (idx, path, value) {
  //   var obj = this[idx]
  //   // in case it's an observable, no need to emit the event
  //   if (obj.observable === 'object') invoke(obj, path, value)
  //   else {
  //     set(obj, path, value)
  //     this.emit('change', { type: 'set', idx, val: obj })
  //   }
  //   return obj
  // }
}

// this function is to replicate changes made to one obv arr to another one(s)
export function ObservableArrayApply (oarr, ...arr) {
  oarr.on('change', (e) => {
    var a, t
    switch (e.type) {
      case 'swap':
        for (a of arr) {
          t = a[e.to]
          a[e.to] = a[e.from]
          a[e.from] = t
        }
        break
      case 'move':
        for (a of arr) {
          t = a.splice(e.from, 1)
          a.splice(e.to, 0, t[0])
        }
        break
      case 'set':
        for (a of arr) a[e.idx] = e.val
        break
      case 'unshift':
        for (a of arr) a.unshift(...e.values)
        break
      case 'push':
        for (a of arr) a.push(...e.values)
        break
      case 'splice':
        for (a of arr) a.splice(e.idx, e.remove, ...e.add)
        break
      case 'remove':
        for (a of arr) a.splice(e.idx, 1)
        break
      case 'replace':
        for (a of arr) a.splice(e.idx, 1, e.val)
        break
      case 'insert':
        for (a of arr) a.splice(e.idx, 0, e.val)
        break
      case 'sort':
        for (a of arr) a.sort(e.compare)
        break
      case 'empty':
        for (a of arr) a.length = 0
        break
      // no args
      case 'pop':
      case 'reverse':
      case 'shift':
        for (a of arr) a[e.type]()
        break
    }
  })
}


// G: ctx from which to inherit sub ctxs
// data: an ObservableArray of values which will be transformed into a dom reprenstation by `fn`
// fn: function receiving 1-3 arguments: (d, ctx, idx) for each item in the array
// opts:
//   plain: true/false - the data passed for each value in the array is a plain object or value/obv_object
//   min: [number] - render at least n items always. for items that are empty, call opts.empty_fn instead
//   empty_fn: [function] - @Incomplete: should receive (idx).
export class RenderingArray extends ObservableArray {
  constructor (G, data, fn, opts = { plain: true }) {
    super()
    this.fn = typeof data === 'function' ? (fn = data) : fn
    let k, fl = this.fl = fn.length
    this.G = G
    this.d = data instanceof ObservableArray ? data : (data = new ObservableArray(Array.isArray(data) ? data : []))
    // this should have cleanupFuncs in the context (which adds h/s cleanup to the list when it makes the context)
    G.cleanupFuncs.push(() => { this.cleanup() })

    // where we store the id/data which gets passed to the rendering function
    if (fl >= 1) this._d = []
    if (fl >= 2) this._ctx = []
    if (fl >= 3) this._idx = []

    if (opts.min) {
      this.empty_fn = typeof opts.empty_fn === 'function' ? opts.empty_fn : () => 'empty'
    }

    // assigns options to `this`
    for (k in opts) this[k] = opts[k]

    // lastly, if data has length, then render and add each of them
    this.data(data)
  }

  data (data) {
    const onchange = this._onchange = (e) => {
      var v, t, i, j, k, len = this._d.length, fl = this.fl, type = e.type, min = +this.min || 0, a = this
      switch (type) {
        // @Leak: perhaps check to see if idx obvs do not have any listeners
        case 'swap':
          if ((i = e.from) < 0) i += len // -idx
          if ((j = e.to) < 0) j += len   // -idx
          if (fl >= 1) swap(this._d, j, i)
          if (fl >= 2) swap(this._ctx, j, i)
          if (fl >= 3) {
            this._idx[i](j)
            this._idx[j](i)
            swap(this._idx, j, i)
          }
          swap(this, j, i)
          break
        case 'move':
          if ((i = e.from) < 0) i += len // -idx
          if ((j = e.to) < 0) j += len   // -idx
          if (fl >= 1) v = this._d.splice(i, 1), this._d.splice(j, 0, v[0])
          if (fl >= 2) v = this._ctx.splice(i, 1), this._ctx.splice(j, 0, v[0])
          if (fl >= 3) {
            v = this._idx.splice(i, 1), this._idx.splice(j, 0, v[0])
            this._idx[i](j)
            this._idx[j](i)
          }
          v = super.splice(i, 1), super.splice(j, 0, v[0])
          break
        case 'set':
          if ((i = e.idx) < 0) i += len // -idx
          v = e.val
          super[i] = v
          if (fl >= 1) this._d[i].set(v)
          break
        case 'unshift':
          i = 0
          // make space in storage arrays by splicing in undefined values (to be filled in by fn_call)
          v = new Array(e.values.length)
          if (fl >= 1) this._d.splice(0, 0, ...v)
          if (fl >= 2) this._ctx.splice(0, 0, ...v)
          if (fl >= 3) this._idx.splice(0, 0, ...v)
          for (v of e.values) super.unshift(this.fn_call(v, i++))
          if (fl >= 3) for (; i < len; i++) this._idx[i](i)
          if (min && (i = min - len - v.length) > 0) super.splice(-i, i) // remove that many values from the end of the rendering array
          break
        case 'push':
          j = len
          i = len + e.values.length
          t = []
          // make space in storage arrays
          if (fl >= 1) this._d.length = i
          if (fl >= 2) this._ctx.length = i
          if (fl >= 3) this._idx.length = i
          i = Math.min(i, min) - len
          for (v of e.values) t.push(this.fn_call(v, len++))
          if (i) super.splice(j, i, ...t)
          else super.push(...t)
          break
        case 'splice':
          if ((i = e.idx) < 0) i += len // -idx
          j = e.remove
          // make space in storage arrays by splicing in undefined values (to be filled in by fn_call)
          v = new Array(k = e.add.length)
          if (fl >= 1) this._d.splice(i, j, ...v)
          if (fl >= 2) t = this._ctx.splice(i, j, ...v)
          if (fl >= 3) this._idx.splice(i, j, ...v)
          for (v of t) v.cleanup()
          t = [] // temp array to save rendered elements
          len += k - j
          k = i
          for (v of e.add) t.push(this.fn_call(v, k++))
          if (fl >= 3) for (k = i; k < len; k++) this._idx[k](k)
          super.splice(i, j, ...t)
          if (min) {
            i = min - len
            if (i < 0) super.splice(i, -i)
            if (i > 0) super.push(...empty_array(i, this.empty_fn))
          }
          break
        case 'remove':
          if ((i = e.idx) < 0) i += len // -idx
          if (fl >= 1) this._d.splice(i, 1)
          if (fl >= 2) this._ctx.splice(i, 1)[0].cleanup()
          if (fl >= 3) this._idx.splice(i, 1)
          super.splice(i, 1)
          if (min >= len) super.push(this.empty_fn())
          if (fl >= 3) for (len--; i < len; i++) this._idx[i](i)
          break
        case 'replace':
        case 'insert':
          if ((i = e.idx) < 0) i += len // -idx
          j = type === 'replace' ? 1 : 0
          if (fl >= 1) this._d.splice(i, j, null)
          if (fl >= 2) v = this._ctx.splice(i, j, null)
          if (fl >= 3) this._idx.splice(i, j, null)
          super.splice(i, j, this.fn_call(e.val, i))
          if (j > 0) {
            // replace
            if (fl >= 2 && v[0]) v[0].cleanup()                        // replace: clean up old ctx
          } else {
            // insert
            if (fl >= 3) for (; i <= len; i++) this._idx[i](i)   // insert: update the indexes
            if (len <= min) super.pop()
          }

          break
        case 'sort':
          t = []
          i = min - len
          if (min && i > 0) v = super.splice(-i, i)
          let listen = (e) => { t.push(e) }
          this.d.on('change', listen)
          this.d.sort(e.compare)
          this.d.off('change', listen)
          for (v of t) super.emit('change', v)
          if (min && i > 0) v = super.splice(-i, 0, ...v)
          break
        case 'empty':
          super.empty()
          if (fl >= 1) this._d.length = 0
          if (fl >= 2) { for (v of this._ctx) { v.cleanup() } this._ctx.length = 0 }
          if (fl >= 3) this._idx.length = 0
          if (min) this.push(...empty_array(min, this.empty_fn))
          break
        // no args
        case 'reverse':
          // reverse the indexes
          for (i = 0; i < len; i++) this._idx[i](len - i - 1)
          // set len to 0 so we don't cleanup() or shift the idx
          len = 0
          // nobreak
        case 'shift':
          if (len) for (i = 1; i < len; i++) this._idx[i](i - 1)
          // nobreak
        case 'pop':
          this._d[type]()
          if ((v = this._ctx[type]()) && len) v.cleanup()
          this._idx[type]()
          super[type]()
          if (min && len && min > len) super.push(this.empty_fn())
          break
      }
    }

    if (data instanceof ObservableArray) {
      var i = 0, len = data.length, min = +this.min || 0, _d = []

      // empty / cleanup the array
      // @Optimise: technically, the array doesn't need to be emptied at all...
      //   just update the values of this._d for each one, then push on (or splice off) the difference
      if (this.length > 0) this.empty()

      if (len || min) {
        for (; i < len; i++) _d.push(this.fn_call(data[i], i))
        if (min > len) for (; i < min; i++) _d.push(this.empty_fn(i))
        super.push(..._d)
      }

      if (this._obv_len) this._obv_len(len)
      this.d.off('change', onchange)
      this.d = data
      define_prop(this, 'obv_len', define_getter(() => this.d.obv_len))
      data.on('change', onchange)
    }

    return this.d
  }

  fn_call (d, idx) {
    var fl = this.fl, fn = this.fn
    var _d, _ctx, _idx
    if (fl === 0) return fn()
    else {
      _d = this._d[idx] || (this._d[idx] = this.plain ? d : typeof d === 'object' ? obv_obj(d) : value(d))
      if (fl === 1) return fn(_d)
      else {
        _ctx = this._ctx[idx] || (this._ctx[idx] = new_ctx(this.G))
        if (fl === 2) return fn(_d, _ctx)
        else { //if (fl === 3) {
          // TODO: check to see if this observable needs to be cleaned up (I don't think so, anyway, but maybe I'm wrong)
          _idx = this._idx[idx] || (this._idx[idx] = value(idx))
          return fn(_d, _idx, _ctx)
        }
      }
    }
  }

  cleanup () {
    // clean up contexts (and remove any arrayFragment elements too)
    this._onchange({type: 'empty'})
    // stop listening to data changes (in case the data element is used in more than one place)
    this.d.off('change', this._onchange)
  }
}

;(() => {
  // so it garbage collects...
  let proto = RenderingArray.prototype
  for (let p of ['swap','move','set','unshift','push','splice','remove','replace','insert','sort','empty','pop','reverse','shift','setPath'])
    proto[p] = function () { return this.d[p].apply(this.d, arguments) }
})()

// RenderingArray is already some pretty dense code,
// however, it would be nice to make a fixed size
// version which only renders a 'window' of the data.
// when the window is bigger than the data size, it'll show
// empty spots. and when the window is smaller than the data,
// it can optionally include call a function which inserts dummy elements or resizes
// some ending elements to simulate the data existing farther up in the scroll.

// some options would be to simply copy and paste the majority of the code, or to
// try and do everything with options in RenderingArray.
//
// the idea of making extra space on the top/bottom to simulate more data being there
// than is rendered would nearly require a whole separate functin -- cept there would
// *still* be 80% or more duplicated code.

// for stuff like this, I really wish js had jon's jai macros!!! (LOL, I know..)

// export class FixedSizeRenderingArray extends RenderingArray {
//   constructor (G, data, fn, size, fn_empty, opts) {
//     super(G, data, fn, opts)
//     this.fne = fn_empty
//   }
// }
