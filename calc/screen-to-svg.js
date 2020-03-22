
export const screenToSVG(svg_el, x, y) => {
  var pt = svg_el.createSVGPoint()
  pt.x = x
  pt.y = y
  var cursorPt = pt.matrixTransform(svg_el.getScreenCTM().inverse())
  return {x: Math.floor(cursorPt.x), y: Math.floor(cursorPt.y)}
}
