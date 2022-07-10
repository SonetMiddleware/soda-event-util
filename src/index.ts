export const CustomEventId = 'abcf4ff0ce64'
function factory<T extends string | ArrayBuffer>(
  method: 'ArrayBuffer' | 'BinaryString' | 'DataURL' | 'Text'
) {
  return (blob: Blob) => {
    return new Promise<T>((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('error', () => {
        reject(reader.error)
      })
      reader.addEventListener('load', () => {
        resolve(reader.result as T)
      })
      reader[`readAs${method}`](blob)
    })
  }
}

export const blobToArrayBuffer = factory<ArrayBuffer>('ArrayBuffer')

/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-restricted-syntax */

export function overwriteFunctionOnXRayObject<T extends object>(
  xrayed_object: T,
  defineAs: keyof T,
  apply: (target: any, thisArg: any, argArray?: any) => any
) {
  try {
    if (_XPCNativeWrapper) {
      const rawObject = _XPCNativeWrapper.unwrap(xrayed_object)
      const rawFunction = rawObject[defineAs]
      exportFunction(
        function (this: any) {
          return apply(rawFunction, this, arguments)
        },
        rawObject,
        { defineAs }
      )
      return
    }
  } catch {
    console.error('Redefine failed.')
  }
  xrayed_object[defineAs] = new Proxy(xrayed_object[defineAs], { apply })
}
export function redefineEventTargetPrototype<K extends keyof EventTarget>(
  defineAs: K,
  apply: NonNullable<ProxyHandler<EventTarget[K]>['apply']>
) {
  overwriteFunctionOnXRayObject(
    globalThis.window.EventTarget.prototype,
    defineAs,
    apply
  )
}

/* eslint-disable @typescript-eslint/no-use-before-define */
export const dispatchPasteImgEvent = async (img: File | Blob) => {
  const bytes = new Uint8Array(await img.arrayBuffer())
  const value = Array.from(bytes)
  const imgUrl =
    'https://d3vi7ke2kcvale.cloudfront.net/images/bsc/0xc014b45d680b5a4bf51ccda778a68d5251c14b5e/e4355d7856ab8b24b9cd80e6bc171500.png'
  // data.setData('image/png', `data:image/png;${img}`);
  // data.setData('image/png', imgUrl);
  const file = constructUnXrayedFilesFromUintLike(
    'image/png',
    'image.png',
    value
  )
  //   const dt = constructUnXrayedDataTransferProxy(file);
  const dt = new DataTransfer()
  dt.setData('text/plain', 'hello world')
  //@ts-ignore
  const data = [new ClipboardItem({ 'image/png': img })]
  //@ts-ignore
  await navigator.clipboard.write(data)
  // data.setData('text/plain', `data:image/png;${img}`);
  // native post dialog get focused
  const nativeEditor = document.querySelector<HTMLDivElement>(
    `[contenteditable][aria-label][spellcheck],textarea[aria-label][spellcheck]`
  )
  if (!nativeEditor) {
    throw new Error('Native post editor is not selected')
  }
  const e = new ClipboardEvent('paste')
  //   const e = new ClipboardEvent('paste', {
  //     clipboardData: dt,
  //     // @ts-ignore Firefox only API
  //     dataType: undefined,
  //     data: undefined,
  //     bubbles: true,
  //     cancelable: true,
  //   });

  nativeEditor.focus()
  nativeEditor.dispatchEvent(e)
}

const CapturingEvents: Set<string> = new Set([
  'keyup',
  'input',
  'paste'
] as (keyof DocumentEventMap)[])

//#region instincts
const { apply } = Reflect
const { error, warn } = console
// The "window."" here is used to create a un-xrayed Proxy on Firefox
const un_xray_Proxy = globalThis.window.Proxy
const input_value_setter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value'
)?.set!
const textarea_value_setter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype,
  'value'
)?.set!
//#endregion

//#region helpers
type EventListenerDescriptor = {
  once: boolean
  passive: boolean
  capture: boolean
}
const CapturedListeners = new WeakMap<
  Node | Document,
  Map<string, Map<EventListener, EventListenerDescriptor>>
>()
//#endregion

const _XPCNativeWrapper =
  typeof XPCNativeWrapper === 'undefined' ? undefined : XPCNativeWrapper

/** get the un xrayed version of a _DOM_ object */
export function un_xray_DOM<T>(x: T) {
  if (_XPCNativeWrapper) return _XPCNativeWrapper.unwrap(x)
  return x
}

