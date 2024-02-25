import "./gapi.js"



/*  COPY PASTE FROM GITHUB */
// The client ID is obtained from the {{ Google Cloud Console }}
// at {{ https://cloud.google.com/console }}.
// If you run this code from a server other than http://localhost,
// you need to register your own client ID.
var OAUTH2_CLIENT_ID = '838318889372-1b6vmd1pgjr0qp9bupithl172hv4cl4v.apps.googleusercontent.com'
var OAUTH2_SCOPES = [
  'https://www.googleapis.com/auth/youtube'
]
// Upon loading, the Google APIs JS client automatically invokes this callback.
googleApiClientReady = function() {
  gapi.auth.init(function() {
    window.setTimeout(checkAuth, 1);
  });
}
function checkAuth() {
  gapi.auth.authorize({
    client_id: OAUTH2_CLIENT_ID,
    scope: OAUTH2_SCOPES,
    immediate: true
  }, handleAuthResult);
}
function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    // Authorization was successful. Hide authorization prompts and show
    // content that should be visible after authorization succeeds.
    // $('.pre-auth').hide();
    // $('.post-auth').show();
    console.log("INIT AUTH Succeeded")
    loadAPIClientInterfaces()
  } else {
    // Make the #login-link clickable. Attempt a non-immediate OAuth 2.0
    // client flow. The current function is called when that flow completes.
    // $('#login-link').click(function() {
    //   gapi.auth.authorize({
    //     client_id: OAUTH2_CLIENT_ID,
    //     scope: OAUTH2_SCOPES,
    //     immediate: false
    //     }, handleAuthResult);
    // });
    console.log("login failed HERE")
  }
}
function loadAPIClientInterfaces() {
  gapi.client.load('youtube', 'v3', function() {
    console.log("API IS FULLY LOADED AND READY!!!")
  })
}






/*  COPY PASTE FROM GITHUB */
var DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v2/files/';
/**
 * Helper for implementing retries with backoff. Initial retry
 * delay is 1 second, increasing by 2x (+jitter) for subsequent retries
 *
 * @constructor
 */
var RetryHandler = function() {
  this.interval = 1000; // Start at one second
  this.maxInterval = 60 * 1000; // Don't wait longer than a minute 
};

/**
 * Invoke the function after waiting
 *
 * @param {function} fn Function to invoke
 */
RetryHandler.prototype.retry = function(fn) {
  setTimeout(fn, this.interval);
  this.interval = this.nextInterval_();
};

/**
 * Reset the counter (e.g. after successful request.)
 */
RetryHandler.prototype.reset = function() {
  this.interval = 1000;
};

/**
 * Calculate the next wait time.
 * @return {number} Next wait interval, in milliseconds
 *
 * @private
 */
RetryHandler.prototype.nextInterval_ = function() {
  var interval = this.interval * 2 + this.getRandomInt_(0, 1000);
  return Math.min(interval, this.maxInterval);
};

/**
 * Get a random int in the range of min to max. Used to add jitter to wait times.
 *
 * @param {number} min Lower bounds
 * @param {number} max Upper bounds
 * @private
 */
RetryHandler.prototype.getRandomInt_ = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};


/**
 * Helper class for resumable uploads using XHR/CORS. Can upload any Blob-like item, whether
 * files or in-memory constructs.
 *
 * @example
 * var content = new Blob(["Hello world"], {"type": "text/plain"});
 * var uploader = new MediaUploader({
 *   file: content,
 *   token: accessToken,
 *   onComplete: function(data) { ... }
 *   onError: function(data) { ... }
 * });
 * uploader.upload();
 *
 * @constructor
 * @param {object} options Hash of options
 * @param {string} options.token Access token
 * @param {blob} options.file Blob-like item to upload
 * @param {string} [options.fileId] ID of file if replacing
 * @param {object} [options.params] Additional query parameters
 * @param {string} [options.contentType] Content-type, if overriding the type of the blob.
 * @param {object} [options.metadata] File metadata
 * @param {function} [options.onComplete] Callback for when upload is complete
 * @param {function} [options.onProgress] Callback for status for the in-progress upload
 * @param {function} [options.onError] Callback if upload fails
 */
var MediaUploader = function(options) {
  var noop = function() {};
  this.file = options.file;
  this.contentType = options.contentType || this.file.type || 'application/octet-stream';
  this.metadata = options.metadata || {
    'title': this.file.name,
    'mimeType': this.contentType
  };
  this.token = options.token;
  this.onComplete = options.onComplete || noop;
  this.onProgress = options.onProgress || noop;
  this.onError = options.onError || noop;
  this.offset = options.offset || 0;
  this.chunkSize = options.chunkSize || 0;
  this.retryHandler = new RetryHandler();

  this.url = options.url;
  if (!this.url) {
    var params = options.params || {};
    params.uploadType = 'resumable';
    this.url = this.buildUrl_(options.fileId, params, options.baseUrl);
  }
  this.httpMethod = options.fileId ? 'PUT' : 'POST';
};

