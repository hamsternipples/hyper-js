// commonly used globals exported (to save a few bytes)
export const win = window
export const getComputedStyle = win.getComputedStyle
export const customElements = win.customElements
export const setTimeout = win.setTimeout
export const setInterval = win.setInterval
export const clearTimeout = win.clearTimeout
export const clearInterval = win.clearInterval
export const requestAnimationFrame = win.requestAnimationFrame

// shortcuts
export const doc = win.document
export const raf = win.requestAnimationFrame
export const nav = win.navigator
export const ua = nav.userAgent
export const Array = win.Array
export const Object = win.Object
export const Error = win.Error
export const WobSocket = win.WebSocket

export const is_array = Array.isArray
export const new_array = Array
export const slice = [].slice

export const abs = Math.abs
export const acos = Math.acos
export const acosh = Math.acosh
export const asin = Math.asin
export const asinh = Math.asinh
export const atan = Math.atan
export const atanh = Math.atanh
export const atan2 = Math.atan2
export const cbrt = Math.cbrt
export const ceil = Math.ceil
export const clz32 = Math.clz32
export const cos = Math.cos
export const cosh = Math.cosh
export const exp = Math.exp
export const expm1 = Math.expm1
export const floor = Math.floor
export const fround = Math.fround
export const hypot = Math.hypot
export const imul = Math.imul
export const log = Math.log
export const log1p = Math.log1p
export const log10 = Math.log10
export const log2 = Math.log2
export const max = Math.max
export const min = Math.min
export const pow = Math.pow
export const random = Math.random
export const round = Math.round
export const sign = Math.sign
export const sin = Math.sin
export const sinh = Math.sinh
export const sqrt = Math.sqrt
export const tan = Math.tan
export const tanh = Math.tanh

export const obj_is = Object.is
export const obj_keys = Object.keys
export const obj_values = Object.values
export const obj_create = Object.create
export const obj_assign = Object.assign

export const noop = () => {}
export const undefined = void 0
export const nil = null

// === basic stuff ===

export const error = (message, type = Error) => {
  if (message instanceof Error) throw message
  else throw new type(message)
}

export const __debug = (msg) => {
  if (msg) console.log('entering the debugger. reason:\n    ' + msg)
  if (typeof DEBUG !== 'undefined') debugger
  else console.warn('continuing... (debug not enabled)')
}

export const int = (s) => parseInt(s, 10)
export const hex = (s) => parseInt(s, 16)
export const float = parseFloat

export const is_fn = (fn) => typeof fn === 'function'
export const not_fn = (fn) => typeof fn !== 'function'
export { is_fn as is_func, is_fn as is_function }
export { not_fn as not_func, not_fn as not_function }

export const is_obj = (obj) => typeof obj === 'object'
export const not_obj = (obj) => typeof obj !== 'object'
export { is_obj as is_object }
export { not_obj as not_object }

export const is_str = (str) => typeof str === 'string'
export const not_str = (str) => typeof str !== 'string'
export { is_str as is_string }
export { not_str as not_string }

export const is_num = (num) => typeof num === 'number'
export const not_num = (num) => typeof num !== 'number'
export { is_num as is_number }
export { not_num as not_number }

export const is_bool = (bool) => typeof bool === 'boolean'
export const not_bool = (bool) => typeof bool !== 'boolean'
export { is_bool as is_boolean }
export { not_bool as not_boolean }

export const is_void = (v) => typeof v === 'undefined'
export const not_void = (v) => typeof v !== 'undefined'
export { is_void as is_undefined }
export { not_void as not_undefined }

export const is_nil = (v) => v == null
export const not_nil = (v) => v != null

export const is_truthy = (v) => v != null && v
export const is_falsey = (v) => v != null && !v
export { is_truthy as is_truthey, is_truthy as is_truthie }
export { is_falsey as is_falsy, is_falsey as is_falsie }

export const is = obj_is
export const isnt = (a, b) => !obj_is(a, b)

export const is_empty = (value) => (!value || not_obj(value))
  ? !value
  : !(is_array(value)
    ? value
    : obj_keys(value)).length

export const is_obv = (obv) => is_fn(obv) && obv._obv
export const is_obv_type = (obv, type) => is_fn(obv) && (obv._obv === type)
