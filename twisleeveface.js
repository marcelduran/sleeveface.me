(function(doc, win, nav) {
  var profilePhoto, profileHeader, videoStream, width, height, square, half,
      arrayer = Array().slice,
      videoHeader = doc.querySelector('#video-header'),
      videoPhoto = doc.querySelector('#video-photo'),
      video = videoHeader,
      canvasHeader = doc.querySelector('#canvas-header'),
      canvasPhoto = doc.querySelector('#canvas-photo'),
      preview = doc.querySelector('#preview img'),
      header = doc.querySelector('#header img'),
      photo = doc.querySelector('#photo img'),
      timer = doc.querySelector('#timer'),
      handle = doc.querySelector('#handle'),
      picture = doc.querySelector('#live .picture'),
      previewPic = doc.querySelector('#preview .picture'),
      info = doc.querySelector('#live .info'),
      fullname = arrayer.call(doc.querySelectorAll('.fullname')),
      username = arrayer.call(doc.querySelectorAll('.username')),
      bio = arrayer.call(doc.querySelectorAll('.bio')),
      loc = arrayer.call(doc.querySelectorAll('.location')),
      place = doc.querySelector('script'),
      linkHeader = doc.querySelector('#header a'),
      linkPhoto = doc.querySelector('#photo a'),
      ctxHeader = canvasHeader.getContext('2d'),
      ctxPhoto = canvasPhoto.getContext('2d'),
      gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      mode = 'both';

  function shotHeader() {
    ctxHeader.drawImage(video,
      0, 0, width, parseInt(width / 2, 10), 0, 0, 520, 260);
    preview.src = header.src = canvasHeader.toDataURL('image/jpeg');
    linkHeader.href = header.src.replace('image/jpeg', 'image/octet-stream');
  }

  function shotPhoto(sx, sy, sw, sh, dx, dy, dw, dh) {
    ctxPhoto.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
    photo.src = canvasPhoto.toDataURL('image/jpeg');
    linkPhoto.href = photo.src.replace('image/jpeg', 'image/octet-stream');
  }

  function snapshot() {
    // FF don't honor loadedmetadata
    if (!width || !height) {
      getDimensions.call(video);
    }

    previewPic.style.backgroundImage = 'none';
    switch(mode) {
      case 'both':
        shotHeader();
        shotPhoto(parseInt(width / 2 - square / 2, 10),
          parseInt(width * 24 / 520, 10), square, square, 0, 0, 73, 73);
        break;
      case 'photo':
        shotPhoto(parseInt((width - height) / 2, 10),
          0, height, height, 0, 0, 73, 73);
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

      mode = 'both'
      picture.style.backgroundImage = 'none';
      info.style.backgroundImage = 'none';
      videoHeader.style.display = 'block';
      videoPhoto.style.display = 'none';
      setStream(videoStream, videoHeader);
    }

    scripts.forEach(function eachScript(script) {
      script.parentNode.removeChild(script);
    });
  };

  function toggleMode() {
    switch (mode) {
      case 'both':
        mode = 'photo';
        if (profileHeader) {
          info.style.backgroundImage = 'url(' + profileHeader + ')';
        }
        picture.style.backgroundImage = 'none';
        videoHeader.style.display = 'none';
        videoPhoto.style.display = 'block';
        setStream(videoStream, videoPhoto);
        break;
      case 'photo':
        mode = 'header';
        if (profilePhoto) {
          picture.style.backgroundImage = 'url(' + profilePhoto + ')';
        }
        info.style.backgroundImage = 'none';
        videoHeader.style.display = 'block';
        videoPhoto.style.display = 'none';
        setStream(videoStream, videoHeader);
        break;
      case 'header':
        mode = 'both';
        picture.style.backgroundImage = 'none';
        break;
    }
  }

  function setStream(stream, vid) {
    videoStream = stream || videoStream;
    video = vid || video;
    if (win.webkitURL) {
      video.src = win.webkitURL.createObjectURL(videoStream);
    } else if (typeof video.mozSrcObject !== 'undefined') {
      video.mozSrcObject = videoStream;
      video.play();
    } else if (nav.mozGetUserMedia) {
      video.src = videoStream;
      video.play();
    } else if (win.URL) {
      video.src = win.URL.createObjectURL(videoStream);
    } else {
      video.src = videoStream;
    }
  }

  function getDimensions() {
    width = this.videoWidth;
    height = this.videoHeight;
    square = parseInt(width * 73 / 520, 10);
    half = parseInt(width / 2, 10);
    videoPhoto.style.marginLeft =
      '-' + parseInt((73 * ((width - height) / 2) / height), 10) + 'px';
    video.removeEventListener('loadedmetadata', getDimensions, false);
  }

  doc.querySelector('#shutter').addEventListener('click', snapshot, false);
  timer.addEventListener('click', timed, false);
  doc.querySelector('#form-profile').addEventListener('submit', getUser, false);
  doc.querySelector('#live').addEventListener('click', toggleMode, false);
  video.addEventListener('loadedmetadata', getDimensions, false);

  nav.getMedia = (nav.getUserMedia ||
                  nav.webkitGetUserMedia ||
                  nav.mozGetUserMedia ||
                  nav.msGetUserMedia);

  nav.getMedia({video: true}, setStream, function(err) {
    console.log(err);
  });

  handle.focus();
}(document, window, navigator));
