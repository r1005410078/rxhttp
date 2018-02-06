
import axios from 'axios'
import defaultConfig from './defaultConfig'

function axiosCreate (config) {
  const baseConfig = {}
  for (const key in defaultConfig) {
    if (defaultConfig.hasOwnProperty(key)) {
      const _config = config[key]
      const self = this[key]
      if (_config) {
        baseConfig[key] = _config
      } else if (self) {
        baseConfig[key] = self
      } else {
        baseConfig[key] = defaultConfig[key]
      }
    }
  }
  return axios.create(baseConfig)
}

export default class BaseHttp {
  schema = null
  constructor (config = {}) {
    this.baseConfig = config
    Object.defineProperties(this, {
      _schema: {
        get: () => {
          return this.baseConfig.schema
        }
      },
      _mock: {
        get: () => {
          return this.baseConfig.mock
        }
      },
      _instance: {
        get: () => {
          this.instance = this.instance || axiosCreate.call(this, this.baseConfig)
          this.interceptors = this.instance.interceptors
          this.CancelToken = this.instance.CancelToken
          this.isCancel = this.instance.isCancel
          return this.instance
        }
      }
    })
  }
  mock () {}
}
