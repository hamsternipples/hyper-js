
import { split } from '@hyper/utils'

export const DAY_NAMES = split('Sunday Monday Tuesday Wednesday Thursday Friday Saturday')

export const DAY_NAMES_SHORT = DAY_NAMES.map(s => s.substr(0, 3))
export const DAY_NAMES_MIN = DAY_NAMES.map(s => s.substr(0, 2))

export const MONTH_NAMES = split('January February March April May June July August September October November December')

export const MONTH_NAMES_SHORT = MONTH_NAMES.map(s => s.substr(0, 3))

export const RELATIVE_UNITS = {
  future : 'in %s',
  past : '%s ago',
  now : 'just now',
  s : 'a few seconds',
  ss : '%d seconds',
  m : 'a minute',
  mm : '%d minutes',
  h : 'an hour',
  hh : '%d hours',
  d : 'one day',
  dd : '%d days',
  w : 'one week',
  ww : '%d weeks',
  M : 'a month',
  MM : '%d months',
  y : 'a year',
  yy : '%d years',
  '?': '?',
}
