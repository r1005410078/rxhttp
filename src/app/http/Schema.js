import { fromJS } from 'immutable'
import { Instanceof } from './validator'
/**
 * 字段模型
 */
class Field {
  type = null
  error = null
  validator = [] // 验证方法
  asyncValidator = [] // 异步验证方法
  get = newValue => newValue
  constructor (field) {
    for (const key in field) {
      if (this.hasOwnProperty(key)) {
        this[key] = field[key]
      } else {
        throw new Error(`Field model error, no field ${key}, Field has [validator, asyncValidator, type, get]`)
      }
    }
  }
}

/**
 * 简单类型推到
 * @param {*} Type
 */
function TypeInference (Type) {
  return value => {
    if (typeof value !== typeof Type(value)) {
      throw new Error(`Type error, should be a ${Type.name.toString()}`)
    }
  }
}
/**
 * Schema 需要的格式转换
 * @param {*} params
 */
function getSchemaConfig (params) {
  const newParams = {}
  for (const key in params) {
    const param = params[key]
    switch (({}).toString.call(param)) {
      case '[object Object]':
        // if (param instanceof Schema) {
        //   newParams[key] = param
        // }
        newParams[key] = param
        break
      case '[object Function]':
        newParams[key] = {
          type: param,
          validator: [Instanceof(param)]
        }
        break
      case '[object Array]':
        if (param === Array || param.length === 0) {
          newParams[key] = {
            type: Array,
            validator: [TypeInference(Array)]
          }
        } else if (param instanceof Array) {
          if (!param.some(fn => typeof fn !== 'function')) {
            // [String, Number, Object, Array] 多种类型
            newParams[key] = {
              validator: [function (value) {
                if (!param.some(Class => {
                  if (Class === Number || Class === String) {
                    if (typeof value === typeof Class(value)) {
                      return true
                    }
                  } else {
                    return value instanceof Class
                  }
                })) {
                  throw new Error(`Type error, should be a ${param.map(p => p.name).toString()}`)
                }
              }]
            }
          } else {
            // [[validator], [asyncValidator], get]
            newParams[key] = {
              validator: param[0] || [],
              asyncValidator: param[1] || [],
              get: param[2] || (value => value)
            }
          }
        }
        break
      case '[object String]':
        newParams[key] = {
          type: String,
          validator: [TypeInference(String)]
        }
        break
      case '[object Number]':
        newParams[key] = {
          type: Number,
          validator: [TypeInference(Number)]
        }
        break
      case '[object Null]':
        newParams[key] = {
          type: null
        }
        break
      default:
        break
    }
  }
  return newParams
}

/**
 * 定义数据模型
 */
export default class Schema {
  constructor (fields, strict) {
    Object.defineProperty(this, 'strict', {
      value: strict,
      writable: false
    })
    fields = getSchemaConfig(fields)
    for (const key in fields) {
      let field = fields[key]
      if (field instanceof Schema) {
        this.defineProperty(key, null, field)
      } else {
        field = new Field(field)
        this.defineProperty(key, field)
      }
      Schema.prototype.getField[key] = field
    }
  }

  getField (keys) {
    let _keys = keys.slice()
    let fields = this.getField
    do {
      const key = _keys[0]
      if (fields && fields instanceof Schema) {
        fields = fields.getField(_keys)
      } else if (fields[key]) {
        fields = fields[key]
      }
    } while (_keys.length > 1 && _keys.splice(0, 1).length)

    return fields
  }

  defineProperty (key, field, SchemaFields) {
    this[key] = SchemaFields || field.type
  }

  static fieldValidator (datas, field, newValue) {
    let validatorResult = null
    const isValidator = !field.validator.some(fn => (validatorResult = fn.call(datas, newValue)))
    if (!isValidator) {
      return validatorResult
    }
  }

  static runAsyncValidator (datas, field, newValue, next) {
    const fn = field.copyAsyncValidator.splice(0, 1)[0]
    
    fn.call(datas, newValue)
      .then(values => {
        if (!values && field.copyAsyncValidator.length > 0) {
          Schema.runAsyncValidator(datas, field, newValue, next)
        } else {
          next(values)
        }
      })
      .catch(error => { throw new Error(error) })
  
  }

