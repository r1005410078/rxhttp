import Schema from './Schema'
import BaseHttp from './BaseHttp'
import { Instanceof } from './validator'
import axios from 'axios'
import { Observable } from 'rxjs/Observable'
import defaultConfig from './defaultConfig'

/**
 * 添加配置
 * @param {*} config
 */
function addDefaultConfig (config) {
  const newParams = {}
  for (const key in config) {
    if (defaultConfig.hasOwnProperty(key)) {
      newParams[key] = config[key]
    }
  }
  return newParams
}

/**
 * 请求
 * @param {*} config
 * @param {*} instance
 * @param {*} validationError
 */
function request (config = {}, other, mothodsIndex) {
  console.log('mothodsIndex', mothodsIndex)
  const instance = this._instance
  const { mock, schemaResult } = other
  const observerNext = (observer, data, error = {}) => {
    let mockResult = mock ? mock(data) : null
    let errorArray = Object.keys(error)
    if (errorArray.length > 0) {
      observer.error(error)
    } else if (mockResult) {
      if (mockResult instanceof Promise) {
        mockResult.then(data => {
          observer.next(data)
          observer.complete()
        })
        .catch(err => {
          observer.error(err)
        })
      } else {
        observer.next(mockResult)
        observer.complete()
      }
    } else {
      instance({...config}).then(result => {
        observer.next(result)
        observer.complete()
      })
      .catch(err => {
        observer.error(err)
      })
    }
  }
  return Observable.create(observer => {
    if (schemaResult) {
      const {errors, datas} = schemaResult
      if (errors instanceof Promise || datas instanceof Promise) {
        // 如果错误是异步的那么结果肯定是异步的
        datas.then(({datas, errors}) => {
          observerNext(observer, datas, errors)
        })
      } else if (errors) {
        observerNext(observer, datas, errors)
      } else {
        observerNext(observer, datas)
      }
    } else {
      observerNext(observer, mothodsIndex === 0 ? config.params : config.data)
    }
  })
}

/**
 * http 参数转换
 * @param {*} params
export interface AxiosInstance {
  defaults: AxiosRequestConfig;
  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };
  request<T = any>(config: AxiosRequestConfig): AxiosPromise<T>;
  get<T = any>(url: string, config?: AxiosRequestConfig): AxiosPromise<T>;
  delete(url: string, config?: AxiosRequestConfig): AxiosPromise;
  head(url: string, config?: AxiosRequestConfig): AxiosPromise;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): AxiosPromise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): AxiosPromise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): AxiosPromise<T>;
}
 */
function getAxiosRequestParams (methodName, ...args) {
  const argFirst = args[0][0]
  const argTwo = args[0][1]
  const argThree = args[0][2]
  const mothods = [['get', 'delete', 'head', 'options'], ['post', 'put', 'patch'], ['request']]
  const mothodsIndex = (() => {
    let index = 0
    for (index; index < mothods.length; index++) {
      if (mothods[index].indexOf(methodName) > -1) {
        break
      }
    }
    return index
  })()

  const schema = config => {
    const shm = config.schema || this._schema
    if (shm && !(shm instanceof Schema)) {
      throw new Error(`Field schema must be a Schema instance`)
    }
    return shm
  }
  const config = {
    mothodsIndex: mothodsIndex,
    method: methodName,
    schemaResult: null,
  }

  if (typeof argFirst === 'string') {
    config.url = argFirst
  }

  switch (mothodsIndex) {
    case 0:
      if (typeof argFirst === 'object') {
        Object.assign(config, argFirst)
      }
      if (typeof argFirst === 'string' && typeof argTwo === 'object') {
        Object.assign(config, argTwo)
      }
      const gSchema = schema(config)
      if (gSchema && config.params) {
        config.schemaResult = gSchema.compare(config.params)
      }
      return config
    case 1:
      if (typeof argFirst === 'object') {
        Object.assign(config, argTwo || {}, {data: argFirst})
      }
      if (typeof argFirst === 'string' && typeof argTwo === 'object') {
        Object.assign(config, argThree || {}, {data: argTwo})
      }

      const pSchema = schema(config)
      if (pSchema && config.data) {
        config.schemaResult = pSchema.compare(config.data)
      }
      return config
    case 2:
      Object.assign(config, argFirst)
      const rSchema = schema(config)
      const data = mothodsIndex === 0 ? config.params : config.data
      if (rSchema && data) {
        config.schemaResult = rSchema.compare(data)
      }
      return config
    default:
      break
  }
}

/**
 * 创建请求方式
 */
function createRequestMethod (Http) {
  const methods = ['request', 'get', 'delete', 'head', 'options', 'post', 'put', 'patch']
  for (let index = 0; index < methods.length; index++) {
    const methodName = methods[index]
    Object.defineProperty(Http.prototype, methodName, {
      value: function (...arg) {
        const params = getAxiosRequestParams.apply(this, [methodName, arg])
        return request.apply(this, [
          addDefaultConfig(params),
          {mock: params.mock || this._mock, schemaResult: params.schemaResult},
          params.mothodsIndex
        ])
      },
      enumerable: false,
      configurable: false,
      writable: false
    })
  }
}
/**
 * 定义Http接口
 */
@createRequestMethod
export default class Http extends BaseHttp {
  static SchemaStrict (params) {
    return new Schema(params, true)
  }
  static Schema (params, strict) {
    return new Schema(params, strict)
  }
  static create (config) {
    return new Http(config)
  }
}

/**
 * 定义axios的默认值
 */
Object.defineProperty(Http, 'defaults', {
  get () {
    return Object.freeze(defaultConfig)
  },
  set (config) {
    for (const key in config) {
      if (defaultConfig.hasOwnProperty(key)) {
        defaultConfig[key] = config[key]
      }
    }
  }
})
