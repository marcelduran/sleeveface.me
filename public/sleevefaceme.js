// based on: www.phpied.com/canvas-pixels-3-getusermedia/
(function(doc, win, nav) {
  var profilePhoto, profileHeader, videoStream,
      width, height, square, half, mode,
      arrayer = Array().slice,
      camera = doc.querySelector('#camera'),
      feedbackHeader = doc.querySelector('#feedback-header'),
      feedbackPhoto = doc.querySelector('#feedback-photo'),
      preview = doc.querySelector('#preview img'),
      header = doc.querySelector('#header img'),
      photo = doc.querySelector('#photo img'),
      timer = doc.querySelector('#timer'),
      handle = doc.querySelector('#handle'),
      picture = doc.querySelector('#live .picture'),
      previewPic = doc.querySelector('#preview .picture'),
      container = doc.querySelector('#container'),
      info = doc.querySelector('#live .info'),
      fullname = arrayer.call(doc.querySelectorAll('.fullname')),
      username = arrayer.call(doc.querySelectorAll('.username')),
      bio = arrayer.call(doc.querySelectorAll('.bio')),
      loc = arrayer.call(doc.querySelectorAll('.location')),
      place = doc.querySelector('script'),
      linkHeader = doc.querySelector('#header a'),
      linkPhoto = doc.querySelector('#photo a'),
      ctxFeedbackHeader = feedbackHeader.getContext('2d'),
      ctxFeedbackPhoto = feedbackPhoto.getContext('2d'),
      gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///' +
        'yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      feedback = feedbackHeader,
      ctx = ctxFeedbackHeader;

  function shotHeader() {
    preview.src = header.src = feedbackHeader.toDataURL('image/jpeg');
    linkHeader.href = header.src.replace('image/jpeg', 'image/octet-stream');
  }

  function shotPhoto() {
    photo.src = feedbackPhoto.toDataURL('image/jpeg');
    linkPhoto.href = photo.src.replace('image/jpeg', 'image/octet-stream');
  }

  function snapshot() {
    var img;

    // FF doesn't honor loadedmetadata
    if (!width || !height) {
      getDimensions.call(camera);
    }

    previewPic.style.backgroundImage = 'none';
    switch(mode) {
      case 'both':
        shotHeader();
        img = new Image();
        img.onload = function() {
          ctxFeedbackPhoto.drawImage(img, 224, 24, 73, 73, 0, 0, 73, 73);
          shotPhoto();
        };
        img.src = preview.src;
        break;
      case 'photo':
        shotPhoto();
        previewPic.style.backgroundImage = 'url(' + photo.src + ')';
        preview.src = header.src = linkHeader.href = profileHeader || gif;
        break;
      case 'header':
        shotHeader();
        photo.src = linkPhoto.href = profilePhoto || gif;
        previewPic.style.backgroundImage = 'url(' + photo.src + ')';
        break;
    }
  }

  function timed() {
    var count = 5;

    function rec() {
      if (count === 0) {
        snapshot();
        timer.innerHTML = '&nbsp;';
        timer.disabled = false;
      } else {
        timer.innerHTML = count;
        count -= 1;
        setTimeout(rec, 1000);
      }
    }

    timer.disabled = true;
    rec();
  }

  function getUser(e) {
    var script = doc.createElement('script'),
        screenName = handle.value;

    e.preventDefault();

    script.className = 'api';
    script.src = 'https://api.twitter.com/1/users/show.json?' +       
      'callback=cb&screen_name=' + screenName;
    place.parentNode.insertBefore(script, place);
  }

  function set(els, value) {
    els.forEach(function(el) {
      el.innerHTML = value || '';
    });
  }

  win.cb = function(data) {
    var locUrl,
        scripts = arrayer.call(doc.querySelectorAll('.api'));

    if (data) {
      set(fullname, data.name);
      set(username, '@' + data.screen_name);
      set(bio, data.description);
      locUrl = data.location || '';
      if (data.url) {
        if (locUrl) {
          locUrl += ' · ';
        }
        locUrl += data.url.replace(/^https?:\/\//, '');
      }
      set(loc, locUrl);

      profilePhoto = data.profile_image_url.replace('_normal.', '_bigger.');
      profileHeader = data.profile_banner_url;
      if (profileHeader) {
        profileHeader += '/web';
      }

      setMode('both');
    }

    scripts.forEach(function eachScript(script) {
      script.parentNode.removeChild(script);
    });
  };

  function setMode(m) {
    mode = m;
    switch (mode) {
      case 'both':
        picture.style.backgroundImage = 'none';
        info.style.backgroundImage = 'none';
        feedbackPhoto.style.display = 'none';
        feedback = feedbackHeader;
        ctx = ctxFeedbackHeader;
        break;
      case 'photo':
        if (profileHeader) {
          info.style.backgroundImage = 'url(' + profileHeader + ')';
        }
        picture.style.backgroundImage = 'none';
        feedbackHeader.style.display = 'none';
        feedbackPhoto.style.display = 'block';
        feedback = feedbackPhoto;
        ctx = ctxFeedbackPhoto;
        break;
      case 'header':
        if (profilePhoto) {
          picture.style.backgroundImage = 'url(' + profilePhoto + ')';
        }
        info.style.backgroundImage = 'none';
        feedbackHeader.style.display = 'block';
        feedbackPhoto.style.display = 'none';
        feedback = feedbackHeader;
        ctx = ctxFeedbackHeader;
        break;
    }
  }

  function toggleMode() {
    var next = {
      both: 'photo',
      photo: 'header',
      header: 'both'
    };
    setMode(next[mode]);
  }

  function paintOnCanvas() {
    if (width && height) {
      if (mode === 'photo') {
        ctx.drawImage(camera,
          parseInt((width - height) / 2, 10), 0, height, height, 0, 0, 73, 73);
      } else {
        ctx.drawImage(camera,
          0, 0, width, parseInt(width / 2, 10), 0, 0, 520, 260);
      }
    }
    win.requestAnimFrame(paintOnCanvas);
  }

  function setStream(stream) {
    videoStream = stream;
    if (win.webkitURL) {
      camera.src = win.webkitURL.createObjectURL(videoStream);
    } else if (typeof camera.mozSrcObject !== 'undefined') {
      camera.mozSrcObject = videoStream;
      camera.play();
    } else if (nav.mozGetUserMedia) {
      camera.src = videoStream;
      camera.play();
    } else if (win.URL) {
      camera.src = win.URL.createObjectURL(videoStream);
    } else {
      camera.src = videoStream;
    }
    win.requestAnimFrame(paintOnCanvas);
  }

  function getDimensions() {
    width = this.videoWidth;
    height = this.videoHeight;
    square = parseInt(width * 73 / 520, 10);
    half = parseInt(width / 2, 10);

    // FF doesn't honor loadedmetadata
    if (!width || !height) {
      setTimeout(getDimensions.bind(camera), 50);
    }
  }

  // listeners
  doc.querySelector('#shutter').addEventListener('click', snapshot, false);
  timer.addEventListener('click', timed, false);
  doc.querySelector('#form-profile').addEventListener('submit', getUser, false);
  doc.querySelector('#live').addEventListener('click', toggleMode, false);
  camera.addEventListener('loadedmetadata', getDimensions, false);

  // initialize canvas
  feedbackHeader.width = 520;
  feedbackHeader.height = 260;
  feedbackPhoto.width = 73;
  feedbackPhoto.height = 73;
  setMode('both');

  // paulirish.com/2011/requestanimationframe-for-smart-animating
  win.requestAnimFrame = 
    win.requestAnimationFrame       || 
    win.webkitRequestAnimationFrame || 
    win.mozRequestAnimationFrame    || 
    win.oRequestAnimationFrame      || 
    win.msRequestAnimationFrame     || 
    function(callback) {
      win.setTimeout(callback, 1000 / 60);
    };

  // developer.mozilla.org/en-US/docs/WebRTC/navigator.getUserMedia
  nav.getMedia = (nav.getUserMedia ||
                  nav.webkitGetUserMedia ||
                  nav.mozGetUserMedia ||
                  nav.msGetUserMedia ||
                  function(a, b, c) {
                    c(new Error('getUserMedia not implemented'));
                  });

  nav.getMedia({video: true}, setStream, function(err) {
    console.log(err);
  });

  handle.focus();
}(document, window, navigator));
