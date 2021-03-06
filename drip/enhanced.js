import common from './common'
import { is_array, concat } from '@hyper/utils'

function EnhancedEmitter (opts, _ctx) {
  opts = opts || {}
  let ctx = _ctx || this
  ctx._drip = {}
  ctx._drip.delimeter = opts.delimeter || ':'
  ctx._drip.wildcard = opts.wildcard || (opts.delimeter ? true : false)
  if (_ctx) return mixin(_ctx)
}

function mixin (obj) {
  for (var key in EnhancedEmitter.prototype) {
    obj[key] = EnhancedEmitter.prototype[key]
  }

  return obj
}

/**
 * ### .on (event, callback)
 *
 * Bind a `callback` function to all emits of `event`.
 * Wildcards `*`, will be executed for every event at
 * that level of heirarchy.
 *
 *     // for simple drips
 *     drop.on('foo', callback)
 *
 *     // for delimeted drips
 *     drop.on('foo:bar', callback)
 *     drop.on([ 'foo', 'bar' ], callback)
 *     drop.on('foo:*', callback)
 *     drop.on([ 'foo', '*' ], callback)
 *
 * An array can be passed for event when a delimeter has been
 * defined. Events can also have as many levels as you like.
 *
 * @param {String|Array} event
 * @param {Function} callback
 * @alias addListener
 * @name on
 * @api public
 */

EnhancedEmitter.prototype.on = EnhancedEmitter.prototype.addListener = function (ev, fn) {
  var map = this._events || (this._events = {})
  var evs = is_array(ev) ? ev.slice(0) : ev.split(this._drip.delimeter)
  var store = this._events || (this._events = {})

  function iterate (events, map) {
    var event = events.shift()
    map[event] = map[event] || {}

    if (events.length) {
      iterate(events, map[event])
    } else {
      if (!map[event]._) map[event]._ = [ fn ]
      else {
        map[event]._.push(fn)
        // if (map[event]._.length > 5) {
        //   console.log(event, map[event]._.length)
        //   if (event !== 'deauth' && event !== 'auth')
        //   if (map[event]._.length > 9) debugger
        // }
      }
    }
  }

  iterate(evs, store)
  return this
}

/**
 * @import ./common.js#exports.many
 * @api public
 */

EnhancedEmitter.prototype.many = common.many

/**
 * @import ./common.js#exports.once
 * @api public
 */

EnhancedEmitter.prototype.once = common.once

/**
 * ### .off ([event], [callback])
 *
 * Unbind `callback` function from `event`. If no function
 * is provided will unbind all callbacks from `event`. If
 * no event is provided, event store will be purged.
 *
 * ```js
 * emitter.off('event', callback)
 * emitter.off('event:nested', callback)
 * emitter.off([ 'event', 'nested' ], callback)
 * ```
 *
 * @param {String|Array} event _optional_
 * @param {Function} callback _optional_
 * @alias removeListener
 * @alias removeAllListeners
 * @name off
 * @api public
 */

EnhancedEmitter.prototype.off = EnhancedEmitter.prototype.removeListener = EnhancedEmitter.prototype.removeAllListeners = function (ev, fn) {
  var argc = arguments.length
  if (!this._events || argc === 0) {
    this._events = {}
    return this
  }

  function exists (obj) {
    for (var name in obj) {
      if (obj[name] && name != '_') return false
    }

    return true
  }

  function clean (event) {
    if (fn && 'function' === typeof fn) {
      for (var i = 0; i < event._.length; i++)
        if (fn == event._[i]) event._.splice(i, 1)
      if (event._.length === 0) event._ = null
      // if (event._ && event._.length == 1) event._ = event._[0]
    } else {
      event._ = null
    }

    if (!event._ && exists(event)) event = null
    return event
  }

  function iterate (events, map) {
    var event = events.shift()
    if (map[event] && map[event]._ && !events.length) map[event] = clean(map[event])
    if (map[event] && events.length) map[event] = iterate(events, map[event])
    if (!map[event] && exists(map)) map = null
    return map
  }

  var evs = is_array(ev) ? ev.slice(0) : ev.split(this._drip.delimeter)

  if (evs.length === 1 && argc === 1) {
    if (this._events[ev]) this._events[ev]._ = null
    return this
  } else {
    this._events = iterate(evs, this._events)
  }

  return this
}

