
// rename this file to transforms.
// common obv patterns

// append px to the end of a string
//   this shouldn't be used any more because hh automatically adds 'px' on to all
//   numeric attributes (cept for opacity)
export const _px = (v) => typeof v === 'string' && ~v.indexOf('px') ? v : v + 'px'
export const px = (obv) => transform(obv, _px)

// log a value to the console
export const obv_log = (obv, name = `obv(${DEBUG ? obv._type+':'+obv._id : obv._obv})`, level = 'log') => {
  return obv((v) => console[level](name+':', v))
}


export const negate = v => !v
