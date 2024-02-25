
const { v4: uuidv4 } = require('uuid')
const session        = require('express-session')
const express        = require('express')
const https          = require('https')
const http           = require('http')
const fs             = require('fs')
const app            = express()

// Youttube stuff
const {google}      = require('googleapis')
const OAuth2Data    = require('./appConfig2.json')
const { oauth2 } = require('googleapis/build/src/apis/oauth2')
const CLIENT_ID     = OAuth2Data.web.client_id
const CLIENT_SECRET = OAuth2Data.web.client_secret
const REDIRECT_URL  = OAuth2Data.web.redirect_uris[0]

// Stateful info about the clients stored on the server
app.use(session({
    genid            : ()=>uuidv4(), 
    resave           : true, 
    saveUninitialized: true,
    secret           : 'thisisasecret', 
    cookie           : { secure: true, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}))
// Parse json when needed
app.use(express.json())

app.use(express.static('../view/dist'))

app.get("/auth",(req,res)=>{
    console.log(req.session)
    const googleClient  = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

    // Implement more checks for other platforms here, or maybe switch to one apicall per platform
    if (req.session.youtube) {
        console.log(req.session.youtube)
        res.send({"status":`${req.session.youtube}`})
    }else{
        const YTauthURL = googleClient.generateAuthUrl({
            access_type: "offline",
            scope      : "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile"
        })
        res.send({
            youtube : YTauthURL,
        })
    }
})

app.get("/post",(req,res)=>{
    console.log(req.query.code)
    const code = req.query.code
    const googleClient  = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

    if (code){
        googleClient.getToken(code,(err, tokens)=>{
            if (err){ console.log( err ); res.send("YOU Failed!!!........... to log in"); return;}
            req.session.youtube = tokens
           // now set googleClient.setCredentials(tokens)
        })
    }
    res.redirect("/")
})

app.get("/*", (res,req)=>{
    res.send("this is a good test")
})

http.createServer(app).listen(80, ()=>{
    console.log("listening on port 80")
})

var options = {
  cert: fs.readFileSync('/home/dev/fullchain.pem'),
  key: fs.readFileSync('/home/dev/privkey.pem'),
}   
https.createServer(options, app).listen(443,()=>{
    console.log("listening on port 443")
})
