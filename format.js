
// adapted from: https://gist.github.com/rmariuzzo/8761698
export const sprintf = (format, ...args) => {
  var i = 0
  return format.replace(/%[s|d]/g, () => args[i++])
}

export const float = (value, precision) => {
  return (precision = Math.pow(10, precision || 0),
    ''+(Math.round(value * precision) / precision))
}

export const percent = (value, precision = 2) => {
  return float(value * 100, precision) + '%'
}
