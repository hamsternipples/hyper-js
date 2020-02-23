
export const DAY_NAMES = 'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday'.split('|')

export const DAY_NAMES_SHORT = DAY_NAMES.map(s => s.substr(0, 3))
export const DAY_NAMES_MIN = DAY_NAMES.map(s => s.substr(0, 2))

export const MONTH_NAMES = 'January|February|March|April|May|June|July|August|September|October|November|December'.split('|')

export const MONTH_NAMES_SHORT = MONTH_NAMES.map(s => s.substr(0, 3))
