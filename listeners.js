// super simple array of listeners.
// instead of splicing on removal (or some other expensive array modifying operation)
// it nulls out the listener.
// when emitting, if it encounters a null, it counts them up and if they reach a threshold:
// NULL_LISTENERS_RUN_COMPACTOR -- then the expensive compactor will run the compactor

import { remove_every as compactor, next_tick, is_fn } from '@hyper/utils'

// trigger all listeners
// old_val has to come first, to allow for things using it to do something like this:
// emit(emitters, current_val = val, current_val)
export const emit = (listeners, old_val, val) => {
  var fn, c = 0, i = 0, len = listeners.length
  if (len > 0) {
    for (; i < len; i++) {
      if (is_fn(fn = listeners[i])) fn(val, old_val)
      else c++
    }

    // if there are NULL_LISTENERS_RUN_COMPACTOR or more null values, compact the array on next tick
    if (c > NULL_LISTENERS_RUN_COMPACTOR) next_tick(compactor, listeners)
  }
}

// trigger all listeners
// doesn't have old_val
export const trigger = (listeners, val) => {
  var fn, c = 0, i = 0, len = listeners.length
  if (len > 0) {
    for (; i < len; i++) {
      if (is_fn(fn = listeners[i])) fn(val)
      else c++
    }

    // if there are NULL_LISTENERS_RUN_COMPACTOR or more null values, compact the array on next tick
    if (c > NULL_LISTENERS_RUN_COMPACTOR) next_tick(compactor, listeners)
  }
}

// remove a listener
export const remove = (array, fn, __i) => {
  __i = array.indexOf(fn)
  // in the compactor function, we explicitly check to see if it's null...
  if (~__i) array[__i] = null
}

// mixin pub/sub/unsub functions into an object.
// this is the most simple and lightest emitter you can get
export const mixin_pubsub = (obj) => {
  var listeners = []

  obj.pub = (ev) => {
    trigger(listeners, ev)
  }

  obj.sub = (fn) => {
    listeners.push(fn)
  }

  obj.next = (fn, after = 1, _fn2) => {
    listeners.push(_fn2 = _fn2 = (ev) => {
      fn(ev)
      if (!--after) remove(listeners, fn2)
    })
  }

  obj.unsub = (fn) => {
    remove(listeners, fn)
  }
}