  static compare (schema, datas) {
    const realResult = {
      errors: {},
      asyncErrors: {},
      gets: {},
      datas: fromJS(datas)
    }

    const keys = []
    const iteration = (datas, keys = [], parentLever = -1, lever = 0, brotherLever = 0) => {
      for (const key in datas) {
        const data = datas[key]
        keys.push(key)
        Schema.schemaValidator(schema, keys, data, realResult, datas)
        if (({}).toString.call(data) === '[object Object]') {
          iteration(data, keys, parentLever + 1, lever + 1)
        } else {
          brotherLever = 0
        }
        keys.splice(-1)
        brotherLever++
      }
    }
    iteration(datas, keys)
    const getErrors = Schema.getErrors(realResult)
    const getDatas = () => {
      if (getErrors instanceof Promise) {
        return Schema.getDatas(realResult, getErrors)
      } else if (Object.values(realResult.gets).length > 0) {
        return Schema.getDatas(realResult, realResult.errors)
      }
      return realResult.datas.toJS()
    }
    return {
      errors: getErrors,
      datas: getDatas()
    }
  }

  static getDatas (realResult, getErrors) {
    return new Promise((resolve, reject) => {
      const runGets = errors => {
        Schema.forGets(realResult.gets).then(value => {
          resolve({datas: realResult.datas.toJS(),  errors: errors.filter(err => err)})
        })
      }
      if (getErrors instanceof Promise) {
        getErrors.then(errors => runGets(errors))
      } else {
        runGets(getErrors)
      }
    })
  }

  static getErrors (realResult) {
    let asyncErrorsNum = Object.values(realResult.asyncErrors).length
    return asyncErrorsNum === 0 ? realResult.errors : new Promise((resolve, reject) => {
      Schema.forAsyncErrors(realResult.asyncErrors).then(error => {
        resolve(error)
      })
    })
  }

  static forGets (gets) {
    const promises = []
    for (const key in gets) {
      promises.push(gets[key](key.split(',')))
    }
    return Promise.all(promises)
  }

  static forAsyncErrors (asyncErrors) {
    const promises = []
    for (const key in asyncErrors) {
      promises.push(asyncErrors[key](key.split(',')))
    }
    if (promises.length) {
      return Promise.all(promises)
    }
    return null
  }

  static strictSchema (field, newValue, strict) {
    const extraFields = []
    const getError = key => {
      throw new Error(`didn't find the corresponding field key ${key}`)
    }
    for (const key in field) {
      if (({}).toString.call(newValue) !== '[object Object]') {
        getError(key)
      }
      if (strict) {
        if (!newValue.hasOwnProperty(key)) {
          getError(key)
        }
      }
    }
    if (strict) {
      for (const key in newValue) {
        if (!field.hasOwnProperty(key)) {
          extraFields.push(key)
        }
      }

      if (extraFields.length > 0) {
        throw new Error(`Extra fields keys ${extraFields.toString()}`)
      }
    }
  }

  static schemaValidator (schema, keys, newValue, realResult, datas) {
    const field = schema.getField(keys)
    if (field instanceof Schema) {
      Schema.strictSchema(field, newValue, field.strict)
    } else if (field instanceof Field) {
      const validatorResult = Schema.fieldValidator(datas, field, newValue)
      if (validatorResult) {
        realResult.errors[keys.toString()] = validatorResult
        Schema.runFieldGet(keys, field, datas, newValue, realResult, validatorResult)
      } else {
        if (field.asyncValidator.length > 0) {
          field.copyAsyncValidator = field.asyncValidator.slice()
          realResult.asyncErrors[keys.toString()] = keys => {
            return new Promise((resolve, reject) => {
              Schema.runAsyncValidator(datas, field, newValue, validatorResult => {
                if (validatorResult) {
                  Schema.runFieldGet(keys, field, datas, newValue, realResult, validatorResult)
                  resolve({errors: validatorResult})
                } else {
                  Schema.runFieldGet(keys, field, datas, newValue, realResult, null)
                  resolve(null)
                }
              })
            })
          }
        } else {
          Schema.runFieldGet(keys, field, datas, newValue, realResult, null)
        }
      }
    }
  }

  static runFieldGet (keys, field, datas, newValue, realResult, validatorResult) {
    const result = field.get.call(datas, newValue, validatorResult)
    if (result instanceof Promise) {
      realResult.gets[keys.toString()] = keys => result.then(values => {
        realResult.datas = realResult.datas.updateIn(keys, () => values)
      })
      .catch(error => {
        throw new Error(`${keys} error: ${error}`)
      })
    } else {
      realResult.datas = realResult.datas.updateIn(keys, () => result)
    }
  }

  compare (datas) {
    Schema.strictSchema(this, datas, this.strict)
    return Schema.compare(this, datas)
  }
}
