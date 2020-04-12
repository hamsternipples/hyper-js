
export const DAY_NAMES = 'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday'.split('|')

export const DAY_NAMES_SHORT = DAY_NAMES.map(s => s.substr(0, 3))
export const DAY_NAMES_MIN = DAY_NAMES.map(s => s.substr(0, 2))

export const MONTH_NAMES = 'January|February|March|April|May|June|July|August|September|October|November|December'.split('|')

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
  d : 'a day',
  dd : '%d days',
  w : 'one day',
  ww : '%d weeks',
  M : 'a month',
  MM : '%d months',
  y : 'a year',
  yy : '%d years',
  '?': '?',
}
