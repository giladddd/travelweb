function UEVideoHoverCarouselWidget(objWidget) {
    var g_playMode = objWidget.attr('data-play-mode') || 'hover';
    var g_playingClassName = 'ue-video-playing';
    var g_playSound = objWidget.attr('data-play-sound') === 'true';
    var g_autoplayCenter = objWidget.attr('data-autoplay-center') === 'true';
    var g_isDebug = objWidget.attr('data-debug') === 'true';
    var g_closeOnOutsideClick = objWidget.attr('data-close-on-outside-click') !== 'false';
    var g_showLightbox = objWidget.attr('data-show-lightbox') === 'true';
    
    function isTouchDevice() {
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) && window.innerWidth < 1024;
    }
    
    function showVideo(obj) {
        if (!obj || obj.length === 0 || g_showLightbox) 
            return;
        
        objWidget.find('.ue-hover-image-video').not(obj).each(function() {
            hideVideo(jQuery(this));
        });
        
        var video = obj.find('.ue-video').first()[0];
        var image = obj.find('.ue-image').first()[0];
        
        obj.addClass(g_playingClassName);
        
        if (image) {
            image.style.opacity = '0';
            image.style.pointerEvents = 'none';
            
        }
        
        var yt = obj.data('ytPlayer');
        var vimeo = obj.data('vimeoPlayer');

        if(!vimeo){
            vimeo = new Vimeo.Player(video);
            obj.data('vimeoPlayer', vimeo);
        }

        if (yt && obj.data('ytReady')) {
            if (g_playSound) {
                yt.unMute();
                yt.setVolume(100);
            } else {
                yt.mute();
            }
            yt.playVideo();
        } else if (vimeo){
            vimeo.setVolume(g_playSound ? 1 : 0);
            vimeo.play();
        } else if (video && video.play) {
            video.muted = !g_playSound;
            if (g_playSound) video.volume = 1;
            
            video.play().catch((err) => {
                console.warn("Autoplay with audio blocked. Playing muted instead.");
                video.muted = true;
                video.play();
            });
        }               
    }
    
    function hideVideo(obj) {
        if (!obj || obj.length === 0 || g_isDebug) 
            return;
        
        var video = obj.find('.ue-video')[0];
        var image = obj.find('.ue-image')[0];
        
        obj.removeClass(g_playingClassName);
        
        if (image) {
            image.style.opacity = '1';
            image.style.pointerEvents = '';
        }
        
        var yt = obj.data('ytPlayer');
        var vimeo = obj.data('vimeoPlayer');
        
        if (yt && obj.data('ytReady')) { 
            yt.pauseVideo(); 
            yt.seekTo(0); 
        } else if (vimeo) {
            vimeo.pause(); 
            vimeo.setCurrentTime(0); 
        } else if (video.pause) { 
            video.pause(); 
            video.currentTime = 0;
        }
    }
    
    function handleAutoplayCenter() {
        
        if (!g_autoplayCenter || g_isDebug || g_showLightbox) 
            return;
        
        var isCarousel = objWidget.hasClass('owl-carousel');
        
        if (!isCarousel) 
            return;
        
        // Small timeout to ensure Owl has updated classes
        setTimeout(function() {
            objWidget.find('.owl-item').each(function() {
                var objItem = jQuery(this);
                
                var objVideo = objItem.find('.ue-hover-image-video');
                
                if (objItem.hasClass('center') ) {
                    
                    showVideo(objVideo);
                } else {
                    hideVideo(objVideo);
                }
            });
        }, 100);
    }
    
    function stopAllVideos() {
        objWidget.find('.' + g_playingClassName).each(function() {
            hideVideo(jQuery(this));
        });
    }
    
    function initCarousel(){
        
        objWidget.find('.ue-hover-image-video').each(function() {           
            
            var ovjVideo = jQuery(this);            
            var videoElem = ovjVideo.find('.ue-video')[0];
            var templateWrapper = ovjVideo.find('.ue-video-template-wrap');
            var template = ovjVideo.find('.ue-video-template')[0];
            
            if (template){
                var content = template.content.cloneNode(true);
                
                templateWrapper.empty().append(content);
                
                jQuery(template).remove();
                
                videoElem = ovjVideo.find('.ue-video')[0];
            }
            
        });
        
        var observerOptions = {
            root: null, // use viewport
            threshold: 0.1 // trigger when 10% of the element is visible
        };
        
        var videoObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                var ovjVideo = jQuery(entry.target);
                if (entry.isIntersecting) {  
                    var template = ovjVideo.find('.ue-video-template')[0];
                    var videoElem = ovjVideo.find('.ue-video')[0];
                    if (template){
                        var content = template.content.cloneNode(true);
                        
                        templateWrapper.empty().append(content);
                        
                        jQuery(template).remove();
                        
                        videoElem = ovjVideo.find('.ue-video')[0];
                    }
                    
                    if (!videoElem) 
                        return;
                    
                    var hasPlayer = ovjVideo.data('ytPlayer') || ovjVideo.data('vimeoPlayer');
                    
                    if (videoElem.dataset.initialized === 'true' && hasPlayer) 
                        return;
                    
                    stopAllVideos();
                    
                    
                    if (!videoElem || videoElem.dataset.initialized === 'true') 
                        return;
                    
                    var isYoutube = videoElem.tagName === 'IFRAME' && videoElem.src.includes('youtube.com');
                    var isVimeo = videoElem.tagName === 'IFRAME' && videoElem.src.includes('vimeo.com');
                    
                    //YouTube Setup
                    if (isYoutube && typeof YT !== 'undefined' && YT.Player) {
                        
                        var ytPlayer = new YT.Player(videoElem, {
                            events: {
                                'onReady': function(event) {
                                    ovjVideo.data('ytReady', true);
                                    
                                    if (g_isDebug) 
                                        showVideo(ovjVideo);
                                    else{
                                        event.target.mute();
                                        event.target.pauseVideo();
                                        event.target.seekTo(0);
                                        
                                        // If user is already hovering during slow load, play now
                                        // if (ovjVideo.is(':hover') && g_playMode === 'hover') 
                                        // showVideo(ovjVideo);
                                        
                                        if (g_autoplayCenter) 
                                            handleAutoplayCenter();
                                    }
                                }
                            }
                        });
                        ovjVideo.data('ytPlayer', ytPlayer);
                    }
                    
                    //Vimeo Setup
                    if (isVimeo && typeof Vimeo !== 'undefined' && Vimeo.Player) {
                        
                        var vimeoPlayer = new Vimeo.Player(videoElem);
                        
                        vimeoPlayer.ready().then(function() {
                            stopAllVideos();
                            
                            vimeoPlayer.setVolume(g_playSound ? 1 : 0);
                            vimeoPlayer.pause();
                            ovjVideo.data('vimeoReady', true);
                            
                            if (g_isDebug)
                                showVideo(ovjVideo);
                            
                            if (g_autoplayCenter) 
                                handleAutoplayCenter();
                        });
                        ovjVideo.data('vimeoPlayer', vimeoPlayer);
                    }
                    
                    //HTML5 Video Setup
                    if (videoElem.tagName === 'VIDEO') {
                        videoElem.muted = true;
                        videoElem.autoplay = false;
                        videoElem.preload = 'auto';
                        
                        videoElem.pause();
                        videoElem.currentTime = 0;
                        
                        if (g_isDebug) 
                            showVideo(ovjVideo);
                        
                        if (g_autoplayCenter) 
                            handleAutoplayCenter();
                    }
                    
                    videoElem.dataset.initialized = 'true';
                }
            });
        }, observerOptions);
        
        // Start observing all video containers
        objWidget.find('.ue-hover-image-video').each(function() {
            videoObserver.observe(this);
        });
        
        // THE DELEGATED EVENT HANDLER
        if (!g_isDebug && !g_showLightbox) {
            if (g_playMode === 'hover' && !isTouchDevice()) {
                objWidget.on('mouseenter', '.ue-hover-image-video', function() {
                    var objVideo = jQuery(this);
                    
                    showVideo(objVideo);
                });
                objWidget.on('mouseleave', '.ue-hover-image-video', function() {
                    var objVideo = jQuery(this);
                    
                    hideVideo(objVideo);
                });
            } else {
                // Handle 'click' or Mobile touch via click delegation
                objWidget.on('click', '.ue-hover-image-video', function(e) {
                    var objVideo = jQuery(this);
                    var isPlaying = objVideo.hasClass(g_playingClassName);
                    
                    if (isPlaying) {
                        hideVideo(objVideo);
                    } else {
                        showVideo(objVideo);
                    }
                });
            }
            
            if (g_closeOnOutsideClick) {
                jQuery(document).on('click.ueVideoOutside', function(e) {
                    var $target = jQuery(e.target);
                    
                    // If the click is NOT on the specific video container currently playing
                    // (This catches clicks on background, arrows, dots, or OTHER videos)
                    objWidget.find('.' + g_playingClassName).each(function() {
                        var $activeVideo = jQuery(this);
                        if (!$target.closest($activeVideo).length) {
                            hideVideo($activeVideo);
                        }
                    });
                });
            }
            
            objWidget.on('change.owl.carousel drag.owl.carousel', function() {
                stopAllVideos();
            });
            
            if (g_autoplayCenter) {
                objWidget.on('translated.owl.carousel drag.owl.carousel', function() {
                    handleAutoplayCenter();
                });
            }
        }
    }
    
    
    setTimeout(initCarousel,500);
}
