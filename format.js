
// adapted from: https://gist.github.com/rmariuzzo/8761698
export function sprintf(format, ...args) {
  var i = 0
  return format.replace(/%[s|d]/g, () => args[i++])
}

export function float (value, precision) {
  return (precision = Math.pow(10, precision || 0),
    ''+(Math.round(value * precision) / precision))
}

export function percent (value, precision = 2) {
  return float(value * 100, precision) + '%'
}