/** Clone a object into the page realm */
export function clone_into<T>(x: T) {
  if (_XPCNativeWrapper && typeof cloneInto === 'function')
    return cloneInto(x, window, { cloneFunctions: true })
  return x
}

const XRay_Uint8Array = globalThis.Uint8Array
  ? globalThis.Uint8Array
  : globalThis.window.Uint8Array

const unXrayed_Proxy = globalThis.window.Proxy
export function constructUnXrayedDataTransferProxy(unXrayed_file: File) {
  return new unXrayed_Proxy(
    un_xray_DOM(new DataTransfer()),
    clone_into({
      get(target, key: keyof DataTransfer) {
        if (key === 'files') return clone_into([unXrayed_file])
        if (key === 'types') return clone_into(['Files'])
        if (key === 'items')
          return clone_into([
            {
              kind: 'file',
              type: 'image/png',
              getAsFile() {
                return unXrayed_file
              }
            }
          ])
        if (key === 'getData') return clone_into(() => '')
        return un_xray_DOM(target[key])
      }
    })
  )
}
export function constructUnXrayedFilesFromUintLike(
  format: string,
  fileName: string,
  xray_fileContent: number[] | Uint8Array
) {
  const binary = clone_into(XRay_Uint8Array.from(xray_fileContent))
  const blob = un_xray_DOM(new Blob([binary], { type: format }))
  const file = un_xray_DOM(
    new File([blob], fileName, {
      lastModified: Date.now(),
      type: format
    })
  )
  return file
}
/** @see https://mdn.io/XPCNativeWrapper Firefox only */
declare namespace XPCNativeWrapper {
  function unwrap<T>(object: T): T
}
/** @see https://mdn.io/Component.utils.exportFunction Firefox only */
declare function exportFunction(
  f: Function,
  target: object,
  opts: { defineAs: string | number | symbol }
): void
/** @see https://mdn.io/Component.utils.cloneInto Firefox only */
declare function cloneInto<T>(
  f: T,
  target: object,
  opts: { cloneFunctions: boolean }
): T

export interface CustomEvents {
  paste: [text: string | { type: 'image'; value: number[] }]
  input: [text: string]
  instagramUpload: [url: string]
}

const { includes } = String.prototype

function isTwitter() {
  return apply(includes, window.location.href, ['twitter.com'])
}

function dispatchEventRaw<T extends Event>(
  target: Node | Document | null,
  eventBase: T,
  overwrites: Partial<T> = {}
) {
  let currentTarget: null | Node | Document = target
  const event = getMockedEvent(
    eventBase,
    () => (isTwitter() ? target! : currentTarget!),
    overwrites
  )
  // Note: in firefox, "event" is "Opaque". Displayed as an empty object.
  const type = eventBase.type
  if (!CapturingEvents.has(type))
    return warn("!!!! You're capturing an event that didn't captured. !!!!")

  const bubblingNode = bubble()
  for (const Node of bubblingNode) {
    // TODO: implement
    // Event.prototype.stopPropagation
    // Event.prototype.stopImmediatePropagation
    // Event.prototype.composedPath
    // capture event
    // once event
    // passive event
    const listeners = CapturedListeners.get(Node)?.get(type)
    if (!listeners) continue
    for (const [f, { capture, once, passive }] of listeners) {
      if (capture) continue
      try {
        f(event)
      } catch (e) {
        error(e)
      }
    }
  }
  function* bubble() {
    while (currentTarget) {
      yield currentTarget
      currentTarget = currentTarget.parentNode
    }
    yield document
    yield window as unknown as Node
  }
  function getMockedEvent<T extends Event>(
    event: T,
    currentTarget: () => EventTarget,
    overwrites: Partial<T> = {}
  ) {
    const target = un_xray_DOM(currentTarget())
    const source = {
      target,
      srcElement: target,
      // ? Why ?
      _inherits_from_prototype: true,
      defaultPrevented: false,
      preventDefault: clone_into(() => {}),
      ...overwrites
    }
    return new un_xray_Proxy(
      event,
      clone_into({
        get(target, key) {
          if (key === 'currentTarget') return un_xray_DOM(currentTarget())
          return (source as any)[key] ?? (un_xray_DOM(target) as any)[key]
        }
      })
    )
  }
}

