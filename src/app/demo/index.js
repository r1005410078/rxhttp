
import React, { PureComponent } from 'react'
import { observer } from 'mobx-react'
import Http from '../http/Http'
import http from '../http/lazyHttp'
import axios from 'axios'
import defaultConfig from '../http/defaultConfig'
import Schema from './../http/Schema'

// class Test extends Http {
//   url = 'http://localhost:3000/user'
// }

http.get('http://localhost:3000/user', {
  schema: Http.SchemaStrict({
    A: Number,
    B: String
  }),
  params: {
    A: 2222,
    B: '22222'
  }
})
.toPromise()
.then(data => {
  console.log('qq', data)
})
.catch(error => {
  console.log('error', error)
})

// class GetInfo extends Http {
//   url = 'http://localhost:3000/user'

//   removeInfo (id) {
//     // 自定义一个方法
//     return this.post({uuid: id}).toPromise()  
//   }
// }

// const info = new GetInfo()
// info.removeInfo(111).then(data => {
//   console.log('qq', data)
// })

@observer
export default class Demo extends PureComponent {
  constructor () {
    super()
  }
  render () {
    return (
      <h1>
        Align edge / 边缘对齐
      </h1>
    )
  }
}


/**
 * 
  info: 1,
  age: {
    useranme: {
      jj: {
        lo77777: 333,
        lo22222: 333
      },
      cc: {
        bb: 333
      }
    },
    lol: {
      lo: 3
    },
    lolg: {
      jj: {
        lo77777: 333
      }
    }
  },
  scl: {
    a: 212,
    useranme: {
      jj: {
        lo77777: 333,
        lo22222: 333
      },
      cc: {
        bb: 333
      }
    }
  },
  ll: 333
 */