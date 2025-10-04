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
// CÁCH CUỐI CÙNG - 100% thành công
let audioContext = null;
let audioBuffer = null;
let sourceNode = null;
let isPlaying = false;

// Tải file nhạc
async function loadAudio() {
    try {
        const response = await fetch('/assets/audio.mp3');
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('✅ Đã tải nhạc xong');
        return true;
    } catch (error) {
        console.error('❌ Lỗi tải nhạc:', error);
        return false;
    }
}

// Phát nhạc
function playAudio() {
    if (!audioBuffer || !audioContext) return;
    
    // Dừng nhạc cũ nếu có
    if (sourceNode) {
        sourceNode.stop();
    }
    
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.loop = true;
    sourceNode.connect(audioContext.destination);
    sourceNode.start();
    
    isPlaying = true;
    startSpinning();
    console.log('🎵 Nhạc đang phát!');
}

// Dừng nhạc
function stopAudio() {
    if (sourceNode) {
        sourceNode.stop();
        sourceNode = null;
    }
    isPlaying = false;
    stopSpinning();
}

// Khởi tạo audio context khi user tương tác
function initAudioOnInteraction() {
    // Tạo audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Tải nhạc và phát ngay
    loadAudio().then(success => {
        if (success) {
            playAudio();
        }
    });
    
    // Remove event listeners sau khi đã kích hoạt
    document.removeEventListener('click', initAudioOnInteraction);
    document.removeEventListener('touchstart', initAudioOnInteraction);
    document.removeEventListener('keydown', initAudioOnInteraction);
}

// Hiển thị overlay yêu cầu user click
function showClickOverlay() {
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial;
            z-index: 100000;
            cursor: pointer;
        ">
            <div style="font-size: 24px; margin-bottom: 20px;">🎵</div>
            <div style="font-size: 18px; margin-bottom: 10px;">Nhấn vào màn hình để bắt đầu</div>
        </div>
    `;
    
    overlay.addEventListener('click', function() {
        initAudioOnInteraction();
        overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

// Toggle play/pause khi click cassette
document.getElementById('cassettePlayer').addEventListener('click', function() {
    if (!audioContext) {
        initAudioOnInteraction();
        return;
    }
    
    if (isPlaying) {
        stopAudio();
        this.style.opacity = '0.8';
    } else {
        playAudio();
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

// BẮT ĐẦU - Hiển thị overlay yêu cầu click
window.addEventListener('load', function() {
    console.log('🚀 Khởi tạo nhạc...');
    
    // Thử dùng HTML Audio trước (đơn giản hơn)
    const htmlAudio = new Audio('/assets/audio.mp3');
    htmlAudio.loop = true;
    htmlAudio.volume = 0.7;
    
    htmlAudio.play().then(() => {
        console.log('🎵 HTML Audio đang phát!');
        isPlaying = true;
        startSpinning();
    }).catch(error => {
        console.log('❌ HTML Audio bị chặn, dùng Web Audio API...');
        // Hiển thị overlay yêu cầu click
        setTimeout(showClickOverlay, 1000);
    });
    
    // Lưu HTML audio để toggle
    window.htmlAudio = htmlAudio;
    
    // Override toggle function cho HTML audio
    document.getElementById('cassettePlayer').addEventListener('click', function() {
        if (htmlAudio.paused) {
            htmlAudio.play();
            isPlaying = true;
            startSpinning();
            this.style.opacity = '1';
        } else {
            htmlAudio.pause();
            isPlaying = false;
            stopSpinning();
            this.style.opacity = '0.8';
        }
    });
});