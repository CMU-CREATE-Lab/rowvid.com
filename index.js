rowvid = {}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
    videoProps = getVideoPropsFromURL()
    rowvid.id = videoProps.id
    rowvid.time = videoProps.time
    rowvid.speed = videoProps.speed

    $('#youtube-url').attr('href', 'https://www.youtube.com/watch?v=' + rowvid.id);
    $('#new-video-link').attr('href', rootUrl());

    player = new YT.Player('player', {
        height: '480',
        width: '853',
        videoId: videoProps.id,
        events: {
            'onReady': onPlayerReady
        },
        playerVars: {
            'autohide': 1,
            'autoplay': 0,
            'rel': 0 // don't show related videos at the end
        }
    });

    setInterval(updateUI, 100);

    document.title = document.title + " - " + rowvid.id;

    initDisqus();

    analytics.track("Playing video", {
        "videoID": rowvid.id,
        "videoTime": rowvid.time,
        "videoSpeed": rowvid.speed,
        "videoURL": "https://www.youtube.com/watch?v=" + rowvid.id + "#t=" + rowvid.time
    });
}

function rootUrl() {
    return window.location.href.split('?')[0];
}

rowvid.init = function() {

    if (isVideoPropsInURL()) {

        analytics.track("Loaded video player")

        $("#play-video").show();

        // 2. This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    } else {

        analytics.track("Loaded video chooser")

        $("#choose-video").show();

        $("#choose-video form").submit(function(event) {
            videoFuzzy = $("#video-fuzzy").val()
            videoID = extractVideoID(videoFuzzy)
            window.location.href = rootUrl() + "?v=" + videoID;
            event.preventDefault();
        });

        $("#video-fuzzy").focus()

        initDisqus();

    }

    space = 32
    left = 37
    right = 39

    $('body').keydown(function(e) {
        switch(e.which) {
            case left:
                prevFrame()
                e.preventDefault();
                break;
            case right:
                nextFrame()
                e.preventDefault();
                break;
            case space:
                togglePause();
                e.preventDefault();
                break;
        }
    })
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    // event.target.playVideo();
    player.seekTo(rowvid.time);
    player.setPlaybackRate(rowvid.speed);
}

function getVideoPropsFromURL() {
    videoProps = {
        "id": "Mbc7oynavxw",
        "time": 0,
        "speed": 1
    }

    if (window.location.href.indexOf("?") != -1) {
        args = window.location.href.split("?")[1]
        args = args.split("&")
        for (var i in args) {
            keyValuePair = args[i]
            key = keyValuePair.split("=")[0]
            value = keyValuePair.split("=")[1]
            switch(key) {
                case "v":
                    videoProps.id = value;
                    break;
                case "t":
                    videoProps.time = parseFloat(value);
                    break;
                case "s":
                    videoProps.speed = parseFloat(value);
                    break;
            }
        }
    }

    return videoProps
}

function isVideoPropsInURL() {
    return window.location.href.indexOf("?") != -1
}

function updateUI() {
    shareURL = rootUrl()
        + "?v="
        + rowvid.id
        + "&t="
        + preciseRound(player.getCurrentTime(), 2)
        + "&s="
        + player.getPlaybackRate()

    wasFocused = $("#share-url").is(":focus")
    $("#share-url").val(shareURL)
    if (wasFocused) {
        $("#share-url").select()
    }

    wasFocused = $("#timer").is(":focus")
    $("#timer").val(preciseRound(player.getCurrentTime(), 2))
    if (wasFocused) {
        $("#timer").select()
    }
    $("#vid-title").text(player.getVideoData().title)

    // Unfocus the youtube viewer so we can intercept spaces and arrows like we want
    if (document.activeElement == $('#player')[0]) {
        $('#player').blur();
    }
}

