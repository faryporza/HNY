document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('playButton');
    const welcome = document.getElementById('welcome');
    const blog = document.getElementById('blog');
    const bgMusic = document.getElementById('bgMusic');

    playButton.addEventListener('click', async () => {
        try {
            // Try to resume audio context for iOS
            if (window.webkitAudioContext) {
                const AudioContext = window.webkitAudioContext || window.AudioContext;
                const audioContext = new AudioContext();
                await audioContext.resume();
            }
            
            // Play audio with promise handling
            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log("Audio playback started successfully");
                    })
                    .catch(error => {
                        console.log("Playback failed:", error);
                    });
            }
            
            welcome.style.display = 'none';
            blog.style.display = 'block';
            blog.style.animation = 'fadeIn 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
        } catch (error) {
            console.log("Audio play error:", error);
        }
    });

    // Add iOS touch event to enable audio
    document.addEventListener('touchstart', () => {
        if (bgMusic.paused) {
            bgMusic.play().catch(error => console.log("Playback failed:", error));
        }
    }, { once: true });

    // Updated carousel functionality
    const carouselContainer = document.querySelector('.carousel-container');
    const images = Array.from(carouselContainer.getElementsByTagName('img'));
    let currentIndex = 0;
    let isAnimating = false;

    // Add lazy loading for carousel images
    const lazyLoadImages = () => {
        const carouselImages = document.querySelectorAll('.carousel-container img');
        carouselImages.forEach(img => {
            img.classList.add('lazy');
            const originalSrc = img.src;
            img.src = ''; // Clear source temporarily
            
            // Create small placeholder
            img.style.backgroundColor = '#f8bbd0';
            
            // Load image
            const tmpImg = new Image();
            tmpImg.onload = () => {
                img.src = originalSrc;
                img.classList.remove('lazy');
                img.classList.add('loaded');
            };
            tmpImg.src = originalSrc;
        });
    };

    lazyLoadImages();

    function rotateSlides() {
        if (isAnimating) return;
        isAnimating = true;

        requestAnimationFrame(() => {
            // Add slide-out class to current image
            images[currentIndex].classList.add('slide-out');

            // Update index
            currentIndex = (currentIndex + 1) % images.length;

            // Rearrange z-indices and transforms
            images.forEach((img, index) => {
                const diff = (index - currentIndex + images.length) % images.length;
                img.style.zIndex = 3 - diff;
                
                if (diff !== 0) {
                    img.style.transform = `translateX(${-30 * diff}px) scale(${1 - (0.05 * diff)})`;
                    img.style.opacity = 1 - (0.1 * diff);
                }
            });

            // Remove slide-out class and move image to end
            setTimeout(() => {
                images[currentIndex].classList.remove('slide-out');
                images[currentIndex].style.transform = '';
                images[currentIndex].style.opacity = '1';
                carouselContainer.appendChild(images[currentIndex]);
                isAnimating = false;
            }, 400); // Changed from 800 to 400
        });
    }

    // Reduce interval from 3000ms to 2000ms
    let autoRotateInterval = setInterval(rotateSlides, 2000);
    
    // Update visibility change handler
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(autoRotateInterval);
        } else {
            autoRotateInterval = setInterval(rotateSlides, 2000); // Changed from 3000 to 2000
        }
    });

    // Add touch swipe functionality
    let startX = 0;
    carouselContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    carouselContainer.addEventListener('touchend', (e) => {
        const diffX = e.changedTouches[0].clientX - startX;
        if (Math.abs(diffX) > 50) {
            rotateSlides();
        }
    });

    // Add smooth scroll reveal animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.grid-item').forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.6s ease-out';
        observer.observe(item);
    });

    // Story functionality
    const storyModal = document.createElement('div');
    storyModal.className = 'story-modal';
    document.body.appendChild(storyModal);

    const stories = document.querySelectorAll('.story');
    stories.forEach((story, index) => {
        story.addEventListener('click', () => {
            const videoSrc = story.dataset.video;
            openStory(videoSrc, index);
        });
    });

    function openStory(videoSrc, storyIndex) {
        storyModal.innerHTML = `
            <div class="story-modal-content">
                <div class="story-progress">
                    ${Array(stories.length).fill(0).map(() => `
                        <div class="progress-bar">
                            <div class="progress-bar-fill"></div>
                        </div>
                    `).join('')}
                </div>
                <video class="story-video" src="${videoSrc}" autoplay muted playsinline></video>
            </div>
        `;
        
        storyModal.classList.add('active');
        const video = storyModal.querySelector('video');
        const progressBars = storyModal.querySelectorAll('.progress-bar-fill');
        
        progressBars[storyIndex].style.width = '100%';
        stories[storyIndex].classList.add('viewed');
        
        video.addEventListener('ended', () => {
            if (storyIndex < stories.length - 1) {
                openStory(stories[storyIndex + 1].dataset.video, storyIndex + 1);
            } else {
                closeStory();
            }
        });
        
        storyModal.addEventListener('click', closeStory);
    }

    function closeStory() {
        storyModal.classList.remove('active');
        storyModal.innerHTML = '';
    }

    // Initialize video previews
    const videoPreviews = document.querySelectorAll('.story-video-preview');
    videoPreviews.forEach(video => {
        // Start playing preview when loaded
        video.addEventListener('loadeddata', () => {
            video.play().catch(err => console.log('Preview autoplay failed:', err));
        });

        // Restart when ended
        video.addEventListener('ended', () => {
            video.play().catch(err => console.log('Preview replay failed:', err));
        });

        // Force load the video
        video.load();
    });

    // Add scroll animations
    const animateOnScroll = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    };

    const scrollObserver = new IntersectionObserver(animateOnScroll, {
        threshold: 0.1,
        rootMargin: '0px'
    });

    document.querySelectorAll('.grid-item, .post, .stories-container').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        scrollObserver.observe(el);
    });
});