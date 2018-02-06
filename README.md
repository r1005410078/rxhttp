# Http
#### 是一个基于 axios, rxjs 结合的 HTTP 库

# 特色
### Http

- 拦截请求和返回
- 转化请求和返回（数据）
- 取消请求
- 自动转化json数据
- rxjs Observable 数据流
- 请求参数类型检查，和请求参数字段计算
- 自定义api接口
- mock数据

# 安装
```
unpm i @uyun/everest-http
```

# 使用方式

## 执行 `GET` 请求

```js
import Http, {http} from '@uyun/everest-http'
import {Mock} from 'Mock'
// 创建一个请求参数类型
const schema = Http.Schema({
  ID: Number
})

const mock = () => Mock.mock('http://g.cn', {
  'name'	   : '[@name](/user/name)()',
  'age|1-100': 100,
  'color'	   : '[@color](/user/color)'
})

// 可选地，上面的请求可以这样做
http.get('/user', {
    schema: schema,
    mock: mock,
    params: {
      ID: 12345
    }
  })
  .toPromise()
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  })
```

## 执行 `POST` 请求

```js
import Http, {http} from '@uyun/everest-http'
// 创建一个请求参数类型
const schema = Http.Schema({
  username: String,
  password: {
    get (value) {
      return new Promise((resolve, reject) => {
        // 模拟一个请求gei 密码加密
        return `<<<${value}>>>`
      })
    }
  }
})
http.post('/user', {
  username: 'Fred',
  password: 'rts8888888'
}, {
  schema: schema
})
.toPromise()
.then(function (response) {
  console.log(response);
})
.catch(function (error) {
  console.log(error);
});
```

## 执行多个并发请求

#### `concatMap`，source = source1.concatMap(source2)表示source1每次发射数据时，获取source2的所有发射数据，map返回多个待发射数据，按顺序发射第一个数据变更。

```js
import Http, {http} from '@uyun/everest-http'

http.get('/user/12345')
  .concatMap(data => http.get('/permissions')) // he
  .toPromise()
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });

```