function preciseRound(num, decimals) {
   return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function extractVideoID(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if ( match && match[7].length == 11 ){
        return match[7];
    }else{
        alert("Could not extract video ID.");
    }
}


function isSpeedChangeSupported() {
    // Flash player [1]
    // HTML5 player [0.25,0.5,1,1.5,2 ]
    // playbackRates == [1] if using Flash player
    // https://developers.google.com/youtube/js_api_reference#getAvailablePlaybackRates
    playbackRates = player.getAvailablePlaybackRates()
    console.log("available playback rates: " + player.getAvailablePlaybackRates())
    return playbackRates[0] != 1
}

function alertNeedHTML5Player() {
    alert("Your browser doesn't currently support changing video speeds, pop over to http://www.youtube.com/html5, start the HTML5 trail and then you're sorted!")
    window.open("http://www.youtube.com/html5")
}

function setPlaybackRateAndPlay(speed) {
    if( isSpeedChangeSupported() ) {
        setPlaybackRate(speed)
        player.playVideo()
    }else{
        alertNeedHTML5Player()
    }

    analytics.track("Changed speed", {
        "videoID": rowvid.id,
        "videoTime": player.getCurrentTime(),
        "videoSpeed": speed,
        "videoURL": "https://www.youtube.com/watch?v=" + rowvid.id + "#t=" + player.getCurrentTime()
    });
}

function setPlaybackRate(speed) {
    player.setPlaybackRate(speed)
}

function trackNextFrame(id, time, speed, url) {

    p = 0.01

    if (Math.random() >= (1-p)) {

        analytics.track("Next frame (p=0.01)", {
            "videoID": id,
            "videoTime": time,
            "videoSpeed": speed,
            "videoURL": "https://www.youtube.com/watch?v=" + id + "#t=" + time
        });

    }

}

function trackPrevFrame(id, time, speed, url) {

    p = 0.01

    if (Math.random() >= (1-p)) {

        analytics.track("Prev frame (p=0.01)", {
            "videoID": id,
            "videoTime": time,
            "videoSpeed": speed,
            "videoURL": "https://www.youtube.com/watch?v=" + id + "#t=" + time
        });

    }

}

function nextFrame() {
    player.pauseVideo()
    currentTime = player.getCurrentTime()
    framesPerSecond = 25 // worked out by quick profiling of videos using stats for nerd feature of player
    numFramesToAdvance = 1
    timeToAdvance = (1/framesPerSecond) * numFramesToAdvance
    newTime = currentTime + timeToAdvance
    player.seekTo(newTime)

    trackNextFrame(rowvid.id, player.getCurrentTime(), player.getPlaybackRate())

    updateUI();
}

function togglePause() {
    if (player.getPlayerState() == 2) { // Player is paused
        player.playVideo();
    } else {
        player.pauseVideo();
    }
}

function prevFrame() {
    if (player.getPlayerState() == 1) { // Playing
        player.playVideo();
    }
    console.log(player.getPlayerState());
    currentTime = player.getCurrentTime()
    framesPerSecond = 25 // worked out by quick profiling of videos using stats for nerd feature of player
    numFramesToAdvance = 1
    timeToAdvance = (1/framesPerSecond) * numFramesToAdvance
    newTime = currentTime - timeToAdvance
    player.seekTo(newTime)

    trackPrevFrame(rowvid.id, player.getCurrentTime(), player.getPlaybackRate())

    updateUI();
}

function initDisqus() {
    /**
     *  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
     *  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables
     */
    
    window.disqus_config = function () {
        if( rowvid.id ) {
            this.page.url = rootUrl() + "?v=" + rowvid.id;
            this.page.identifier = "/?v=" + rowvid.id;
        }else{
            this.page.url = rootUrl();
            this.page.identifier = "";
        }
    };
    
    (function() {  // DON'T EDIT BELOW THIS LINE
        var d = document, s = d.createElement('script');
        
        s.src = '//sochivid.disqus.com/embed.js';
        
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
    })();   
}
