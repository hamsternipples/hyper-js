import { value } from '@hyper/dom/observable'
import { empty_array, is_array } from '@hyper/utils'
import { define_prop, define_getter } from '@hyper/utils'
import { extend, swap, error } from '@hyper/utils'
import isEqual from '@hyper/isEqual'

import { mixin_pubsub } from '@hyper/listeners'

/*
emitter of events:
* type -> event type
  * swap
    * to (idx)
    * from (idx)
  * move
    * to (idx)
    * from (idx)
  * set
    * idx
    * val
  * unshift
    * values
  * push
    * values
  * splice
    * idx
    * remove (count)
    * add (values)
  * remove
    * idx
  * replace
    * idx
    * val
  * insert
    * idx
    * val
  * sort
  * empty
  * pop
  * reverse
  * shift
*/

export default class ObservableArray extends Array {
  // this is so all derived objects are of type Array, instead of ObservableArray
  static get [Symbol.species]() { return Array }
  constructor (array) {
    super()
    var self = this
    self.observable = 'array'
    self.listeners = []
    mixin_pubsub(self)
    self._up()
    define_prop(self, 'obv_len', define_getter(() => self._obv_len || (self._obv_len = value(self.length))))
    if (is_array(array) && array.length) super.push(...array)
  }

  pop () {
    if (!this.length) return
    this.pub({ type: 'pop' })
    var ret = super.pop()
    this._up()
    return ret
  }

  push (...items) {
    if (!items.length) return this.length
    this.pub({ type: 'push', values: items })
    var ret = super.push(...items)
    this._up()
    return ret
  }

  reverse () {
    if (this.length <= 1) return this
    this.pub({ type: 'reverse' })
    return super.reverse()
  }

  shift () {
    if (!this.length) return
    this.pub({ type: 'shift' })
    var ret = super.shift()
    this._up()
    return ret
  }

  swap (from_idx, to_idx) {
    this.pub({type: 'swap', from: from_idx, to: to_idx })
    swap(this, to_idx, from_idx)
  }

  sort (compare) {
    // implementation of selection sort
    // (it's more compares, but the fewest number of swaps, which is better for dom performance)
    var i = 0, j, k, arr = this, len = arr.length
    if (l <= 1) return arr
    for (; i < len; i++) {
      // smallest index val
      k = i
      for (j = i+1; j < len; j++) {
        if (compare(arr[j], arr[k]) <= 0) k = j
      }

      if (k !== i) {
        this.pub({type: 'swap', from: k, to: i })
        swap(arr, i, k)
      }
    }

    return arr
  }

  shuffle () {
    for (var i = 0; i < this.length;) {
      this.swap(i, Math.floor(Math.random() * (++i)))
    }
  }

  empty () {
    if (this.length > 0) {
      this.pub({ type: 'empty' })
      this.length = 0
      this._up()
    }
    return this
  }

  reset (items) {
    // @Speed: this should be smarter. it should only do the difference between this and items
    this.empty()
    if (is_array(items)) this.push(...items)
    return this
  }

  replace (idx, val) {
    this.pub({ type: 'replace', val, idx, old: this[idx] })
    super.splice(idx, 1, val)
    return this
  }

  move (from_idx, to_idx) {
    this.pub({ type: 'move', from: from_idx, to: to_idx })
    var el = super.splice(from_idx, 1)
    super.splice(to_idx, 0, el[0])
    return this
  }

  remove (idx) {
    if (typeof idx !== 'number') {
      var iidx = this.indexOf(idx)
      if (~iidx) idx = iidx
      else return this
    }
    this.pub({ type: 'remove', idx })
    super.splice(idx, 1)
    this._up()
    return this
  }

  splice (idx, remove, ...add) {
    if (idx === undefined || (remove !== undefined && (+idx >= this.length || +remove < 0))) return []
    this.pub({ type: 'splice', idx, remove, add })
    var ret = super.splice(idx, remove, ...add)
    this._up()
    return ret
  }

  unshift (...items) {
    if (!items.length) return this.length
    this.pub({ type: 'unshift', values: items })
    var ret = super.unshift(...items)
    this._up()
    return ret
  }

  set (idx, val) {
    if (idx < 0) idx += this.length
    if (isEqual(this[idx], val)) return
    this.pub({ type: 'set', idx, val })
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
  //     this.pub({ type: 'set', idx, val: obj })
  //   }
  //   return obj
  // }

  // utility to update after an operation
  _up () {
    if (this._obv_len) this._obv_len(this.length)
  }
}

// this function is to replicate changes made to one obv arr to another one(s)
export const ObservableArrayApplies = (oarr, ...arr) => {
  var onchange = (e) => {
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
  }
  oarr.sub(onchange)
  return () => oarr.unsub(onchange)
}

export const ObservableArrayChange = (arr, evt, _t) => {
  switch (evt.type) {
    case 'swap':
      _t = arr[evt.to]
      arr[evt.to] = arr[evt.from]
      arr[evt.from] = _t
      break
    case 'move':
      _t = arr.splice(evt.from, 1)
      arr.splice(evt.to, 0, _t[0])
      break
    case 'set':
      _t = arr[evt.idx]
      arr[evt.idx] = evt.val
      break
    case 'unshift':
      arr.unshift(...evt.values)
      break
    case 'push':
      arr.push(...evt.values)
      break
    case 'splice':
      arr.splice(evt.idx, evt.remove, ...evt.add)
      break
    case 'remove':
      arr.splice(evt.idx, 1)
      break
    case 'replace':
      arr.splice(evt.idx, 1, evt.val)
      break
    case 'insert':
      arr.splice(evt.idx, 0, evt.val)
      break
    case 'sort':
      arr.sort(evt.compare)
      break
    case 'empty':
      arr.length = 0
      break
    // no args
    case 'pop':
    case 'reverse':
    case 'shift':
      arr[evt.type]()
      break
  }
}

export const ObservableArrayApply = (oarr, arr) => {
  var fn = (evt) => ObservableArrayChange(oarr, evt)
  oarr.sub(fn)
  return () => oarr.unsub(fn)
}
