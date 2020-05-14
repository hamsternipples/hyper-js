/**
 * Phoenix Channels JavaScript client
 *
 * ## Socket Connection
 *
 * A single connection is established to the server and
 * channels are multiplexed over the connection.
 * Connect to the server using the `Socket` class:
 *
 * ```javascript
 * let socket = new Socket("/socket", {params: {userToken: "123"}})
 * socket.connect()
 * ```
 *
 * The `Socket` constructor takes the mount point of the socket,
 * the authentication params, as well as options that can be found in
 * the Socket docs, such as configuring the heartbeat.
 *
 * ## Channels
 *
 * Channels are isolated, concurrent processes on the server that
 * subscribe to topics and broker events between the client and server.
 * To join a channel, you must provide the topic, and channel params for
 * authorization. Here's an example chat room example where `"new_msg"`
 * events are listened for, messages are pushed to the server, and
 * the channel is joined with ok/error/timeout matches:
 *
 * ```javascript
 * let channel = socket.channel("room:123", {token: roomToken})
 * channel.on("new_msg", msg => console.log("Got message", msg) )
 * $input.onEnter( e => {
 *   channel.push("new_msg", {body: e.target.val}, 10000)
 *     .receive("ok", (msg) => console.log("created message", msg) )
 *     .receive("error", (reasons) => console.log("create failed", reasons) )
 *     .receive("timeout", () => console.log("Networking issue...") )
 * })
 *
 * channel.join()
 *   .receive("ok", ({messages}) => console.log("catching up", messages) )
 *   .receive("error", ({reason}) => console.log("failed join", reason) )
 *   .receive("timeout", () => console.log("Networking issue. Still waiting..."))
 *```
 *
 * ## Joining
 *
 * Creating a channel with `socket.channel(topic, params)`, binds the params to
 * `channel.params`, which are sent up on `channel.join()`.
 * Subsequent rejoins will send up the modified params for
 * updating authorization params, or passing up last_message_id information.
 * Successful joins receive an "ok" status, while unsuccessful joins
 * receive "error".
 *
 * ## Duplicate Join Subscriptions
 *
 * While the client may join any number of topics on any number of channels,
 * the client may only hold a single subscription for each unique topic at any
 * given time. When attempting to create a duplicate subscription,
 * the server will close the existing channel, log a warning, and
 * spawn a new channel for the topic. The client will have their
 * `channel.onClose` callbacks fired for the existing channel, and the new
 * channel join will have its receive hooks processed as normal.
 *
 * ## Pushing Messages
 *
 * From the previous example, we can see that pushing messages to the server
 * can be done with `channel.push(eventName, payload)` and we can optionally
 * receive responses from the push. Additionally, we can use
 * `receive("timeout", callback)` to abort waiting for our other `receive` hooks
 *  and take action after some period of waiting. The default timeout is 10000ms.
 *
 *
 * ## Socket Hooks
 *
 * Lifecycle events of the multiplexed connection can be hooked into via
 * `socket.onError()` and `socket.onClose()` events, ie:
 *
 * ```javascript
 * socket.onError( () => console.log("there was an error with the connection!") )
 * socket.onClose( () => console.log("the connection dropped") )
 * ```
 *
 *
 * ## Channel Hooks
 *
 * For each joined channel, you can bind to `onError` and `onClose` events
 * to monitor the channel lifecycle, ie:
 *
 * ```javascript
 * channel.onError( () => console.log("there was an error!") )
 * channel.onClose( () => console.log("the channel has gone away gracefully") )
 * ```
 *
 * ### onError hooks
 *
 * `onError` hooks are invoked if the socket connection drops, or the channel
 * crashes on the server. In either case, a channel rejoin is attempted
 * automatically in an exponential backoff manner.
 *
 * ### onClose hooks
 *
 * `onClose` hooks are invoked only in two cases. 1) the channel explicitly
 * closed on the server, or 2). The client explicitly closed, by calling
 * `channel.leave()`
 *
 *
 * ## Presence
 *
 * The `Presence` object provides features for syncing presence information
 * from the server with the client and handling presences joining and leaving.
 *
 * ### Syncing state from the server
 *
 * To sync presence state from the server, first instantiate an object and
 * pass your channel in to track lifecycle events:
 *
 * ```javascript
 * let channel = socket.channel("some:topic")
 * let presence = new Presence(channel)
 * ```
 *
 * Next, use the `presence.onSync` callback to react to state changes
 * from the server. For example, to render the list of users every time
 * the list changes, you could write:
 *
 * ```javascript
 * presence.onSync(() => {
 *   myRenderUsersFunction(presence.list())
 * })
 * ```
 *
 * ### Listing Presences
 *
 * `presence.list` is used to return a list of presence information
 * based on the local state of metadata. By default, all presence
 * metadata is returned, but a `listBy` function can be supplied to
 * allow the client to select which metadata to use for a given presence.
 * For example, you may have a user online from different devices with
 * a metadata status of "online", but they have set themselves to "away"
 * on another device. In this case, the app may choose to use the "away"
 * status for what appears on the UI. The example below defines a `listBy`
 * function which prioritizes the first metadata which was registered for
 * each user. This could be the first tab they opened, or the first device
 * they came online from:
 *
 * ```javascript
 * let listBy = (id, {metas: [first, ...rest]}) => {
 *   first.count = rest.length + 1 // count of this user's presences
 *   first.id = id
 *   return first
 * }
 * let onlineUsers = presence.list(listBy)
 * ```
 *
 * ### Handling individual presence join and leave events
 *
 * The `presence.onJoin` and `presence.onLeave` callbacks can be used to
 * react to individual presences joining and leaving the app. For example:
 *
 * ```javascript
 * let presence = new Presence(channel)
 *
 * // detect if user has joined for the 1st time or from another tab/device
 * presence.onJoin((id, current, newPres) => {
 *   if(!current){
 *     console.log("user has entered for the first time", newPres)
 *   } else {
 *     console.log("user additional presence", newPres)
 *   }
 * })
 *
 * // detect if user has left from all tabs/devices, or is still present
 * presence.onLeave((id, current, leftPres) => {
 *   if(current.metas.length === 0){
 *     console.log("user has left from all devices", leftPres)
 *   } else {
 *     console.log("user left from a device", leftPres)
 *   }
 * })
 * // receive presence data from server
 * presence.onSync(() => {
 *   displayUsers(presence.list())
 * })
 * ```
 * @module phoenix
 */