/**
 * ### .emit (event[, args], [...])
 *
 * Trigger `event`, passing any arguments to callback functions.
 *
 * ```js
 * emitter.emit('event', arg, ...)
 * emitter.emit('event:nested', arg, ...)
 * emitter.emit([ 'event', 'nested' ], arg, ...)
 * ```
 *
 * @param {String} event name
 * @param {Mixed} multiple parameters to pass to callback functions
 * @name emit
 * @api public
 */

EnhancedEmitter.prototype.emit = function (ev, arg1, arg2) {
  var evs = is_array(ev) ? ev.slice(0) : ev.split(this._drip.delimeter)
  var fns = this._events ? traverse(evs, this._events) : []
  var a

  if (!fns.length && evs.length === 1 && evs[0] === 'error') {
    throw arg1 || new Error('EnhancedEmitter "error" event without argument.')
  } else if (!fns.length) {
    return false
  }

  var argc = arguments.length
  for (var i = 0; i < fns.length; i++) {
    if (argc === 1) {
      fns[i].call(this)
    } else if (argc === 2) {
      fns[i].call(this, arg1)
    } else if (argc === 3) {
      fns[i].call(this, arg1, arg2)
    } else {
      if (!a) {
        a = Array(argc - 1)
        for (var i2 = 1; i2 < argc; i2++) {
          a[i2 - 1] = arguments[i2]
        }
      }

      fns[i].apply(this, a)
    }
  }

  return true
}

/**
 * ### .hasListener (ev[, function])
 *
 * Determine if an event has listeners. If a function
 * is proved will determine if that function is a
 * part of the listeners.
 *
 * @param {String|Array} event key to seach for
 * @param {Function} optional function to check
 * @returns {Boolean} found
 * @name hasListeners
 * @api public
 */

EnhancedEmitter.prototype.hasListener = function (ev, fn) {
  if (!this._events) return false
  var evs = is_array(ev) ? ev.slice(0) : ev.split(this._drip.delimeter)
  var fns = traverse(evs, this._events)
  if (fns.length === 0) return false
  return common.hasListener(fns, fn)
}

/**
 * ### .listeners (ev)
 *
 * Retrieve an array of all of the listners for speciific
 * event. Wildcard events will also be included.
 *
 * @param {String} event
 * @return {Array} callbacks
 * @name listeners
 * @api public
 */

EnhancedEmitter.prototype.listeners = function (ev) {
  if (!this._events) return []
  var evs = is_array(ev) ? ev.slice(0) : ev.split(this._drip.delimeter)
  var fns = traverse(evs, this._events)
  return fns
}

/**
 * ### .bindEvent (event, target)
 *
 * A bound event will listen for events on the current emitter
 * instance and emit them on the target when they occur. This
 * functionality is compable with node event emitter. Wildcarded
 * events on this instance will be emitted using the delimeter
 * on the target.
 *
 * ```js
 * emitter.bindEvent('request', target)
 * emitter.bindEvent('server:request', target)
 * emitter.bindEvent([ 'server', 'request' ], target)
 * ```
 *
 * Note that proxies will also be removed if a generic `off` call
 * is used.
 *
 * @param {String|Array} event key to bind
 * @param {Object} target drip or node compatible event emitter
 * @name bindEvent
 * @api public
 */

EnhancedEmitter.prototype.bindEvent = common.bindEvent