export function dispatchPaste(textOrImage: CustomEvents['paste'][0]) {
  console.debug('[core-ui] eventDispatch, dispatchPaste ........')
  const data = new DataTransfer()
  const e = new ClipboardEvent('paste', {
    clipboardData: data,
    // @ts-ignore Firefox only API
    dataType: typeof textOrImage === 'string' ? 'text/plain' : void 0,
    data: typeof textOrImage === 'string' ? textOrImage : void 0,
    bubbles: true,
    cancelable: true
  })
  if (typeof textOrImage === 'string') {
    data.setData('text/plain', textOrImage)
    document.activeElement!.dispatchEvent(e)
  } else if (textOrImage.type === 'image') {
    const file = constructUnXrayedFilesFromUintLike(
      'image/png',
      'image.png',
      textOrImage.value
    )
    const dt = constructUnXrayedDataTransferProxy(file)
    dispatchEventRaw(document.activeElement, e, { clipboardData: dt })
  } else {
    const error = new Error(
      `Unknown event, got ${textOrImage?.type ?? 'unknown'}`
    )
    // cause firefox will not display error from extension
    console.error(error)
    throw error
  }
}

/**
 * Dispatch a fake event.
 * @param element The event target
 * @param event Event name
 * @param x parameters
 */
export function dispatchCustomEvents<T extends keyof CustomEvents>(
  element: Element | Document | null = document,
  event: T,
  ...x: CustomEvents[T]
) {
  document.dispatchEvent(
    new CustomEvent(CustomEventId, { detail: JSON.stringify([event, x]) })
  )
}

/**
 * paste image to activeElements
 * @param image
 */
export async function pasteImageToActiveElements(
  image: File | Blob
): Promise<void> {
  const bytes = new Uint8Array(await blobToArrayBuffer(image))
  dispatchCustomEvents(document.activeElement, 'paste', {
    type: 'image',
    value: Array.from(bytes)
  })
}
function dispatchInput(text: CustomEvents['input'][0]) {
  // Cause react hooks the input.value getter & setter, set hooked version will notify react **not** call the onChange callback.
  {
    let setter = (_value: string) =>
      warn('Unknown active element type', document.activeElement)
    if (document.activeElement instanceof HTMLInputElement)
      setter = input_value_setter
    else if (document.activeElement instanceof HTMLTextAreaElement)
      setter = textarea_value_setter
    apply(setter, document.activeElement, [text])
  }
  dispatchEventRaw(
    document.activeElement,
    new globalThis.window.InputEvent(
      'input',
      clone_into({ inputType: 'insertText', data: text })
    )
  )
}

document.addEventListener(CustomEventId, (e) => {
  const ev = e as CustomEvent<string>
  const [eventName, param, selector]: [keyof CustomEvents, any[], string] =
    JSON.parse(ev.detail)
  switch (eventName) {
    case 'input':
      return apply(dispatchInput, null, param)
    case 'paste':
      return apply(dispatchPaste, null, param)
    default:
      warn(eventName, 'not handled')
  }
})
//#region Overwrite EventTarget.prototype.*

redefineEventTargetPrototype(
  'addEventListener',
  (raw, _this: Node, args: Parameters<EventTarget['addEventListener']>) => {
    const result = apply(raw, _this, args)
    if (!CapturingEvents.has(args[0])) return result
    const { f, type, ...desc } = normalizeAddEventListenerArgs(args)
    if (CapturingEvents.has(type)) {
      if (!CapturedListeners.has(_this)) CapturedListeners.set(_this, new Map())
      const map = CapturedListeners.get(_this)!
      if (!map.has(type)) map.set(type, new Map())
      const map2 = map.get(type)!
      map2.set(f, desc)
    }
    return result
  }
)
redefineEventTargetPrototype(
  'removeEventListener',
  (raw, _this: Node, args: Parameters<EventTarget['removeEventListener']>) => {
    const result = apply(raw, _this, args)
    if (!CapturingEvents.has(args[0])) return result
    const { type, f } = normalizeAddEventListenerArgs(args)
    CapturedListeners.get(_this)?.get(type)?.delete(f)
    return result
  }
)

function normalizeAddEventListenerArgs(
  args: Parameters<EventTarget['addEventListener']>
): EventListenerDescriptor & { type: string; f: EventListener } {
  const [type, listener, options] = args
  let f: EventListener = () => {}
  if (typeof listener === 'function') f = listener
  else if (typeof listener === 'object')
    f = listener?.handleEvent.bind(listener) as any

  let capture = false
  if (typeof options === 'boolean') capture = options
  else if (typeof options === 'object') capture = options?.capture ?? false

  let passive = false
  if (typeof options === 'object') passive = options?.passive ?? false

  let once = false
  if (typeof options === 'object') once = options?.once ?? false
  return { type, f, once, capture, passive }
}
//#endregion