import { error, noop, is_fn, is_void, is_nil, is_obj } from '@hyper/global'
import { win, WebSocket } from '@hyper/global'
import { setTimeout, setInterval } from '@hyper/global'
import { clearTimeout, clearInterval } from '@hyper/global'
import { each } from '@hyper/array'
import { on } from '@hyper/dom-base'




// ---------------
// ---------------
//   old version
// ---------------
// ---------------

const DEFAULT_VSN = '2.0.0'
const SOCKET_STATE_CONNECTING = 0
const SOCKET_STATE_OPEN = 1
const SOCKET_STATE_CLOSING = 2
const SOCKET_STATE_CLOSED = 3

const DEFAULT_TIMEOUT = 10000
const WS_CLOSE_NORMAL = 1000

const CHANNEL_STATE_CLOSED = 1
const CHANNEL_STATE_JOINING = 2
const CHANNEL_STATE_JOINED = 3
const CHANNEL_STATE_LEAVING = 4
const CHANNEL_STATE_ERRORED = 9

const CHANNEL_LIFECYCLE_EVENTS = [
  'phx_close',
  'phx_join',
  'phx_reply',
  'phx_leave',
  'phx_error',
]

// wraps value in closure or returns closure
let closure = (value) => {
  if (is_fn(value)) {
    return value
  } else {
    return () => value
  }
}

/**
 * Initializes the Push
 * @param {Channel} channel - The Channel
 * @param {string} event - The event, for example `"phx_join"`
 * @param {Object} payload - The payload, for example `{user_id: 123}`
 * @param {number} timeout - The push timeout in milliseconds
 */
class Push {
  constructor (channel, event, payload, timeout) {
    this.channel = channel
    this.event = event
    this.payload = payload || (() => ({}))
    this.receivedResp = null
    this.timeout = timeout
    this.timeoutTimer = null
    this.recHooks = []
    this.sent = false
  }

  /**
   *
   * @param {number} timeout
   */
  resend (timeout) {
    this.timeout = timeout
    this.reset()
    this.send()
  }

  /**
   *
   */
  send () {
    if (this.hasReceived('timeout')) return
    this.startTimeout()
    this.sent = true
    this.channel.socket.push({
      topic: this.channel.topic,
      event: this.event,
      payload: this.payload(),
      ref: this.ref,
      join_ref: this.channel.joinRef()
    })
  }

  /**
   *
   * @param {*} status
   * @param {*} callback
   */
  receive (status, callback) {
    if (this.hasReceived(status)) {
      callback(this.receivedResp.response)
    }

    this.recHooks.push({status, callback})
    return this
  }

  /**
   * @private
   */
  reset () {
    this.cancelRefEvent()
    this.ref = null
    this.refEvent = null
    this.receivedResp = null
    this.sent = false
  }

  /**
   * @private
   */
  cancelRefEvent () {
    if (this.refEvent) this.channel.off(this.refEvent)
  }

  /**
   * @private
   */
  cancelTimeout () {
    clearTimeout(this.timeoutTimer)
    this.timeoutTimer = null
  }

