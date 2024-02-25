const express = require('express')
const https   = require('https')
const http    = require('http')
const fs      = require('fs')
const app     = express()

var options = {
  cert: fs.readFileSync('/home/dev/fullchain.pem'),
  key: fs.readFileSync('/home/dev/privkey.pem'),
}

app.use(express.static('../view/dist'))
app.get("/example",(req,res)=>{
    res.send("This is a godd test!")
})

http.createServer(app).listen(80, ()=>{
    console.log("listening on port 80")
})
https.createServer(options, app).listen(443,()=>{
    console.log("listening on port 443")
})