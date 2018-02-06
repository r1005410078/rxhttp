const express = require('express')

const app = express()
var bodyParser = require('body-parser')
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.get('/user', function (req, res) {
  
   // 使用 req.body 可以拿到 post 请求中的数据
   console.log(req.query);
   // 默认返回的json 对象
   var obj = {
      "success": false,
      "error_code":"NOT_LOGIN"
   }

   res.json(obj);
})

app.listen(3000)