  /**
   * @private
   */
  startTimeout () {
    if (this.timeoutTimer) this.cancelTimeout()
    this.ref = this.channel.socket.makeRef()
    this.refEvent = `chan_reply_${this.ref}`

    this.channel.on(this.refEvent, payload => {
      let {status, response} = payload
      this.cancelRefEvent()
      this.cancelTimeout()
      this.receivedResp = payload
      each(this.recHooks, hook => {
        if (hook.status === status) hook.callback(response)
      })
    })

    this.timeoutTimer = setTimeout(() => {
      this.trigger('timeout', {})
    }, this.timeout)
  }

  /**
   * @private
   */
  hasReceived (status) {
    return this.receivedResp && this.receivedResp.status === status
  }

  /**
   * @private
   */
  trigger (status, response) {
    this.channel.trigger(this.refEvent, {status, response})
  }
}

/**
 *
 * @param {string} topic
 * @param {(Object|function)} params
 * @param {Socket} socket
 */
export class Channel {
  constructor (topic, params, socket) {
    this.state = CHANNEL_STATE_CLOSED
    this.topic = topic
    this.params = closure(params || {})
    this.socket = socket
    this.bindings = []
    this.bindingRef = 0
    this.timeout = this.socket.timeout
    this.has_joined = false
    this.joinPush = new Push(this, 'phx_join', this.params, this.timeout)
    this.pushBuffer = []
    this.stateChangeRefs = []

    this.rejoinTimer = new Timer(() => {
      if (this.socket.isConnected()) this.rejoin()
    }, this.socket.rejoinAfterMs)

    this.stateChangeRefs.push(
      this.socket.onError(() => this.rejoinTimer.reset())
    )
    this.stateChangeRefs.push(
      this.socket.onOpen(() => {
        this.rejoinTimer.reset()
        if (this.state === CHANNEL_STATE_ERRORED) this.rejoin()
      })
    )
    this.joinPush.receive('ok', () => {
      this.state = CHANNEL_STATE_JOINED
      this.rejoinTimer.reset()
      each(this.pushBuffer, pushEvent => pushEvent.send())
      this.pushBuffer = []
    })
    this.joinPush.receive('error', () => {
      this.state = CHANNEL_STATE_ERRORED
      if (this.socket.isConnected()) this.rejoinTimer.scheduleTimeout()
    })
    this.onClose(() => {
      this.rejoinTimer.reset()
      if (this.socket.logger) this.socket.log('channel', `close ${this.topic} ${this.joinRef()}`)
      this.state = CHANNEL_STATE_CLOSED
      this.socket.remove(this)
    })
    this.onError(reason => {
      if (this.socket.logger) this.socket.log('channel', `error ${this.topic}`, reason)
      if (this.state === CHANNEL_STATE_JOINING) this.joinPush.reset()
      this.state = CHANNEL_STATE_ERRORED
      if (this.socket.isConnected()) this.rejoinTimer.scheduleTimeout()
    })
    this.joinPush.receive('timeout', () => {
      if (this.socket.logger) {
        this.socket.log('channel', `timeout ${this.topic} (${this.joinRef()})`, this.joinPush.timeout)
      }
      let leavePush = new Push(this, 'phx_leave', closure({}), this.timeout)
      leavePush.send()
      this.state = CHANNEL_STATE_ERRORED
      this.joinPush.reset()
      if (this.socket.isConnected()) this.rejoinTimer.scheduleTimeout()
    })
    this.on('phx_reply', (payload, ref) => {
      this.trigger(`chan_reply_${ref}`, payload)
    })
  }

  /**
   * Join the channel
   * @param {integer} timeout
   * @returns {Push}
   */
  join (timeout = this.timeout) {
    if (this.has_joined) {
      error(`tried to join multiple times. 'join' can only be called a single time per channel instance`)
    } else {
      this.timeout = timeout
      this.has_joined = true
      this.rejoin()
      return this.joinPush
    }
  }

  /**
   * Hook into channel close
   * @param {Function} callback
   */
  onClose (callback) {
    this.on('phx_close', callback)
  }

  /**
   * Hook into channel errors
   * @param {Function} callback
   */
  onError (callback) {
    return this.on('phx_error', reason => callback(reason))
  }

  /**
   * Subscribes on channel events
   *
   * Subscription returns a ref counter, which can be used later to
   * unsubscribe the exact event listener
   *
   * @example
   * const ref1 = channel.on("event", do_stuff)
   * const ref2 = channel.on("event", do_other_stuff)
   * channel.off("event", ref1)
   * // Since unsubscription, do_stuff won't fire,
   * // while do_other_stuff will keep firing on the "event"
   *
   * @param {string} event
   * @param {Function} callback
   * @returns {integer} ref
   */
  on (event, callback) {
    let ref = this.bindingRef++
    this.bindings.push({event, ref, callback})
    return ref
  }

