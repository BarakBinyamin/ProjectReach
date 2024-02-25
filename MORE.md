# Platforms API docs
- [Tik Tok](https://developers.tiktok.com/)
- [Facebook/Instagram]
- [Youtube upload, poor docs](https://developers.google.com/youtube/v3/guides/uploading_a_video)

# Tools
- [vite + vue](https://vitejs.dev/guide/)
- [nodejs](https://nodejs.org/en)
- [certbot](https://certbot.eff.org/)

# Q & A
- [Drag and drop](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop)
- [Drag and drop vue](https://stackoverflow.com/questions/56167681/drag-and-drop-in-vue-js-without-component)
- [install node on linux the right way](https://stackoverflow.com/questions/39981828/installing-nodejs-and-npm-on-linux)
- [Youtube example gist - pretty poor](https://gist.github.com/soygul/42677432fa89df7fd783e0232a43a8cf)
- [Poorly documented javscript google api](https://github.com/google/google-api-javascript-client/blob/master/docs/start.md) aka gapi, this was not used

# Important Youtube API Links
- Arguably [the most important page](https://console.cloud.google.com/apis/library) for the youtube api, go there to add the youtube v3 data api to your app
- [Google developers console](https://console.cloud.google.com/welcome)
- [Update allowed users for non verified apps](https://console.cloud.google.com/apis/credentials/consent)
- [Videos uploaded with non-varified apps are locked private since 2020](https://github.com/tokland/youtube-upload/issues/306)
- [Awesome Youtube tutorial for youtube upload](https://www.youtube.com/watch?v=Uv7cIJAymSs), one thing different, the new api uses one more feild called ` part     : "snippet",` in the youtube.insert function


# Integrating with api's 
The standar thing to do is to "Register an app" with the developers console related to the api, all seem to require a policy and terms of service link, as welll as a redirect link for Oauth
- https://projectreach.biz
- https://projectreach.biz/policy
- https://projectreach.biz/termsofservice
