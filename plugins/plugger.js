import { pluginBoilerplate } from '@hyper/plugins/plugin-boilerplate'
import { error, is_array } from '@hyper/utils'

function plugger (starting_panel, C = {}, D = {}) {
  const name = starting_panel.name

  let beginner = (args) => {
    // this should only happen in production env, and it should report the error or something.
    // for now, it's bad because it doesn't pause the debugger
    if (DEBUG) return starting_panel(args)
    else try {
      let el = starting_panel(args)
      if (is_array(el)) el = args.h('.plugger', el)
      return el
    } catch (e) {
      console.error('error in plugin('+name+'):', e)
    }
  }

  pluginBoilerplate(name, null, C, D, {}, beginner)
}

// this should't be here:
// import { win } from '@hyper/dom-base'
// win.plugger = plugger

export default plugger