[双击666 了解更多rxjs知识](https://buctwbzs.gitbooks.io/rxjs/content/subject.html)

# 请求方法的重命名。

```js
http(config)
http.get(url, config)
http.delete(url, config)
http.head(url, config)
http.options(url, config)
http.post(url, data, config)
http.put(url, data, config)
http.patch(url, data, config)
```
## 注意
> 当时用重命名方法时url,method,以及data属性不需要在config中指定。

# [Requese 和 Response 配置说明](./RequeseConfig.md)


### 全局的 http 默认值

```js
http.defaults.baseURL = 'https://api.example.com';
http.defaults.headers.common['Authorization'] = AUTH_TOKEN;
http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

### 自定义实例默认值

创建实例时设置配置的默认值

函数的方式去创建实例
```js
// 创建实例时设置配置的默认值
var instance = http.create({
  schema: schema,
  mock: mock,
  url: 'https://api.example.com'
});

instance.post({
  password: '12212'
})
.toPromise()
.then(data => {
  console.log(data)
})
```
类方式去创建实例

```js
import Http, {http} from '@uyun/everest-http'
// 创建实例时设置配置的默认值
class GetInfo extends Http {
  schema = schema
  mock = mock
  url = 'http://localhost:3000/user'

  removeInfo (id) {
    // 自定义一个方法
    return this.post({uuid: id}).toPromise()  
  }
}

const info = new GetInfo()
info.removeInfo(111)

```

*** http 是通过 Http 创建出来的

> 我们可以通过一个类去描述后端给的每一个接口，方便我们以后查看，不用我们每次看接口都要去查看文档，文档经常会出现更新不及时。而代码不会。有一个良好的接口说明，会让别人更容易上手你的代码

> 建议一个接口一个类，接口之间也可以继承

> 接口的请求参数， 你可以用 Http.schema 去定义模型检查

### 配置的优先顺序
> 配置会以一个优先顺序进行合并。这个顺序是：在defaults.js 找到的库的默认值，然后是实例的 defaults 属性，最后是请求的 config 参数。后者将优先于前者。这里是一个例子：

```js
// 使用由库提供的配置的默认值来创建实例
// 此时超时配置的默认值是 `0`
var instance = http.create();

// 覆写库的超时默认值
// 现在，在超时前，所有请求都会等待 2.5 秒
instance.defaults.timeout = 2500;

// 为已知需要花费很长时间的请求覆写超时设置
instance.get('/longRequest', {
  timeout: 5000
});
```

# Requese 请求参数模型检查 Http.Schema

### 使用
```js
http.get('http://localhost:3000/user', {
  schema: Http.Schema({
    id: String
  }),
  params: {
    id: 1111
  }
})
.toPromise()
.then(data => {
  console.log('qq', data)
})

```
### 可以嵌套

```js
Http.Schema({
  info: Http.Schema({
    age: String,
    name: String
  })
})
```

### 数组字面量形式去设置类型

```js
Http.Schema({
  age: [String, Number]  // 多个类型
})
```

### 对象字面量形式去设置类型

```js
const schema = Http.Schema({
  age: { // 多个类型
    validator: [
      // 同验证方法
      function (value) {
        // this, 请求参数
        // 通过验证，返回一个对象 获取 抛出错误
        if (value > 18) {
          return {age: '年龄必须大于18周岁'}
        }
      }
    ],
  },
  username: {
    asyncValidator = [
      // 异步验证方法
      // 同验证方法
      function (name) {
        // this, 请求参数
        // 异步方法返回一个Promise res( 有错误 输出对象， 没有错误输出 null 或者 0 )
        return new Promise( res => setTimeout(res, 1000, name === 'rongts' ? {username: '用户名重复了'} : null))
      }
    ]
  },
  salary: {
    get () {
      // 计算属性 也可以返回一个Promise对象
      return this.age * this.salary
    }
  }
})

http.get('http://localhost:3000/user', {
  schema: schema,
  params: {
    age: 1
  }
})
.catch(error => {
  console.log('error', error)
  // error {age: '年龄必须大于18周岁'}
})

```
### 把Http.Schema 换成 Http.SchemaStrict

这些意味着我们的检查更加严格 模型会根据你的传入参数， 参数字段不能多，也不能少

```js
http.get('http://localhost:3000/user', {
  schema: Http.SchemaStrict({
    A: Number,
    B: String
  }),
  params: {
    A: 2222,
  }
})

// Schema.js:262 Uncaught Error: didn't find the corresponding field key B
```

# mock 数据

在开发前期我们需要跟后端约定接口返回的数据格式，然后模拟一些假数据，给我们的组件进行测试和开发

定义mock数据

```js

class User extends Http {
  url = 'http://localhost:3000/user'
  mock(params) {
    console.log(params)
    // 如果我们返回一个 false 表示我们不要mock数据
    // 以外我们可以返回对象 或 Promise 对象
    // return {data: 1111}
    return new Promise(res => setTimeout(res, 2000, {data: 22222}))
  }
}

const user = new User()

// 使用
user.get({age: 21})
.toPromise()
.then(data => {
  console.log('qq', data)
})
```

# 拦截器
在请求或响应被 then 或 catch 处理前拦截它们。
```js
// 添加请求拦截器
http.interceptors.request.use(function (config) {
    // 在发送请求之前做些什么
    return config;
  }, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  });

// 添加响应拦截器
http.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    return response;
  }, function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
  });
```

如果你想在稍后移除拦截器，可以这样：

```js
var myInterceptor = http.interceptors.request.use(function () {/*...*/});
http.interceptors.request.eject(myInterceptor);
```

可以为自定义 axios 实例添加拦截器
```js
var instance = http.create();
instance.interceptors.request.use(function () {/*...*/});
```

# 错误处理

```js
http.get('/user/12345')
  .catch(function (error) {
    if (error.response) {
      // 请求已发出，但服务器响应的状态码不在 2xx 范围内
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
    console.log(error.config);
  })
```

可以使用 validateStatus 配置选项定义一个自定义 HTTP 状态码的错误范围。

```js
http.get('/user/12345', {
  validateStatus: function (status) {
    return status < 500; // 状态码在大于或等于500时才会 reject
  }
})
```

# 取消请求
使用 cancel token 取消请求
> Axios 的 cancel token API 基于cancelable promises proposal，它还处于第一阶段。

可以使用 CancelToken.source 工厂方法创建 cancel token，像这样：

```js
var CancelToken = http.CancelToken;
var source = CancelToken.source();

http.get('/user/12345', {
  cancelToken: source.token
}).catch(function(thrown) {
  if (http.isCancel(thrown)) {
    console.log('Request canceled', thrown.message);
  } else {
    // 处理错误
  }
});

// 取消请求（message 参数是可选的）
source.cancel('Operation canceled by the user.')
```

还可以通过传递一个 executor 函数到 CancelToken 的构造函数来创建 cancel token：

```js

var CancelToken = http.CancelToken;
var cancel;

http.get('/user/12345', {
  cancelToken: new CancelToken(function executor(c) {
    // executor 函数接收一个 cancel 函数作为参数
    cancel = c;
  })
});

// 取消请求
cancel();
```

Note : 可以使用同一个 cancel token 取消多个请求
