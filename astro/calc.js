import { new_array, cos } from '@hyper/global'

// this is to process data from ephemeris
// more info:
// https://www.projectpluto.com/jpl_eph.htm#tt_tdb
// ftp://ssd.jpl.nasa.gov/pub/eph/planets/
// https://github.com/ctdk/vsop87

export const calc_heliocentric = (T,
                                  c_x0, c_x1, c_x2, c_x3, c_x4, c_x5,
                                  c_y0, c_y1, c_y2, c_y3, c_y4, c_y5,
                                  c_z0, c_z1, c_z2, c_z3, c_z4, c_z5) => {

  var out = new_array(3)
  var x=0,  x1=0,  x2=0,  x3=0,  x4=0,  x5=0
  var y=0,  y1=0,  y2=0,  y3=0,  y4=0,  y5=0
  var z=0,  z1=0,  z2=0,  z3=0,  z4=0,  z5=0
  var i

  // --- x ---
  for (i=0; i < c_x0.length; i+=3)  x += c_x0[i] * cos(c_x0[i+1] + c_x0[i+2]*T)

  for (i=0; i < c_x1.length; i+=3)  x1 += c_x1[i] * cos(c_x1[i+1] + c_x1[i+2]*T)
  x1 *= T

  for (i=0; i < c_x2.length; i+=3)  x2 += c_x2[i] * cos(c_x2[i+1] + c_x2[i+2]*T)
  x2 *= T*T

  for (i=0; i < c_x3.length; i+=3)  x3 += c_x3[i] * cos(c_x3[i+1] + c_x3[i+2]*T)
  x3 *= T*T*T

  for (i=0; i < c_x4.length; i+=3)  x4 += c_x4[i] * cos(c_x4[i+1] + c_x4[i+2]*T)
  x4 *= T*T*T*T

  for (i=0; i < c_x5.length; i+=3)  x5 += c_x5[i] * cos(c_x5[i+1] + c_x5[i+2]*T)
  x5 *= T*T*T*T*T

  // --- y ---

  for (i=0; i < c_y0.length; i+=3)  y += c_y0[i] * cos(c_y0[i+1] + c_y0[i+2]*T)

  for (i=0; i < c_y1.length; i+=3)  y1 += c_y1[i] * cos(c_y1[i+1] + c_y1[i+2]*T)
  y1 *= T

  for (i=0; i < c_y2.length; i+=3)  y2 += c_y2[i] * cos(c_y2[i+1] + c_y2[i+2]*T)
  y2 *= T*T

  for (i=0; i < c_y3.length; i+=3)  y3 += c_y3[i] * cos(c_y3[i+1] + c_y3[i+2]*T)
  y3 *= T*T*T

  for (i=0; i < c_y4.length; i+=3)  y4 += c_y4[i] * cos(c_y4[i+1] + c_y4[i+2]*T)
  y4 *= T*T*T*T

  for (i=0; i < c_y5.length; i+=3)  y5 += c_y5[i] * cos(c_y5[i+1] + c_y5[i+2]*T)
  y5 *= T*T*T*T*T

  // --- z ---

  for (i=0; i < c_z0.length; i+=3)  z += c_z0[i] * cos(c_z0[i+1] + c_z0[i+2]*T)

  for (i=0; i < c_z1.length; i+=3)  z1 += c_z1[i] * cos(c_z1[i+1] + c_z1[i+2]*T)
  z1 *= T

  for (i=0; i < c_z2.length; i+=3)  z2 += c_z2[i] * cos(c_z2[i+1] + c_z2[i+2]*T)
  z2 *= T*T

  for (i=0; i < c_z3.length; i+=3)  z3 += c_z3[i] * cos(c_z3[i+1] + c_z3[i+2]*T)
  z3 *= T*T*T

  for (i=0; i < c_z4.length; i+=3)  z4 += c_z4[i] * cos(c_z4[i+1] + c_z4[i+2]*T)
  z4 *= T*T*T*T

  for (i=0; i < c_z5.length; i+=3)  z5 += c_z5[i] * cos(c_z5[i+1] + c_z5[i+2]*T)
  z5 *= T*T*T*T*T

  // --- out ---

  out[0] = x+x1+x2+x3+x4+x5 // x
  out[1] = y+y1+y2+y3+y4+y5 // y
  out[2] = z+z1+z2+z3+z4+z5 // z

  return out
}