  /**
   * Unsubscribes off of channel events
   *
   * Use the ref returned from a channel.on() to unsubscribe one
   * handler, or pass nothing for the ref to unsubscribe all
   * handlers for the given event.
   *
   * @example
   * // Unsubscribe the do_stuff handler
   * const ref1 = channel.on("event", do_stuff)
   * channel.off("event", ref1)
   *
   * // Unsubscribe all handlers from event
   * channel.off("event")
   *
   * @param {string} event
   * @param {integer} ref
   */
  off (event, ref) {
    this.bindings = this.bindings.filter((bind) => {
      return !(bind.event === event && (is_void(ref) || ref === bind.ref))
    })
  }

  /**
   * @private
   */
  canPush () {
    return this.socket.isConnected() && this.state === CHANNEL_STATE_JOINED
  }

  /**
   * Sends a message `event` to phoenix with the payload `payload`.
   * Phoenix receives this in the `handle_in(event, payload, socket)`
   * function. if phoenix replies or it times out (default 10000ms),
   * then optionally the reply can be received.
   *
   * @example
   * channel.push("event")
   *   .receive("ok", payload => { console.log("phoenix replied:", payload) })
   *   .receive("error", err => { console.log("phoenix errored", err) })
   *   .receive("timeout", () => { console.log("timed out pushing") })
   *
   * @param {string} event
   * @param {Object} payload
   * @param {number} [timeout]
   * @returns {Push}
   */
  push (event, payload, timeout = this.timeout) {
    if (!this.has_joined) {
      error(`tried to push '${event}' to '${this.topic}' before joining. Use channel.join() before pushing events`)
    }
    let pushEvent = new Push(this, event, (() => payload), timeout)
    if (this.canPush()) {
      pushEvent.send()
    } else {
      pushEvent.startTimeout()
      this.pushBuffer.push(pushEvent)
    }

    return pushEvent
  }

  /** Leaves the channel
   *
   * Unsubscribes from server events, and
   * instructs channel to terminate on server
   *
   * Triggers onClose() hooks
   *
   * To receive leave acknowledgements, use the a `receive`
   * hook to bind to the server ack, ie:
   *
   * @example
   * channel.leave().receive("ok", () => alert("left!") )
   *
   * @param {integer} timeout
   * @returns {Push}
   */
  leave (timeout = this.timeout) {
    this.rejoinTimer.reset()
    this.joinPush.cancelTimeout()

    this.state = CHANNEL_STATE_LEAVING
    let onClose = () => {
      if (this.socket.logger) this.socket.log('channel', `leave ${this.topic}`)
      this.trigger('phx_close', 'leave')
    }
    let leavePush = new Push(this, 'phx_leave', closure({}), timeout)
    leavePush
      .receive('ok', onClose)
      .receive('timeout', onClose)
    leavePush.send()
    if (!this.canPush()) leavePush.trigger('ok', {})

    return leavePush
  }

  /**
   * @private
   */
  isMember (topic, event, payload, joinRef) {
    if (this.topic !== topic) return false
    if (joinRef && joinRef !== this.joinRef() && ~CHANNEL_LIFECYCLE_EVENTS.indexOf(event)) {
      if (this.socket.logger) this.socket.log('channel', 'dropping outdated message', {topic, event, payload, joinRef})
      return false
    } else {
      return true
    }
  }

  /**
   * @private
   */
  joinRef () { return this.joinPush.ref }

  /**
   * @private
   */
  sendJoin (timeout) {
    this.state = CHANNEL_STATE_JOINING
    this.joinPush.resend(timeout)
  }

  /**
   * @private
   */
  rejoin (timeout = this.timeout) {
    if (this.state !== CHANNEL_STATE_LEAVING) this.sendJoin(timeout)
  }

  /**
   * @private
   */
  trigger (event, payload, ref, joinRef) {
    for (let i = 0; i < this.bindings.length; i++) {
      const bind = this.bindings[i]
      if (bind.event !== event) continue
      bind.callback(payload, ref, joinRef || this.joinRef())
    }
  }
}

/* The default serializer for encoding and decoding messages */
export let Serializer = {
  encode(msg, callback) {
    let payload = [
      msg.join_ref, msg.ref, msg.topic, msg.event, msg.payload
    ]
    return callback(JSON.stringify(payload))
  },

  decode(rawPayload, callback) {
    let [join_ref, ref, topic, event, payload] = JSON.parse(rawPayload)

    return callback({join_ref, ref, topic, event, payload})
  }
}

