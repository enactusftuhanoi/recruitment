window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  setTimeout(() => {
    preloader.classList.add("hidden");
  }, 500);
});

const targetDate = new Date("2025-10-21T23:59:59").getTime();
function updateCountdown() {
  const now = new Date().getTime();
  const distance = targetDate - now;
  if (distance < 0) return;
  document.getElementById("days").innerText = Math.floor(
    distance / (1000 * 60 * 60 * 24)
  );
  document.getElementById("hours").innerText = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  document.getElementById("minutes").innerText = Math.floor(
    (distance % (1000 * 60 * 60)) / (1000 * 60)
  );
  document.getElementById("seconds").innerText = Math.floor(
    (distance % (1000 * 60)) / 1000
  );
}
setInterval(updateCountdown, 1000);
updateCountdown();

document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.parentElement;
    const allItems = document.querySelectorAll(".faq-item");
    // Đóng tất cả các item khác
    allItems.forEach((el) => {
      if (el !== item) {
        el.classList.remove("active");
      }
    });
    // Toggle item hiện tại
    item.classList.toggle("active");
  });
});

// Scroll Down Indicator Logic
const scrollIndicator = document.getElementById("scrollIndicator");

// Ẩn indicator khi scroll
window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  if (scrollY > 100) {
    // Ẩn sau khi scroll xuống 100px
    scrollIndicator.classList.remove("visible");
    scrollIndicator.classList.add("hidden");
  } else {
    scrollIndicator.classList.remove("hidden");
    scrollIndicator.classList.add("visible");
  }
});

// Hiển thị lại indicator khi scroll lên đầu trang
window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  if (scrollY === 0) {
    scrollIndicator.classList.remove("hidden");
    scrollIndicator.classList.add("visible");
  }
});
// Preloader với timeout 5s
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  let loaded = false;
  
  // Đảm bảo tối đa 5s
  const maxLoadTime = setTimeout(() => {
    if (!loaded) {
      preloader.classList.add("hidden");
      loaded = true;
    }
  }, 5000); // 5 giây

  // Hoặc khi trang load xong (nhanh hơn)
  window.addEventListener('DOMContentLoaded', () => {
    if (!loaded) {
      clearTimeout(maxLoadTime);
      preloader.classList.add("hidden");
      loaded = true;
    }
  });

  // Fallback: khi mọi thứ load xong
  window.addEventListener('load', () => {
    if (!loaded) {
      clearTimeout(maxLoadTime);
      setTimeout(() => {
        preloader.classList.add("hidden");
        loaded = true;
      }, 500); // Thêm delay nhẹ cho mượt
    }
  });
});