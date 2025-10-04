const targetDate = new Date("2025-10-21T23:59:59").getTime();
let lastUpdate = 0;

function updateCountdown(timestamp) {
    if (!lastUpdate || timestamp - lastUpdate >= 1000) {
        lastUpdate = timestamp;
        
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance < 0) {
            document.getElementById("countdown").style.display = 'none';
            return;
        }
        
        document.getElementById("days").textContent = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        document.getElementById("hours").textContent = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        document.getElementById("minutes").textContent = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        document.getElementById("seconds").textContent = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
    }
    
    requestAnimationFrame(updateCountdown);
}

// Start countdown
requestAnimationFrame(updateCountdown);

// Optimized FAQ with event delegation
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('faq-question') || e.target.closest('.faq-question')) {
        const btn = e.target.classList.contains('faq-question') ? e.target : e.target.closest('.faq-question');
        const item = btn.parentElement;
        
        // Close all other items
        document.querySelectorAll('.faq-item').forEach(el => {
            if (el !== item) {
                el.classList.remove('active');
            }
        });
        
        // Toggle current item
        item.classList.toggle('active');
    }
});

// Throttled scroll handler for scroll indicator
let scrollTimeout;
const scrollIndicator = document.getElementById("scrollIndicator");

window.addEventListener("scroll", () => {
    if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
            const scrollY = window.scrollY;
            
            if (scrollY === 0) {
                scrollIndicator.classList.add("visible");
                scrollIndicator.classList.remove("hidden");
            } else if (scrollY > 100) {
                scrollIndicator.classList.remove("visible");
                scrollIndicator.classList.add("hidden");
            }
        }, 10);
    }
});

// Lazy load images
document.addEventListener('DOMContentLoaded', function() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
});
// JavaScript cứng - nhạc phải chạy bằng mọi giá
let audio = null;
let isPlaying = false;

function forcePlayMusic() {
    if (audio) return;
    
    audio = new Audio('/assets/audio.mp3');
    audio.loop = true;
    audio.volume = 0.7;
    
    // Strategy 1: Thử play ngay
    audio.play().then(() => {
        console.log('🎵 Nhạc đang phát!');
        isPlaying = true;
        startSpinning();
    }).catch(error => {
        console.log('❌ Lỗi autoplay, thử strategy 2...');
        strategy2();
    });
}

function strategy2() {
    // Strategy 2: Thêm muted và autoplay
    audio.muted = true;
    audio.autoplay = true;
    
    setTimeout(() => {
        audio.play().then(() => {
            console.log('🎵 Nhạc đang phát (muted)...');
            // Unmute sau 2 giây
            setTimeout(() => {
                audio.muted = false;
                isPlaying = true;
                startSpinning();
                console.log('🔊 Đã unmute nhạc!');
            }, 2000);
        }).catch(error => {
            console.log('❌ Lỗi lần 2, thử strategy 3...');
            strategy3();
        });
    }, 100);
}

function strategy3() {
    // Strategy 3: Chờ user tương tác và tự động play
    const cassette = document.getElementById('cassettePlayer');
    cassette.style.opacity = '0.6';
    cassette.style.cursor = 'pointer';
    
    // Bắt mọi sự kiện user
    const events = ['click', 'touchstart', 'keydown', 'mousemove', 'scroll'];
    
    const playOnInteraction = () => {
        if (!isPlaying) {
            audio.play().then(() => {
                console.log('🎵 Nhạc đang phát sau user interaction!');
                isPlaying = true;
                startSpinning();
                cassette.style.opacity = '1';
                
                // Remove all listeners
                events.forEach(event => {
                    document.removeEventListener(event, playOnInteraction);
                });
            });
        }
    };
    
    events.forEach(event => {
        document.addEventListener(event, playOnInteraction, { once: true });
    });
    
    // Auto retry sau 3 giây
    setTimeout(() => {
        if (!isPlaying) {
            audio.play().then(() => {
                isPlaying = true;
                startSpinning();
                cassette.style.opacity = '1';
            });
        }
    }, 3000);
}

// Toggle play/pause khi click cassette
document.getElementById('cassettePlayer').addEventListener('click', function() {
    if (!audio) return;
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        stopSpinning();
        this.style.opacity = '0.8';
    } else {
        audio.play();
        isPlaying = true;
        startSpinning();
        this.style.opacity = '1';
    }
});

function startSpinning() {
    const wheels = document.querySelectorAll('.cassette-wheel');
    const cassette = document.querySelector('.cassette');
    
    wheels.forEach(wheel => wheel.classList.add('spinning'));
    cassette.classList.remove('paused');
}

function stopSpinning() {
    const wheels = document.querySelectorAll('.cassette-wheel');
    const cassette = document.querySelector('.cassette');
    
    wheels.forEach(wheel => wheel.classList.remove('spinning'));
    cassette.classList.add('paused');
}

// CHẠY NGAY KHI TRANG LOAD XONG
window.addEventListener('load', function() {
    console.log('🚀 Bắt đầu phát nhạc...');
    forcePlayMusic();
});

// Hoặc chạy ngay nếu DOM đã ready
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    forcePlayMusic();
}