/** Initializes the Socket
 *
 *
 * Ancient browsers are not supported.
 *
 * @param {string} endPoint - The string WebSocket endpoint, ie, `"ws://example.com/socket"`,
 *                                               `"wss://example.com"`
 *                                               `"/socket"` (inherited host & protocol)
 * @param {Object} [opts] - Optional configuration
 * @param {string} [opts.transport] - The Websocket Transport, for example WebSocket.
 *
 * Defaults to WebSocket.
 * @param {Function} [opts.encode] - The function to encode outgoing messages.
 *
 * Defaults to JSON encoder.
 *
 * @param {Function} [opts.decode] - The function to decode incoming messages.
 *
 * Defaults to JSON:
 *
 * ```javascript
 * (payload, callback) => callback(JSON.parse(payload))
 * ```
 *
 * @param {number} [opts.timeout] - The default timeout in milliseconds to trigger push timeouts.
 *
 * Defaults `DEFAULT_TIMEOUT`
 * @param {number} [opts.heartbeatIntervalMs] - The millisec interval to send a heartbeat message
 * @param {number} [opts.reconnectAfterMs] - The optional function that returns the millsec
 * socket reconnect interval.
 *
 * Defaults to stepped backoff of:
 *
 * ```javascript
 * function(tries){
 *   return [10, 50, 100, 150, 200, 250, 500, 1000, 2000][tries - 1] || 5000
 * }
 * ````
 *
 * @param {number} [opts.rejoinAfterMs] - The optional function that returns the millsec
 * rejoin interval for individual channels.
 *
 * ```javascript
 * function(tries){
 *   return [1000, 2000, 5000][tries - 1] || 10000
 * }
 * ````
 *
 * @param {Function} [opts.logger] - The optional function for specialized logging, ie:
 *
 * ```javascript
 * function(kind, msg, data) {
 *   console.log(`${kind}: ${msg}`, data)
 * }
 * ```
 *
 * @param {number} [opts.longpollerTimeout] - The maximum timeout of a long poll AJAX request.
 *
 * Defaults to 20s (double the server long poll timer).
 *
 * @param {{Object|function)} [opts.params] - The optional params to pass when connecting
 * @param {string} [opts.binaryType] - The binary type to use for binary WebSocket frames.
 *
 * Defaults to "arraybuffer"
 *
 * @param {vsn} [opts.vsn] - The serializer's protocol version to send on connect.
 *
 * Defaults to DEFAULT_VSN.
*/
export class Socket {
  constructor (endPoint, opts = {}) {
    this.stateChangeCallbacks = {open: [], close: [], error: [], message: []}
    this.channels = []
    this.sendBuffer = []
    this.ref = 0
    this.timeout = opts.timeout || DEFAULT_TIMEOUT
    this.transport = opts.transport || WebSocket
    this.closeWasClean = false
    this.unloaded = false
    this.binaryType = opts.binaryType || 'arraybuffer'
    this.encode = opts.encode || Serializer.encode
    this.decode = opts.decode || Serializer.decode

    on(win, 'unload', e => {
      if (this.conn) {
        this.unloaded = true
        this.abnormalClose('unloaded')
      }
    })
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs || 30000
    this.rejoinAfterMs = (tries) => {
      if (opts.rejoinAfterMs) {
        return opts.rejoinAfterMs(tries)
      } else {
        return [1000, 2000, 5000][tries - 1] || 10000
      }
    }
    this.reconnectAfterMs = (tries) => {
      if (this.unloaded) return 100
      if (opts.reconnectAfterMs) {
        return opts.reconnectAfterMs(tries)
      } else {
        return [10, 50, 100, 150, 200, 250, 500, 1000, 2000][tries - 1] || 5000
      }
    }
    this.logger = opts.logger || null
    this.longpollerTimeout = opts.longpollerTimeout || 20000
    this.params = closure(opts.params || {})
    this.endPoint = `${endPoint}/${'websocket'}`
    this.vsn = opts.vsn || DEFAULT_VSN
    this.heartbeatTimer = null
    this.pendingHeartbeatRef = null
    this.reconnectTimer = new Timer(() => {
      this.teardown(() => this.connect())
    }, this.reconnectAfterMs)
  }


  /**
   * The fully qualifed socket url
   *
   * @returns {string}
   */
  endPointURL () {

  }

  /**
   * Disconnects the socket
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes for valid status codes.
   *
   * @param {Function} callback - Optional callback which is called after socket is disconnected.
   * @param {integer} code - A status code for disconnection (Optional).
   * @param {string} reason - A textual description of the reason to disconnect. (Optional)
   */
  disconnect (callback, code, reason) {
    this.closeWasClean = true
    this.reconnectTimer.reset()
    this.teardown(callback, code, reason)
  }

