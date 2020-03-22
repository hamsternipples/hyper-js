// knicked from https://github.com/dominictarr/hyperfile
import h from '@hyper/dom/hyper-hermes'

const select = (ready) => {
  return h('input', {type: 'file', onchange: function (ev) {
    var file = ev.target.files[0]
    ready(new FileReader(), file)
  }})
}

export default const asBuffer = (onFile) => {
  return select((reader) => {
    reader.onload = () => onFile(new Buffer(reader.result))
    reader.readAsArrayBuffer(file)
  })
}

export const asDataURL = (onFile) => {
  return select((reader, file) => {
    reader.onload = () => onFile(reader.result)
    reader.readAsDataURL(file)
  })
}
