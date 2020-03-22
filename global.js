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

export const is_array = Array.isArray


export const noop = () => {}