  /**
   * Connects the socket
   */
  connect () {
    if (!this.conn) {
      this.closeWasClean = false
      this.endPointURL = (() => {
        var protocol = location.protocol.match(/^https/) ? 'wss' : 'ws'
        var uri = appendParams(
          appendParams(this.endPoint, this.params()), {vsn: this.vsn})
        if (uri[0] !== '/') return uri
        if (uri[1] === '/') return `${protocol}:${uri}`
        return `${protocol}://${location.host}${uri}`
      })()

      this.conn = new this.transport(this.endPointURL)
      this.conn.binaryType = this.binaryType
      this.conn.timeout = this.longpollerTimeout
      this.conn.onopen = () => this.onConnOpen()
      this.conn.onerror = error => this.onConnError(error)
      this.conn.onmessage = event => this.onConnMessage(event)
      this.conn.onclose = event => this.onConnClose(event)
    }
  }

  /**
   * Logs the message. Override `this.logger` for specialized logging. noops by default
   * @param {string} kind
   * @param {string} msg
   * @param {Object} data
   */
  log (kind, msg, data) {
    this.logger(kind, msg, data)
  }

  /**
   * Returns true if a logger has been set on this socket.
   */
  hasLogger () { return this.logger !== null }

  /**
   * Registers callbacks for connection open events
   *
   * @example socket.onOpen(function(){ console.info("the socket was opened") })
   *
   * @param {Function} callback
   */
  onOpen (callback) {
    let ref = this.makeRef()
    this.stateChangeCallbacks.open.push([ref, callback])
    return ref
  }

  /**
   * Registers callbacks for connection close events
   * @param {Function} callback
   */
  onClose (callback) {
    let ref = this.makeRef()
    this.stateChangeCallbacks.close.push([ref, callback])
    return ref
  }

  /**
   * Registers callbacks for connection error events
   *
   * @example socket.onError(function(error){ alert("An error occurred") })
   *
   * @param {Function} callback
   */
  onError (callback) {
    let ref = this.makeRef()
    this.stateChangeCallbacks.error.push([ref, callback])
    return ref
  }

  /**
   * Registers callbacks for connection message events
   * @param {Function} callback
   */
  onMessage (callback) {
    let ref = this.makeRef()
    this.stateChangeCallbacks.message.push([ref, callback])
    return ref
  }

  /**
   * @private
   */
  onConnOpen () {
    if (this.logger) this.log('transport', `connected to ${this.endPointURL}`)
    this.unloaded = false
    this.closeWasClean = false
    this.flushSendBuffer()
    this.reconnectTimer.reset()
    this.resetHeartbeat()
    each(this.stateChangeCallbacks.open, ([, callback]) => callback())
  }

  /**
   * @private
   */