/**
 * Initiate the upload.
 */
MediaUploader.prototype.upload = function() {
  var self = this;
  var xhr = new XMLHttpRequest();

  xhr.open(this.httpMethod, this.url, true);
  xhr.setRequestHeader('Authorization', 'Bearer ' + this.token);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-Upload-Content-Length', this.file.size);
  xhr.setRequestHeader('X-Upload-Content-Type', this.contentType);

  xhr.onload = function(e) {
    if (e.target.status < 400) {
      var location = e.target.getResponseHeader('Location');
      this.url = location;
      this.sendFile_();
    } else {
      this.onUploadError_(e);
    }
  }.bind(this);
  xhr.onerror = this.onUploadError_.bind(this);
  xhr.send(JSON.stringify(this.metadata));
};

/**
 * Send the actual file content.
 *
 * @private
 */
MediaUploader.prototype.sendFile_ = function() {
  var content = this.file;
  var end = this.file.size;

  if (this.offset || this.chunkSize) {
    // Only bother to slice the file if we're either resuming or uploading in chunks
    if (this.chunkSize) {
      end = Math.min(this.offset + this.chunkSize, this.file.size);
    }
    content = content.slice(this.offset, end);
  }

  var xhr = new XMLHttpRequest();
  xhr.open('PUT', this.url, true);
  xhr.setRequestHeader('Content-Type', this.contentType);
  xhr.setRequestHeader('Content-Range', 'bytes ' + this.offset + '-' + (end - 1) + '/' + this.file.size);
  xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
  if (xhr.upload) {
    xhr.upload.addEventListener('progress', this.onProgress);
  }
  xhr.onload = this.onContentUploadSuccess_.bind(this);
  xhr.onerror = this.onContentUploadError_.bind(this);
  xhr.send(content);
};

/**
 * Query for the state of the file for resumption.
 *
 * @private
 */
MediaUploader.prototype.resume_ = function() {
  var xhr = new XMLHttpRequest();
  xhr.open('PUT', this.url, true);
  xhr.setRequestHeader('Content-Range', 'bytes */' + this.file.size);
  xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
  if (xhr.upload) {
    xhr.upload.addEventListener('progress', this.onProgress);
  }
  xhr.onload = this.onContentUploadSuccess_.bind(this);
  xhr.onerror = this.onContentUploadError_.bind(this);
  xhr.send();
};

/**
 * Extract the last saved range if available in the request.
 *
 * @param {XMLHttpRequest} xhr Request object
 */
MediaUploader.prototype.extractRange_ = function(xhr) {
  var range = xhr.getResponseHeader('Range');
  if (range) {
    this.offset = parseInt(range.match(/\d+/g).pop(), 10) + 1;
  }
};

/**
 * Handle successful responses for uploads. Depending on the context,
 * may continue with uploading the next chunk of the file or, if complete,
 * invokes the caller's callback.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onContentUploadSuccess_ = function(e) {
  if (e.target.status == 200 || e.target.status == 201) {
    this.onComplete(e.target.response);
  } else if (e.target.status == 308) {
    this.extractRange_(e.target);
    this.retryHandler.reset();
    this.sendFile_();
  }
};

/**
 * Handles errors for uploads. Either retries or aborts depending
 * on the error.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onContentUploadError_ = function(e) {
  if (e.target.status && e.target.status < 500) {
    this.onError(e.target.response);
  } else {
    this.retryHandler.retry(this.resume_.bind(this));
  }
};

/**
 * Handles errors for the initial request.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onUploadError_ = function(e) {
  this.onError(e.target.response); // TODO - Retries for initial upload
};

/**
 * Construct a query string from a hash/object
 *
 * @private
 * @param {object} [params] Key/value pairs for query string
 * @return {string} query string
 */
MediaUploader.prototype.buildQuery_ = function(params) {
  params = params || {};
  return Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
};

/**
 * Build the drive upload URL
 *
 * @private
 * @param {string} [id] File ID if replacing
 * @param {object} [params] Query parameters
 * @return {string} URL
 */
MediaUploader.prototype.buildUrl_ = function(id, params, baseUrl) {
  var url = baseUrl || DRIVE_UPLOAD_URL;
  if (id) {
    url += id;
  }
  var query = this.buildQuery_(params);
  if (query) {
    url += '?' + query;
  }
  return url;
};
/*  COPY PASTE FROM GITHUB */






// REASL UPLOAD STUFF

