

export const idx_of = (d, array, comparer, start = 0, end = array.length) => {
  if (end <= 0) return -1

  var pivot = (start + end) >> 1
  var c = comparer(d, array[pivot])

  if (end - start <= 1) return c < 0 ? pivot - 1 : pivot
  if (c === 0) return pivot
  else if (c < 0) return idx_of(d, array, comparer, start, pivot)
  else /* c > 0 */ return idx_of(d, array, comparer, pivot, end)
}

export const insert = (d, array, comparer) => {
  let pos = idx_of(d, array, comparer) + 1
  if (pos === array.length) array.push(d)
  else array.splice(pos, 0, d)
  return pos
}

export const insert_d = (d, array, exists, comparer) => {
  let pos = idx_of(d, array, comparer) + 1
  if (pos === array.length) array.push(d)
  else array.splice(pos, 0, d)
  // update all exists values if they're greater than pos
  for (var i in exists) if (exists[i] >= pos) exists[i]++
  // set exists
  exists[d._id] = pos
  return pos
}

export const remove_d = (id, array, exists, _pos) => {
  let pos = _pos === undefined ? exists[id] : _pos
  if (pos !== void 0) {
    // possible optimization here, if pos == 0, then unshift, else if pos == array.length - 1 then pop, else:
    array.splice(pos, 1)
    exists[id] = void 0
    for (let i in exists) {
      if (exists[i] > pos) exists[i]--
    }
  }

  return pos
}
