/**
 * 类型检查
 * @param {function} Type
 */
export function Instanceof (Type) {
  if (typeof Type !== 'function') {
    throw new Error(`Type must be a method`)
  }

  return function (value) {
    if (Type === String || Type === Number) {
      if (typeof value !== typeof Type(value)) {
        throw new Error(`Type error, should be a ${Type.name.toString()}`)
      }
    } else if (!(value instanceof Type)) {
      throw new Error(`Type error, should be a ${Type.name.toString()}`)
    }
  }
}
