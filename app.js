var express = require('express');
var app = express();
var http = require('http');
var sha1 = require('sha1');
var xml2js = require('xml2js');
var querystring  = require('querystring');
 
process.env.PORT = '80';
function checkSignature(req) {
  // 获取校验参数
  var signature = req.query.signature;
  var timestamp = req.query.timestamp;
  var nonce = req.query.nonce;
 
  // 此处为实验分配了一个 token，也可以修改为自己的 token
  var token = '4KqWvQEazfjewj';
 
  // 按照字典排序
  var params = [token, timestamp, nonce];
  params.sort();
 
  // 连接
  var str = sha1(params.join(""));
 
  // 返回签名是否一致
  return str == signature;
}
 
// 接入验证
app.get('/', function(req, res) {
  // 签名成功
  if (checkSignature(req)) {
    res.send(200, req.query.echostr);
  } else {
    res.send(200, 'fail');
  }
});
 
function handler(req, res) {
  let  buf = '';
  // 获取XML内容
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    buf += chunk;
  });
  // 内容接收完毕
  req.on('end', function() {
    xml2js.parseString(buf, function(err, json) {
      if (err) {
        err.status = 400;
      } else {
        req.body = json;
      }
    });
 
    let data = req.body.xml;
    var msg = {
      "toUserName" : data.FromUserName[0],
      "fromUserName" : data.ToUserName[0],
      "createTime" : data.CreateTime[0],
      "msgType" : data.MsgType[0],
      "content" : data.Content[0],
      "msgId" : data.MsgId[0]
    };
    request(msg, req, res)
 
  });
}
 
function request(data, req, res) { 
  var msg = {             
    "key":'6d76234cf7ee488d84aa1a54397ae866',   // 可以填入自己申请的机器人的apiKey            
    "info": data.content,             
    "userid": ~~(Math.random() * 99999)
  };  
  var text = querystring.stringify(msg);    
  var options = {  
      hostname: 'www.tuling123.com',  
      path: '/openapi/api',  
      method: 'POST',
      headers: {  
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'  
    }  
  };  
 
  var requestObj = http.request(options, function (response) {  
      var result = '';
      response.setEncoding('utf8');  
      response.on('data', function (chunk) {  
         result +=  chunk;
      });  
      response.on('end',function() {  
      try{
          var obj = JSON.parse(result);
        }
          catch(e){
              data.content = e.message;
          echo(data, res);
          return;
            }
        data.content = obj.text;
        echo(data, res);
      })
  });  
 
  requestObj.on('error', function (e) {
      console.log('problem with request: ' + e.message);  
      data.content = e.message;  
      echo(data, res);
  });  
  requestObj.write(text);
  requestObj.end();  
}
function echo(data, res) {
  var time = Math.round(new Date().getTime() / 1000);
  var output = "" +
              "<xml>" +
                 "<ToUserName><![CDATA[" + data.toUserName + "]]></ToUserName>" +
                 "<FromUserName><![CDATA[" + data.fromUserName + "]]></FromUserName>" +
                 "<CreateTime>" + time + "</CreateTime>" +
                 "<MsgType><![CDATA[" + data.msgType + "]]></MsgType>" +
                 "<Content><![CDATA[" + data.content + "]]></Content>" +
              "</xml>";
 
  res.type('xml');
  res.send(output);
}
// Start
app.post('/', function(req, res) {
  handler(req, res);
});
 
module.exports = app;