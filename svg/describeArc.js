import polarToCartesian from '@hyper/calc/polarToCartesian'


export default function describeArc(x, y, radius, startAngle, endAngle){
  var arcSweep = endAngle - startAngle <= 180 ? 0 : 1
  var start = polarToCartesian(x, y, radius, endAngle)
  var end = polarToCartesian(x, y, radius, startAngle)

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, arcSweep, 0, end.x, end.y
  ].join(' ')
}
