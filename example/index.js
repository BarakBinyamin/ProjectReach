const express = require('express')
const multer  = require('multer')
const app     = express()
const upload  = multer({ dest: 'uploads/' })

app.get("/",(req,res)=>{
    res.sendFile("index.html", {root: '.'})
})
app.post("/upload",upload.single('file1', handle), (req,res)=>{
    res.send("This is a godd test!")
})

app.listen(3000)