import { is_fn } from '@hyper/utils'
import { sprintf } from '@hyper/format'
import { RELATIVE_UNITS as DEFAULT_FORMAT } from '@hyper/lingua/dates'

// @Incomplete: add a function which will update the dates every x seconds. it shuld store an array of the times, and only update the ones that have noticeable impact. eg. the size of the unit (minutes, updates once a minute, etc.)

// @Incomplete: - merge the locale with 'date-format' so they share
// see moment and also: https://github.com/betsol/time-delta/blob/master/lib/time-delta.js

export const time_units = (() => {
  var divider = 1
  return [
    ['seconds',    1000],
    ['minutes',      60],
    ['hours',        60],
    ['days',         24],
    ['weeks',         7],
    // 7 days/week * 4.348 weeks/month * 12 months/year = 365.242248
    ['months', 4.348122],
    ['years',        12],
  ].map((unit) => {
    unit[1] = divider = divider * unit[1]
    return unit
  }).reverse()
})()

export const dt2unit = (dt) => {
  dt = Math.abs(dt)
  var s, u, v, i = 0
  for (; i < time_units.length; i++) {
    [s, u] = time_units[i]
    if ((v = Math.floor(dt / u)) > 0) return [s, v]
  }
}

// if max units is specified, abort early
export const dt2units = (dt, max_units = 3) => {
  dt = Math.abs(dt)
  var results = []
  var i = 0, unit
  for (; i < time_units.length; i++) {
    unit = time_units[i]
    var divider = unit[1]
    var value = dt > 0 ? Math.floor(dt / divider) : 0
    var key = unit[0]
    var len
    dt -= value * divider
    results[key] = value
    if (value > 0 && (len = results.push([key, value])) >= max_units) break
  }
  // results.ms = dt
  return results
}

// make a simplified version of this:
// https://github.com/moment/moment/blob/master/src/lib/duration/humanize.js
const threshold_ss = 44         // a few seconds to seconds
const threshold_s  = 45         // seconds to minute
const threshold_m  = 45         // minutes to hour
const threshold_h  = 22         // hours to day
const threshold_d  = 26         // days to month
const threshold_M  = 11         // months to year

// units: is number of time units to return (eg. ['1 day', '3 hours'])
// join: join (or not) the units eg. `return units_array.join(join) : units_array`
// without_suffix: omit the suffix '__ ago' or prefix 'in __'
// locale: defaults to 'en'
export const dt2human = (dt, num_units, join, without_suffix, locale = DEFAULT_FORMAT) => {
  if (Math.abs(dt) < 1000) return locale.now // just now

  var units = dt2units(dt, num_units)
  var arr = units.map(([k, v]) =>
    sprintf(locale[
      k == 'seconds' ? (v <= 1 ? 's' : 'ss') :
      k == 'minutes' ? (v <= 1 ? 'm' : 'mm') :
      k == 'hours'   ? (v <= 1 ? 'h' : 'hh') :
      k == 'days'    ? (v <= 1 ? 'd' : 'dd') :
      k == 'weeks'   ? (v <= 1 ? 'w' : 'ww') :
      k == 'months'  ? (v <= 1 ? 'M' : 'MM') :
      k == 'years'   ? (v <= 1 ? 'y' : 'yy') : '?'
    ], v)
  )

  var str
  return join
    ? (str = arr.join(join)) && without_suffix ? str
      : sprintf(locale[+dt > 0 ? 'future' : 'past'], str)
    : arr
}

export const dt2relative = (dt, without_suffix, locale = DEFAULT_FORMAT) => {
  var [k, v] = dt2unit(dt)

  // this may be backwards... look here:
  // https://github.com/moment/moment/blob/master/src/lib/duration/humanize.js
  // and, threshholds is handled incorrectly (cause of the non-fallthrough behaviour I want to have)
  var str = sprintf(locale[
         k == 'seconds' && (v <= threshold_ss ? 's'
      : (v < threshold_s ?                  'ss' : 'm')
    ) || k == 'minutes' && (v <= 1            ? 'm'
      : (v < threshold_h ?                  'mm' : 'h')
    ) || k == 'hours'   && (v <= 1            ? 'h'
      : (v < threshold_d ?                  'hh' : 'd')
    ) || k == 'days'    && (v <= 1            ? 'd'
      : (v < threshold_m ?                  'dd' : 'm')
    ) || k == 'months'  && (v <= 1            ? 'M'
      : (v < threshold_y ?                  'MM' : 'y')
    ) || k == 'years'   && (v <= 1            ? 'y'
      : 'yy'
    )
  ], v, locale)

  return without_suffix ? str
    : sprintf(locale[+dt > 0 ? 'future' : 'past'], str)
}


if (UNITTEST) {
  var hour = 1000 * 60 * 60 * 1

  assert.equal(dt2human(-hour * 24, 2, ', '), 'one day ago')
  assert.equal(dt2human(-hour * 47, 2, ', '), 'one day, 23 hours ago')
  assert.equal(dt2human(-hour * 47.95, 2, ', '), 'one day, 23 hours ago')
  assert.equal(dt2human(-hour * 48, 2, ', '), '2 days ago')
  assert.equal(dt2human(-1000, 2, ', '), 'a few seconds ago')
  assert.equal(dt2human(0, 2, ', '), 'just now')
}
