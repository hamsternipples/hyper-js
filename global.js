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
