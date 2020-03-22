
export const created_asc = (a, b) => {
  return b.created > a.created ? 1 : b.created < a.created ? -1 : 0
}

export const affinaty_asc = (a, b) => {
  return b.affinaty > a.affinaty ? 1 : b.affinaty < a.affinaty ? -1 : 0
}

export const title_asc = (a, b) => {
  return b.title > a.title ? 1 : b.title < a.title ? -1 : 0
}

export const title_dsc = (a, b) => {
  return a.title > b.title ? 1 : a.title < b.title ? -1 : 0
}

export const T_asc = (a, b) => {
  return b.T > a.T ? 1 : b.T < a.T ? -1 : 0
}

export const active_asc = (a, b) => {
  return b.active > a.active ? 1 : b.active < a.active ? -1 : 0
}