var signinCallback = function (result){
    if(result.access_token) {
      var uploadVideo = new UploadVideo();
      uploadVideo.ready(result.access_token);
    }
  };
  
  var STATUS_POLLING_INTERVAL_MILLIS = 60 * 1000; // One minute.
  
  
  /**
   * YouTube video uploader class
   *
   * @constructor
   */
  var UploadVideo = function() {
    /**
     * The array of tags for the new YouTube video.
     *
     * @attribute tags
     * @type Array.<string>
     * @default ['google-cors-upload']
     */
    this.tags = ['youtube-cors-upload'];
  
    /**
     * The numeric YouTube
     * [category id](https://developers.google.com/apis-explorer/#p/youtube/v3/youtube.videoCategories.list?part=snippet&regionCode=us).
     *
     * @attribute categoryId
     * @type number
     * @default 22
     */
    this.categoryId = 22;
  
    /**
     * The id of the new video.
     *
     * @attribute videoId
     * @type string
     * @default ''
     */
    this.videoId = '';
  
    this.uploadStartTime = 0;
  };
  
  
  UploadVideo.prototype.ready = function(accessToken) {
    this.accessToken = accessToken;
    this.gapi = gapi;
    this.authenticated = true;
    this.gapi.client.request({
      path: '/youtube/v3/channels',
      params: {
        part: 'snippet',
        mine: true
      },
      callback: function(response) {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log(response.items[0].snippet.title)
          console.log(response.items[0].snippet.thumbnails.default.url)
        }
      }.bind(this)
    });
    console.log("Post is ready")
    $('#button').on("click", this.handleUploadClicked.bind(this));
  }
  
  /**
   * Uploads a video file to YouTube.
   *
   * @method uploadFile
   * @param {object} file File object corresponding to the video to upload.
   */
  UploadVideo.prototype.uploadFile = function(file) {
    var metadata = {
      snippet: {
        title: $('#title').val(),
        description: $('#description').text(),
        tags: this.tags,
        categoryId: this.categoryId
      },
      status: {
        privacyStatus: "public"
      }
    };
    var uploader = new MediaUploader({
      baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
      file: file,
      token: this.accessToken,
      metadata: metadata,
      params: {
        part: Object.keys(metadata).join(',')
      },
      onError: function(data) {
        var message = data;
        // Assuming the error is raised by the YouTube API, data will be
        // a JSON string with error.message set. That may not be the
        // only time onError will be raised, though.
        try {
          var errorResponse = JSON.parse(data);
          message = errorResponse.error.message;
        } finally {
          alert(message);
        }
      }.bind(this),
      onProgress: function(data) {
        var currentTime = Date.now();
        var bytesUploaded = data.loaded;
        var totalBytes = data.total;
        // The times are in millis, so we need to divide by 1000 to get seconds.
        var bytesPerSecond = bytesUploaded / ((currentTime - this.uploadStartTime) / 1000);
        var estimatedSecondsRemaining = (totalBytes - bytesUploaded) / bytesPerSecond;
        var percentageComplete = (bytesUploaded * 100) / totalBytes;
  
        $('#upload-progress').attr({
          value: bytesUploaded,
          max: totalBytes
        });
  
        $('#percent-transferred').text(percentageComplete);
        $('#bytes-transferred').text(bytesUploaded);
        $('#total-bytes').text(totalBytes);
  
      }.bind(this),
      onComplete: function(data) {
        var uploadResponse = JSON.parse(data);
        this.videoId = uploadResponse.id;
        $('#complete').text(this.videoId);
        this.pollForVideoStatus();
      }.bind(this)
    });
    // This won't correspond to the *exact* start of the upload, but it should be close enough.
    this.uploadStartTime = Date.now();
    uploader.upload();
  };
  
  UploadVideo.prototype.handleUploadClicked = function() {
    $('#button').attr('disabled', true);
    this.uploadFile( $('#file').get(0).files[0] );
  };
  
  UploadVideo.prototype.pollForVideoStatus = function() {
    this.gapi.client.request({
      path: '/youtube/v3/videos',
      params: {
        part: 'status,player',
        id: this.videoId
      },
      callback: function(response) {
        if (response.error) {
          // The status polling failed.
          console.log(response.error.message);
          setTimeout(this.pollForVideoStatus.bind(this), STATUS_POLLING_INTERVAL_MILLIS);
        } else {
          var uploadStatus = response.items[0].status.uploadStatus;
          switch (uploadStatus) {
            // This is a non-final status, so we need to poll again.
            case 'uploaded':
              $('#post-upload-status').append('<li>Upload status: ' + uploadStatus + '</li>');
              setTimeout(this.pollForVideoStatus.bind(this), STATUS_POLLING_INTERVAL_MILLIS);
              break;
            // The video was successfully transcoded and is available.
            case 'processed':
              $('#player').append(response.items[0].player.embedHtml);
              $('#post-upload-status').append('<li>Final status.</li>');
              break;
            // All other statuses indicate a permanent transcoding failure.
            default:
              $('#post-upload-status').append('<li>Transcoding failed.</li>');
              break;
          }
        }
      }.bind(this)
    });
  };