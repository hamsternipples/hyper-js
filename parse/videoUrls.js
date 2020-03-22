// functions to parse video urls
import Url from 'url'
import qs from 'querystring'

const vimeo_regex = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/
export const vimeo_id = (url, __match) => {
  __match = url.match(vimeo_regex)
  return match && typeof match[3] === 'string' ? match[3] : null
}

const yt_regex = /^.*((youtu.be\/)|(__v\/)|(\/__u\/\w\/)|(embed\/)|(watch\?))\??__v?=?([^#\&\?]*).*/
export const youtube_id = (url, __match) => {
  __match = url.match(yt_regex)
  return match && match[7].length === 11 ? match[7] : null
}

const vine_regex = /^http(?:s?):\/\/(?:www\.)?vine\.co\/__v\/([a-zA-Z0-9]{1,13}).*/
export const vine_id = (url, __match) => {
  __match = url.match(vine_regex)
  return match && match[1].length === 11 ? match[1] : null
}

// to parse this:
// <iframe src="http://cdnapi.kaltura.com/p/1910301/sp/191030100/embedIframeJs/uiconf_id/28928951/partner_id/1910301?iframeembed=true&playerId=verteletv-main-clip-571e3bcee87d1&entry_id=1_a9s8ncyo&flashvars[streamerType]=auto" width="560" height="395" allowfullscreen webkitallowfullscreen mozAllowFullScreen frameborder="0"></iframe>
//                                                                                                                                                                 ^^^^^^^^^^^^^    |     ^^^^^^^^^^
export const vertele_id = (url, __url, __qs) => {
  if (__url = Url.parse(url)) {
    __qs = qs.parse(__url.query)
    __url = __qs.playerId
  }
  return __qs && __url ? __url.substr(__url.lastIndexOf('-') + 1) + '|' + __qs.entry_id : null
}

export const iframe_src = (txt, __url, __idx) => {
  if (~(__idx = txt.indexOf('src="'))) {
    __url = txt.substring(__idx+5)
    __url = __url.substr(0, __url.indexOf('"'))
    return __url
  }
  return __url ? __url : txt
}
