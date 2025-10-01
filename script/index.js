// Optimized preloader with timeout fallback
window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    const heroImg = document.querySelector(".hero-img");
    
    let preloaderHidden = false;
    
    const hidePreloader = () => {
        if (!preloaderHidden) {
            preloaderHidden = true;
            preloader.classList.add("hidden");
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 300);
        }
    };
    
    // Hide when hero image loads
    if (heroImg.complete) {
        hidePreloader();
    } else {
        heroImg.addEventListener('load', hidePreloader);
        heroImg.addEventListener('error', hidePreloader); // Fallback if image fails
    }
    
    // Timeout fallback (5 seconds)
    setTimeout(hidePreloader, 5000);
});

// Optimized countdown with requestAnimationFrame
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

// Preload critical images
function preloadImage(url) {
    const img = new Image();
    img.src = url;
}

// Preload important images after page load
window.addEventListener('load', () => {
    setTimeout(() => {
        const imagesToPreload = [
            'assets/intro.webp',
            'assets/timeline.webp',
            'assets/departments.webp'
        ];
        
        imagesToPreload.forEach(preloadImage);
    }, 1000);
});