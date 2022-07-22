import { CustomEventId, decodeEvent } from '../shared'
import { sendEvent, rejectPromise, resolvePromise } from './utils'

export function pasteText(text: string) {
  sendEvent('paste', text)
}
export function pasteImage(image: Uint8Array) {
  sendEvent('pasteImage', Array.from(image))
}
export function pasteInstagram(url: string) {
  sendEvent('instagramUpload', url)
}
export function inputText(text: string) {
  sendEvent('input', text)
}
export function hookInputUploadOnce(
  format: string,
  fileName: string,
  image: Uint8Array
) {
  sendEvent('hookInputUploadOnce', format, fileName, Array.from(image))
}

document.addEventListener(CustomEventId, (e) => {
  const r = decodeEvent((e as CustomEvent).detail)
  if (r[1].length < 1) return

  switch (r[0]) {
    case 'resolvePromise':
      return resolvePromise(...r[1])
    case 'rejectPromise':
      return rejectPromise(...r[1])

    case 'input':
    case 'paste':
    case 'pasteImage':
    case 'instagramUpload':
    case 'hookInputUploadOnce':
      break
    default:
      const neverEvent: never = r[0]
      console.log('[soda-extension/event-util]', neverEvent, 'not handled')
  }
})
