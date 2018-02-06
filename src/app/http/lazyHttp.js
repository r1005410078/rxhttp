
import Http from './Http'
import defaultConfig from './defaultConfig'

function http (config) {
  return http.request(config)
}

http.defaults = defaultConfig

http.create = config => {
  const h = Http.create(config)
  const methods = ['request', 'get', 'delete', 'head', 'options', 'post', 'put', 'patch', 'interceptors', 'CancelToken', 'isCancel']
  for (let i = 0; i < methods.length; i++) {
    const method = methods[i]
    http[method] = typeof h[method] === 'function' ? h[method].bind(h) : h[method]
  }
  return http
}

export default http.create()
