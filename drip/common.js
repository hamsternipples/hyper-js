
import { is_array, concat } from '@hyper/utils'

/**
 * ### .many (event, ttl, callback)
 *
 * Bind a `callback` function to count(`ttl`) emits of `event`.
 *
 *     // 3 times then auto turn off callback
 *     drop.many('event', 3, callback)
 *
 * @param {String|Array} event
 * @param {Integer} TTL Times to listen
 * @param {Function} callback
 * @api public
 */

export function many (ev, times, fn) {
  var self = this

  function wrap () {
    // wrap this in a timeout, because the off function splices the function out of the array, skipping a listener in the for-loop of the .emit function
    if (--times === 0) setTimeout(function () { self.off(ev, wrap) }, 0)
    fn.apply(null, arguments)
  }

  this.on(ev, wrap)
  return this
}

/**
 * ### .once (event, callback)
 *
 * Bind a `callback` function to one emit of `event`.
 *
 *      drip.once('event', callback)
 *
 * @param {String|Array} event
 * @param {Function} callback
 * @api public
 */

export function once (ev, fn) {
  this.many(ev, 1, fn)
  return this
}

/**
 * Determine if a function is included in a
 * list of functions. Or, if a check function
 * is not available, return true.
 *
 * @param {Function|Array} function list
 * @param {Function|null} function to validate
 * @api public
 */

export function hasListener (fns, fn) {
  if (!fn && 'function' === typeof fns) return true
  else if (fn && 'function' === typeof fns && fn == fns) return true
  else if (fns.length === 0) return false
  else if (fn && fns.indexOf(fn) > -1) return true
  else if (fn) return false
  else return true
}

export function bindEvent (ev, target) {
  var proxy = eventProxy.call(this, ev, target)
  this.on(ev, proxy)
  return this
}

export function unbindEvent (ev, target) {
  var proxy = eventProxy.call(this, ev, target)
  this.off(ev, proxy)
  return this
}

export function proxyEvent (ev, ns, target) {
  if (arguments.length === 2) target = ns, ns = null
  var drip = this._drip || {},
    listen = !drip.delimeter
      ? (ns ? ns + ':' + ev : ev)
      : (ns
        ? (is_array(ns)
          ? concat(ns, [ ev ])
          : concat(ns.split(drip.delimeter), [ ev ]))
        : ev)

  target.addListener(ev, eventProxy.call(this, listen, this))
  return this
}

export function unproxyEvent (ev, ns, target) {
  if (arguments.length === 2) target = ns, ns = null
  var drip = this._drip || {},
    listen = !drip.delimeter
      ? (ns ? ns + ':' + ev : ev)
      : (ns
        ? (is_array(ns)
          ? concat(ns, [ ev ])
          : concat(ns.split(drip.delimeter), [ ev ]))
        : ev)

  target.removeListener(ev, eventProxy.call(this, listen, this))
  return this
}

/*!
 * Create a function to use as a listener for bind/unbind or
 * proxy/unproxy calls. It will memoize the result to always
 * ensure the name function is provided for subequent calls.
 * This ensure that the the listener is correctly removed during
 * the un(bind|proxy) variants
 *
 * @param {String} event
 * @param {Object} target
 * @returns {Function} new or found callback
 * @api public
 */

function eventProxy (ev, target) {
  var _drip = this._drip || (this._drip = {}),
    _memoize = _drip.memoize || (_drip.memoize = {}),
    event = (_drip.delimeter && is_array(ev))
      ? ev.join(_drip.delimeter)
      : ev,
    mem = _memoize[event],
    proxy = null

  if (!mem) {
    proxy = makeProxy(event, target)
    _memoize[event] = [ [ target, proxy ] ]
  } else {
    for (var i = 0, l = mem.length; i < l; i++)
      if (mem[i][0] === target) return mem[i][1]
    proxy = makeProxy(event, target)
    mem.push([ target, proxy ])
  }

  return proxy
}

/*!
 * makeProxy (event, target)
 *
 * Provide a context independant proxy function
 * for using with `eventProxy` construction.
 *
 * @param {String} event
 * @param {Object} target
 * @returns {Function} to be used callback
 * @api private
 */

function makeProxy (ev, target) {
  return function proxy (...args) {
    target.emit.apply(target, [ev].concat(args))
  }
}

export default {
  many,
  once,
  hasListener,
  bindEvent,
  unbindEvent,
  proxyEvent,
  unproxyEvent,
}