  resetHeartbeat () {
    if (this.conn && this.conn.skipHeartbeat) return
    this.pendingHeartbeatRef = null
    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs)
  }

  teardown (callback, code, reason) {
    if (this.conn) {
      this.conn.onclose = noop // noop
      if (code) this.conn.close(code, reason || '')
      else this.conn.close()
      this.conn = null
    }
    callback && callback()
  }

  onConnClose (event) {
    if (this.logger) this.log('transport', 'close', event)
    this.triggerChanError()
    clearInterval(this.heartbeatTimer)
    if (!this.closeWasClean) {
      this.reconnectTimer.scheduleTimeout()
    }
    each(this.stateChangeCallbacks.close, ([, callback]) => callback(event))
  }

  /**
   * @private
   */
  onConnError (error) {
    if (this.logger) this.log('transport', error)
    this.triggerChanError()
    each(this.stateChangeCallbacks.error, ([, callback]) => callback(error))
  }

  /**
   * @private
   */
  triggerChanError () {
    each(this.channels, channel => {
      if (!~[CHANNEL_STATE_ERRORED, CHANNEL_STATE_LEAVING, CHANNEL_STATE_CLOSED].indexOf(channel.state)) {
        channel.trigger('phx_error')
      }
    })
  }

  /**
   * @returns {boolean}
   */
  isConnected () {
    return this.conn && this.conn.readyState === SOCKET_STATE_OPEN
  }

  /**
   * @private
   *
   * @param {Channel}
   */
  remove (channel) {
    this.off(channel.stateChangeRefs)
    this.channels = this.channels.filter(c => c.joinRef() !== channel.joinRef())
  }

  /**
   * Removes `onOpen`, `onClose`, `onError,` and `onMessage` registrations.
   *
   * @param {refs} - list of refs returned by calls to
   *                 `onOpen`, `onClose`, `onError,` and `onMessage`
   */
  off (refs) {
    for (let key in this.stateChangeCallbacks) {
      this.stateChangeCallbacks[key] = this.stateChangeCallbacks[key].filter(([ref]) => {
        return !refs.includes(ref)
      })
    }
  }

  /**
   * Initiates a new channel for the given topic
   *
   * @param {string} topic
   * @param {Object} chanParams - Parameters for the channel
   * @returns {Channel}
   */
  channel (topic, chanParams = {}) {
    let chan = new Channel(topic, chanParams, this)
    this.channels.push(chan)
    return chan
  }

  /**
   * @param {Object} data
   */
  push (data) {
    if (this.logger) {
      let {topic, event, payload, ref, join_ref} = data
      this.log('push', `${topic} ${event} (${join_ref}, ${ref})`, payload)
    }

    if (this.isConnected()) {
      this.encode(data, result => this.conn.send(result))
    } else {
      this.sendBuffer.push(() => this.encode(data, result => this.conn.send(result)))
    }
  }

  /**
   * Return the next message ref, accounting for overflows
   * @returns {string}
   */
  makeRef () {
    let newRef = this.ref + 1
    if (newRef === this.ref) this.ref = 0
    else this.ref = newRef

    return this.ref.toString()
  }

  sendHeartbeat () {
    if (!this.isConnected()) return
    if (this.pendingHeartbeatRef) {
      this.pendingHeartbeatRef = null
      if (this.logger) this.log('transport', 'heartbeat timeout. Attempting to re-establish connection')
      this.abnormalClose('heartbeat timeout')
      return
    }
    this.pendingHeartbeatRef = this.makeRef()
    this.push({topic: 'phoenix', event: 'heartbeat', payload: {}, ref: this.pendingHeartbeatRef})
  }

  abnormalClose (reason) {
    this.closeWasClean = false
    this.conn.close(WS_CLOSE_NORMAL, reason)
  }

  flushSendBuffer () {
    if (this.isConnected() && this.sendBuffer.length > 0) {
      each(this.sendBuffer, callback => callback())
      this.sendBuffer = []
    }
  }

  onConnMessage (rawMessage) {
    this.decode(rawMessage.data, msg => {
      let {topic, event, payload, ref, join_ref} = msg
      if (ref && ref === this.pendingHeartbeatRef) {
        this.pendingHeartbeatRef = null
      }

      if (this.logger) this.log('receive', `${payload.status || ""} ${topic} ${event} ${ref && "(" + ref + ")" || ""}`, payload)

      for (let i = 0; i < this.channels.length; i++) {
        const channel = this.channels[i]
        if (channel.isMember(topic, event, payload, join_ref)) {
          channel.trigger(event, payload, ref, join_ref)
        }
      }

      for (let i = 0; i < this.stateChangeCallbacks.message.length; i++) {
        let [, callback] = this.stateChangeCallbacks.message[i]
        callback(msg)
      }
    })
  }
}

const serialize = (obj, parentKey) => {
  var queryStr = []
  for (var key in obj) {
    if (is_nil(obj[key])) continue
    var paramKey = parentKey ? `${parentKey}[${key}]` : key
    var paramVal = obj[key]
    if (is_obj(paramVal)) {
      queryStr.push(this.serialize(paramVal, paramKey))
    } else {
      queryStr.push(encodeURIComponent(paramKey) + '=' + encodeURIComponent(paramVal))
    }
  }
  return queryStr.join('&')
}

const appendParams = (url, params) => {
  if (Object.keys(params).length === 0) return url

  let prefix = url.match(/\?/) ? '&' : '?'
  return `${url}${prefix}${serialize(params)}`
}

/**
 * Initializes the Presence
 * @param {Channel} channel - The Channel
 * @param {Object} opts - The options,
 *        for example `{events: {state: "state", diff: "diff"}}`
 */
export class Presence {

  constructor (channel, opts = {}) {
    let events = opts.events || {state: 'presence_state', diff: 'presence_diff'}
    this.state = {}
    this.pendingDiffs = []
    this.channel = channel
    this.joinRef = null
    this.caller = {
      onJoin: noop,
      onLeave: noop,
      onSync: noop
    }

    this.channel.on(events.state, newState => {
      let {onJoin, onLeave, onSync} = this.caller

      this.joinRef = this.channel.joinRef()
      this.state = Presence.syncState(this.state, newState, onJoin, onLeave)

      each(this.pendingDiffs, diff => {
        this.state = Presence.syncDiff(this.state, diff, onJoin, onLeave)
      })
      this.pendingDiffs = []
      onSync()
    })

    this.channel.on(events.diff, diff => {
      let {onJoin, onLeave, onSync} = this.caller

      if (this.inPendingSyncState()) {
        this.pendingDiffs.push(diff)
      } else {
        this.state = Presence.syncDiff(this.state, diff, onJoin, onLeave)
        onSync()
      }
    })
  }

  onJoin (callback) { this.caller.onJoin = callback }

  onLeave (callback) { this.caller.onLeave = callback }

  onSync (callback) { this.caller.onSync = callback }

