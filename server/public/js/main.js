// Language Switching
document.addEventListener('DOMContentLoaded', () => {
  // Handle language switching
  // const languageLinks = document.querySelectorAll('.language-selector a');
  // languageLinks.forEach(link => {
  //   link.addEventListener('click', async (e) => {
  //     e.preventDefault();
  //     const lang = link.getAttribute('hreflang').split('-')[0];
  //     const langMap = {
  //       'en': 'en-US',
  //       'zh': 'zh-TW',
  //       'es': 'es-MX',
  //       'nl': 'nl'
  //     };
      
  //     // Set cookie
  //     document.cookie = `lang=${langMap[lang]}; path=/`;
      
  //     // Navigate to new URL
  //     window.location.href = link.getAttribute('href');
  //   });
  // });

  // Mobile menu toggle
  const menuBtn = document.querySelector('.menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('show');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.hamburger') && !e.target.closest('.mobile-menu')) {
        document.body.classList.remove('menu-open');
      }
    });
  }

  // Close mobile menu when pressing escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.body.classList.remove('menu-open');
    }
  });

  // Prevent scrolling when mobile menu is open
  document.body.addEventListener('touchmove', (e) => {
    if (document.body.classList.contains('menu-open')) {
      e.preventDefault();
    }
  }, { passive: false });

  // Close mobile menu when window is resized to desktop size
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      document.body.classList.remove('menu-open');
    }
  });

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Add HTMX boost for smoother page transitions
  htmx.config.globalViewTransitions = true;
  
  // Handle form submissions with HTMX
  htmx.on('htmx:afterRequest', (evt) => {
    if (evt.detail.successful) {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = evt.detail.xhr.response;
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }
    }
  });

  // Add sparkle mouse effect from your original code
  let start = new Date().getTime();
  const originPosition = { x: 0, y: 0 };
  const last = {
    starTimestamp: start,
    starPosition: originPosition,
    mousePosition: originPosition
  };

  const config = {
    starAnimationDuration: 1500,
    minimumTimeBetweenStars: 250,
    minimumDistanceBetweenStars: 75,
    glowDuration: 250,
    maximumGlowPointSpacing: 10,
    colors: ["249 146 253", "252 254 255"],
    sizes: ["1.4rem", "1rem", "0.6rem"],
    animations: ["fall-1", "fall-2", "fall-3"]
  };

  const createStar = position => {
    const star = document.createElement("span");
    star.className = "star fa-solid fa-sparkle";
    star.style.left = position.x + 'px';
    star.style.top = position.y + 'px';
    star.style.fontSize = config.sizes[Math.floor(Math.random() * config.sizes.length)];
    star.style.color = `rgb(${config.colors[Math.floor(Math.random() * config.colors.length)]})`;
    star.style.animationName = config.animations[Math.floor(Math.random() * config.animations.length)];
    star.style.animationDuration = config.starAnimationDuration + 'ms';

    document.body.appendChild(star);
    setTimeout(() => document.body.removeChild(star), config.starAnimationDuration);
  };

  const handleMouseMove = e => {
    const mousePosition = { x: e.clientX, y: e.clientY };
    const now = new Date().getTime();
    const hasMovedFarEnough = Math.hypot(
      mousePosition.x - last.starPosition.x,
      mousePosition.y - last.starPosition.y
    ) >= config.minimumDistanceBetweenStars;
    
    if (hasMovedFarEnough && (now - last.starTimestamp) > config.minimumTimeBetweenStars) {
      createStar(mousePosition);
      last.starPosition = mousePosition;
      last.starTimestamp = now;
    }
  };

  // Only add sparkle effect on pages with .sparkle-mouse class
  if (document.querySelector('.sparkle-mouse')) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', e => handleMouseMove(e.touches[0]));
  }
}); 