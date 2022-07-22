export const CustomEventId = 'e167465a-130e-4c1c-97aa-494432e067f9'
export interface InternalEvents {
  /** Simulate a paste event on the activeElement */
  paste: [text: string]
  /** Simulate an image paste event on the activeElement */
  pasteImage: [number[]]
  /** Simulate a input event on the activeElement */
  input: [text: string]
  /** Simulate a image upload on the activeElement on instagram */
  instagramUpload: [url: string]
  /**
   * Simulate an image upload event.
   *
   * How to use:
   * Call this event, then invoke the file selector (SNS). It will invoke click on some input, then let's replace with the result.
   */
  hookInputUploadOnce: [format: string, fileName: string, file: number[]]

  /** A simple RPC. */
  // Not using async-call-rpc because we need to make sure every intrinsics
  // we're using is captured.
  resolvePromise: [req_id: number, data: unknown]
  rejectPromise: [req_id: number, error: unknown]
}

export type EventItemBeforeSerialization = keyof InternalEvents extends infer U
  ? U extends keyof InternalEvents
    ? readonly [U, InternalEvents[U]]
    : never
  : never
const { parse, stringify } = JSON
const { isArray } = Array
export function encodeEvent<T extends keyof InternalEvents>(
  key: T,
  args: InternalEvents[T]
) {
  return stringify([key, args])
}
export function decodeEvent(data: string): EventItemBeforeSerialization {
  const result = parse(data)
  // Do not throw new Error cause it requires a global lookup.
  // eslint-disable-next-line
  if (!isEventItemBeforeSerialization(result)) throw null
  return result
}

function isEventItemBeforeSerialization(
  data: unknown
): data is EventItemBeforeSerialization {
  if (!isArray(data)) return false
  if (data.length !== 2) return false
  if (typeof data[0] !== 'string') return false
  if (!isArray(data[1])) return false
  return true
}