  list (by) { return Presence.list(this.state, by) }

  inPendingSyncState () {
    return !this.joinRef || (this.joinRef !== this.channel.joinRef())
  }

  // lower-level public static API

  /**
   * Used to sync the list of presences on the server
   * with the client's state. An optional `onJoin` and `onLeave` callback can
   * be provided to react to changes in the client's local presences across
   * disconnects and reconnects with the server.
   *
   * @returns {Presence}
   */
  static syncState (currentState, newState, onJoin, onLeave) {
    let state = this.clone(currentState)
    let joins = {}
    let leaves = {}

    this.map(state, (key, presence) => {
      if (!newState[key]) {
        leaves[key] = presence
      }
    })
    this.map(newState, (key, newPresence) => {
      let currentPresence = state[key]
      if (currentPresence) {
        let newRefs = newPresence.metas.map(m => m.phx_ref)
        let curRefs = currentPresence.metas.map(m => m.phx_ref)
        let joinedMetas = newPresence.metas.filter(m => curRefs.indexOf(m.phx_ref) < 0)
        let leftMetas = currentPresence.metas.filter(m => newRefs.indexOf(m.phx_ref) < 0)
        if (joinedMetas.length > 0) {
          joins[key] = newPresence
          joins[key].metas = joinedMetas
        }
        if (leftMetas.length > 0) {
          leaves[key] = this.clone(currentPresence)
          leaves[key].metas = leftMetas
        }
      } else {
        joins[key] = newPresence
      }
    })
    return this.syncDiff(state, {joins: joins, leaves: leaves}, onJoin, onLeave)
  }

  /**
   *
   * Used to sync a diff of presence join and leave
   * events from the server, as they happen. Like `syncState`, `syncDiff`
   * accepts optional `onJoin` and `onLeave` callbacks to react to a user
   * joining or leaving from a device.
   *
   * @returns {Presence}
   */
  static syncDiff (currentState, {joins, leaves}, onJoin, onLeave) {
    let state = this.clone(currentState)
    if (!onJoin) { onJoin = noop }
    if (!onLeave) { onLeave = noop }

    this.map(joins, (key, newPresence) => {
      let currentPresence = state[key]
      state[key] = newPresence
      if (currentPresence) {
        let joinedRefs = state[key].metas.map(m => m.phx_ref)
        let curMetas = currentPresence.metas.filter(m => joinedRefs.indexOf(m.phx_ref) < 0)
        state[key].metas.unshift(...curMetas)
      }
      onJoin(key, currentPresence, newPresence)
    })
    this.map(leaves, (key, leftPresence) => {
      let currentPresence = state[key]
      if (!currentPresence) { return }
      let refsToRemove = leftPresence.metas.map(m => m.phx_ref)
      currentPresence.metas = currentPresence.metas.filter(p => {
        return refsToRemove.indexOf(p.phx_ref) < 0
      })
      onLeave(key, currentPresence, leftPresence)
      if (currentPresence.metas.length === 0) {
        delete state[key]
      }
    })
    return state
  }

  /**
   * Returns the array of presences, with selected metadata.
   *
   * @param {Object} presences
   * @param {Function} chooser
   *
   * @returns {Presence}
   */
  static list (presences, chooser) {
    if (!chooser) { chooser = function (key, pres) { return pres } }

    return this.map(presences, (key, presence) => {
      return chooser(key, presence)
    })
  }

  // private

  static map (obj, func) {
    return Object.getOwnPropertyNames(obj).map(key => func(key, obj[key]))
  }

  static clone (obj) { return JSON.parse(JSON.stringify(obj)) }
}

/**
 *
 * Creates a timer that accepts a `timerCalc` function to perform
 * calculated timeout retries, such as exponential backoff.
 *
 * @example
 * let reconnectTimer = new Timer(() => this.connect(), function(tries){
 *   return [1000, 5000, 10000][tries - 1] || 10000
 * })
 * reconnectTimer.scheduleTimeout() // fires after 1000
 * reconnectTimer.scheduleTimeout() // fires after 5000
 * reconnectTimer.reset()
 * reconnectTimer.scheduleTimeout() // fires after 1000
 *
 * @param {Function} callback
 * @param {Function} timerCalc
 */
class Timer {
  constructor (callback, timerCalc) {
    this.callback = callback
    this.timerCalc = timerCalc
    this.timer = null
    this.tries = 0
  }

  reset () {
    this.tries = 0
    clearTimeout(this.timer)
  }

  /**
   * Cancels any previous scheduleTimeout and schedules callback
   */
  scheduleTimeout () {
    clearTimeout(this.timer)

    this.timer = setTimeout(() => {
      this.tries = this.tries + 1
      this.callback()
    }, this.timerCalc(this.tries + 1))
  }
}
