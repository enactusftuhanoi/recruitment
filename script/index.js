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
// JavaScript cho băng cát sét
let musicInitialized = false;
let isPlaying = true;

function initBackgroundMusic() {
    if (musicInitialized) return;
    
    const audio = new Audio('/assets/audio.mp3');
    audio.loop = true;
    audio.volume = 0.7;
    
    // Thử phát nhạc ngay lập tức
    audio.play().then(() => {
        console.log('Nhạc đang phát');
        startSpinning();
    }).catch(error => {
        console.log('Chờ user tương tác...');
        // Đợi user click vào băng cát sét để bắt đầu
        const cassette = document.getElementById('cassettePlayer');
        cassette.style.opacity = '0.7';
        cassette.title = 'Click để bật nhạc';
    });
    
    // Sự kiện click để toggle play/pause
    document.getElementById('cassettePlayer').addEventListener('click', function() {
        if (audio.paused) {
            audio.play();
            isPlaying = true;
            startSpinning();
            this.style.opacity = '1';
        } else {
            audio.pause();
            isPlaying = false;
            stopSpinning();
            this.style.opacity = '0.8';
        }
    });
    
    // Auto start khi user tương tác với page
    document.addEventListener('click', function startOnInteraction() {
        if (audio.paused) {
            audio.play();
            startSpinning();
        }
        document.removeEventListener('click', startOnInteraction);
    });
    
    musicInitialized = true;
}

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

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', initBackgroundMusic);

// Hoặc khởi tạo ngay lập tức
initBackgroundMusic();