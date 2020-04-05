import is_equal from '@hyper/isEqual'
import { define_prop, is_obv } from '@hyper/utils'
import { remove_every as compactor } from '@hyper/utils'

import { emit, remove } from '@hyper/listeners'

// An observable that stores an object value and uses does a deep object comparison.
if (DEBUG) var OBJ_VALUE_LISTENERS = 0
if (DEBUG) var OBJ_VALUE_ID = 0
export default function obj_value (initial) {
  // if the value is already an observable, then just return it
  if (is_obv(initial)) return initial
  else obv.v = initial
  obv.l = []
  obv._obv = 'obj_value'
  if (DEBUG) obv._id = OBJ_VALUE_ID++
  if (DEBUG) obv.gc = () => compactor(obv.l)
  return obv

  function obv (val, do_immediately) {
    return (
      val === undefined ? obv.v                                                               // getter
    : typeof val !== 'function' ? (is_equal(obv.v, val) ? undefined : emit(obv.l, obv.v, obv.v = val), val) // setter only sets if the value has changed (won't work for byref things like objects or arrays)
    : (obv.l.push(val), (DEBUG && OBJ_VALUE_LISTENERS++), (obv.v === undefined || do_immediately === false ? obv.v : val(obv.v)), () => {                 // listener
        remove(obv.l, val)
        DEBUG && OBJ_VALUE_LISTENERS--
      })
    )
  }
}
