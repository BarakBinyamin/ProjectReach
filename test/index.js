const express = require('express')
const multer  = require('multer')
const app     = express()
const upload  = multer({ dest: 'uploads/' })
const session = require('express-session')

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

// Access the session as req.session
// app.get('/', function(req, res, next) {
//   if (req.session.views) {
//     req.session.views++
//     res.setHeader('Content-Type', 'text/html')
//     res.write('<p>views: ' + req.session.views + '</p>')
//     res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
//     res.end()
//   } else {
//     req.session.views = 1
//     res.end('welcome to the session demo. refresh!')
//   }
// })
app.get('/foo', function(req, res, next) {
    if (req.session.views) {
      req.session.views++
      res.send(`${req.session.views}`)
    } else {
      req.session.views = 1
      res.send(`hey 0`)
    }
  })

app.get("/",(req,res)=>{
    res.sendFile("index.html", {root: '.'})
})
app.post("/upload",upload.single('file1'), (req,res)=>{
    res.send("This is a godd test!")
})

app.listen(3000)