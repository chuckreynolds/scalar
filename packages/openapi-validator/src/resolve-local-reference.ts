import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { isObject, isObjectLike } from '@scalar/helpers/object/is-object'

/**
 * Looks up local Reference Objects for semantic checks without mutating the API description.
 * External, malformed, missing and cyclic references are left to the caller's resolver.
 */
export const resolveLocalReference = (
  document: Record<string, unknown>,
  value: unknown,
): Record<string, unknown> | undefined => {
  const seen = new WeakSet<object>()
  let current = value
  while (isObject(current)) {
    if (!('$ref' in current)) {
      return current
    }
    if (seen.has(current) || typeof current.$ref !== 'string' || !current.$ref.startsWith('#')) {
      return undefined
    }
    seen.add(current)
    try {
      const pointer = decodeURIComponent(current.$ref.slice(1))
      if (pointer !== '' && !pointer.startsWith('/')) {
        return undefined
      }
      current =
        pointer === ''
          ? document
          : pointer
              .slice(1)
              .split('/')
              .map(unescapeJsonPointerSegment)
              .reduce<unknown>(
                (target, key) => (isObjectLike(target) && Object.hasOwn(target, key) ? target[key] : undefined),
                document,
              )
    } catch {
      return undefined
    }
  }
  return undefined
}
