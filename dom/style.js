
import { set_style } from '@hyper/dom/hyper-hermes'
export { set_style }

/*

rollup no longer concatenates the js files together, so it's possible now to get circular dependencies... in this case:

hyper-js/dom/hyper-hermes.js ->
  hyper-js/dom/style.js ->
    hyper-js/dom/hyper-ctx.js ->
      hyper-js/dom/hyper-hermes.js

so I have to have all of the functions in hyper-hermes. I was trying to make the file lighter, but I can't really see en easy way to do it.

*/
