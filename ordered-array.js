

export const idx_of = (element, array, comparer, start = 0, end = array.length) => {
  if (end <= 0) return -1

  var pivot = (start + end) >> 1
  var cmp = comparer(element, array[pivot])

  if (end - start <= 1) return cmp < 0 ? pivot - 1 : pivot
  if (cmp === 0) return pivot
  else if (cmp < 0) return idx_of(element, array, comparer, start, pivot)
  else /* c > 0 */ return idx_of(element, array, comparer, pivot, end)
}

// @Optimise: run a test to see if this one is faster / smaller than the above one.
// -- it comes in ~10 bytes heavier, and I haven't tested if it's slower, though...
export const idx_of2 = (element, array, comparer, start = 0, end = array.length) => {
  if (end <= 0) return -1
  var pivot = (start + (end - start) / 2) << 0
  var cmp = comparer(array[pivot], element)
  if (cmp === 0) return pivot
  else if (end - start <= 1) return cmp > 0 ? pivot - 1 : pivot
  else if (cmp < 0) return idx_of2(comparer, element, array, pivot, end)
  else /* c > 0 */ return idx_of2(comparer, element, array, start, pivot)
}

export const ordered_insert = (array, element, comparer) => {
  var pos = idx_of(element, array, comparer) + 1
  if (pos === array.length) array.push(element)
  else array.splice(pos, 0, element)
  return pos
}

export const ordered_insert_d = (array, d, exists, comparer) => {
  var pos = idx_of(d, array, comparer) + 1
  if (pos === array.length) array.push(d)
  else array.splice(pos, 0, d)
  // update all exists values if they're greater than pos
  for (var i in exists) if (exists[i] >= pos) exists[i]++
  // set exists
  exists[d._id] = pos
  return pos
}

export const remove_d = (array, id, exists, _pos) => {
  var pos = _pos === undefined ? exists[id] : _pos
  if (pos !== undefined) {
    // possible optimization here, if pos == 0, then shift, else if pos == array.length - 1 then pop, else:
    array.splice(pos, 1)
    exists[id] = undefined
    for (var i in exists) {
      if (exists[i] > pos) exists[i]--
    }
  }

  return pos
}