/**
 * ### .unbindEvent (event, target)
 *
 * Remove a bound event listener. Event and target
 * must be provied the same as in `bindEvent`.
 *
 * ```js
 * emitter.unbindEvent('request', target)
 * emitter.unbindEvent('server:request', target)
 * emitter.unbindEvent([ 'server', 'request' ], target)
 * ```
 *
 * @param {String|Array} event key to bind
 * @param {Object} target drip or node compatible event emitter
 * @name unbindEvent
 * @api public
 */

EnhancedEmitter.prototype.unbindEvent = common.unbindEvent

/**
 * ### .proxyEvent (event, [namespace], target)
 *
 * An event proxy will listen for events on a different
 * event emitter and emit them on the current drip instance
 * when they occur. An optional namespace will be pre-pended
 * to the event when they are emitted on the current drip
 * instance.
 *
 * For example, the following will demonstrate a
 * namspacing pattern for node.
 *
 * ```js
 * function ProxyServer (port) {
 *   Drip.call(this, { delimeter: ':' })
 *   this.server = http.createServer().listen(port)
 *   this.bindEvent('request', 'server', this.server)
 * }
 * ```
 *
 * Anytime `this.server` emits a `request` event, it will be
 * emitted on the constructed ProxyServer as `server:request`.
 * All arguments included in the original emit will also be
 * available.
 *
 * ```js
 * var proxy = new ProxyServer(8080)
 *   proxy.on('server:request', function (req, res) {
 *   // ..
 * })
 * ```
 *
 * If you decide to use the namespace option, you can namespace
 * as deep as you like using either an array or a string that
 * uses your delimeter. The following examples are valid.
 *
 * ```js
 * emitter.proxyEvent('request', 'proxy:server', server)
 * emitter.proxyEvent('request', [ 'proxy', 'server' ], server)
 * emitter.on('proxy:server:request', cb)
 * ```
 *
 * @param {String|Array} event key to proxy
 * @param {String} namespace to prepend to this emit
 * @param {Object} target event emitter
 * @name proxyEvent
 * @api public
 */

EnhancedEmitter.prototype.proxyEvent = common.proxyEvent

/**
 * ### .unproxyEvent (event, [namespace], target)
 *
 * Remove an event proxy by removing the listening event
 * from the target. Don't forget to include a namespace
 * if it was used during `bindEvent`.
 *
 * ```js
 * proxy.unbindEvent('request', proxy.server)
 * proxy.unbindEvent('request', 'request', proxy.server)
 * ```
 *
 * @param {String|Array} event key to proxy
 * @param {String} namespace to prepend to this emit
 * @param {Object} target event emitter
 * @name unproxyEvent
 * @api public
 */

EnhancedEmitter.prototype.unproxyEvent = common.unproxyEvent

/*!
 * Traverse through a wildcard event tree
 * and determine which callbacks match the
 * given lookup. Recursive. Returns array
 * of events at that level and all subsequent
 * levels.
 *
 * @param {Array} event lookup
 * @param {Object} events tree to search
 * @api private
 */

function traverse (events, map) {
  var event = events.shift()
  var fns = []
  var arr1, arr2, l, trav

  if (event !== '*' && map[event] && map[event]._ && !events.length) {
    if ('function' == typeof map[event]._) {
      fns.push(map[event]._)
    } else {
      fns = concat(fns, map[event]._)
    }
  }

  if (map['*'] && map['*']._ && !events.length) {
    if ('function' == typeof map['*']._) {
      fns.push(map['*']._)
    } else {
      fns = concat(fns, map['*']._)
    }
  }

  if (events.length && (map[event] || map['*'])) {
    l = events.length
    arr1 = Array(l)
    arr2 = Array(l)

    for (var i = 0; i < l; i++) {
      arr1[i] = events[i]
      arr2[i] = events[i]
    }

    if (map[event]) {
      trav = traverse(arr1, map[event])
      fns = concat(fns, trav)
    }

    if (map['*']) {
      trav = traverse(arr2, map['*'])
      fns = concat(fns, trav)
    }
  }

  return fns
}

export default EnhancedEmitter
