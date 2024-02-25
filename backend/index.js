
const { v4: uuidv4 } = require('uuid')
const cookieParser   = require('cookie-parser')
const express        = require('express')
const multer         = require('multer')
const https          = require('https')
const http           = require('http')
const cors           = require('cors')
const fs             = require('fs')
const upload         = multer({ dest: 'uploads/' })
const app            = express()
const redirect       = express()

// Youttube stuff
const {google}      = require('googleapis')
const OAuth2Data    = require('./appConfig2.json')
const { oauth2 } = require('googleapis/build/src/apis/oauth2')
const CLIENT_ID     = OAuth2Data.web.client_id
const CLIENT_SECRET = OAuth2Data.web.client_secret
const REDIRECT_URL  = OAuth2Data.web.redirect_uris[0]

// Stateful info about the clients stored on the server
SESSIONS = []

// Parse json when needed
app.use(express.json())
app.use(cookieParser())
app.use(cors({origin: "https://accounts.google.com", credentials:true}))

app.use(express.static('../view/dist'))

app.get("/auth",(req,res)=>{
    const id      = uuidv4()
    const session = SESSIONS.find(item=>item.id==req.cookies.id)
    // if you dont have a session id or a its not in the book
    if (!session){
        console.log("Creating new session id")
        SESSIONS.push({id:id})
        res.cookie("id", id, { secure:false, maxAge:60*60*24*1000, httpOnly: true })
    }
    if (!session?.youtube){
        console.log(session)


        console.log("Requesting add for added youtube tokens")
        const googleClient  = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

        //Implement more checks for other platforms here, or maybe switch to one apicall per platform
        if (req.cookies.youtube) {
            console.log(req.cookies.youtube)
            res.send({"status":`${req.cookies.youtube}`})
        }else{
            const YTauthURL = googleClient.generateAuthUrl({
                access_type: "offline",
                scope      : "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile"
            })
            res.send({
                youtube : YTauthURL,
            })
        }


    }else{
        // All good
        res.send([])
    }

    
})

// Redirect url for finsihing up auth stuff
app.get("/post", async(req,res)=>{
    const code = req.query.code
    const googleClient  = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

    if (code){
        googleClient.getToken(code,(err, tokens)=>{
            if (err){ console.log( err ); res.send("YOU Failed!!!........... to log in"); return;}
            
            console.log(req.cookies.id)
            const session         = SESSIONS.find(item=>item.id==req.cookies.id)
            if (session){
                session.youtube   = tokens
                console.log("Added youtube tokens")
                console.log(session)
            }
            res.redirect("/")
        })
    }
})


app.post("/upload", upload.single('video'), (req, res)=>{
    const session = SESSIONS.find(item=>item.id==req.cookies.id)
    if (session){
        console.log(req.file, req.body)
        session.filepath =  req.file.path
        session.title    =  req.body.title
        session.comments =  req.body.comments
    }
    res.send("ok")
})

app.get("/run", (req, res)=>{
    console.log("got to run")
    const session = SESSIONS.find(item=>item.id==req.cookies.id)
    if (session?.youtube && session.filepath && session.title && session.comments){
        console.log("inside run loop")
        const googleClient  = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
        googleClient.setCredentials(session.youtube)
        const youtube      = google.youtube({
            version: "v3",
            auth   : googleClient
        })

        youtube.videos.insert({
            part     : "snippet",
            resource : {
                snippet: {
                    title      : session.title,
                    description: session.comments,
                    tag        : []  
                }
            },
            status: {
                privacyStatus : "public"
            },
            media :{
                body: fs.createReadStream(session.filepath, {root: "."})
            }
        },
        (err,data)=> {
            if (err){
                console.log(err)
            }if (data){
                console.log(data)
            }
        })
    }
    res.send({status:"ok"})
})


app.get("/*", (req, res)=>{
    res.send("this is a good test")
})

app.get("/*", (req,res)=>{
    res.redirect("https://projectreach.biz")
})

http.createServer(redirect).listen(80, ()=>{
    console.log("listening on port 80")
})

var options = {
  cert: fs.readFileSync('/home/dev/fullchain.pem'),
  key: fs.readFileSync('/home/dev/privkey.pem'),
}   
https.createServer(options, app).listen(443,()=>{
    console.log("listening on port 443")
})
