/**
 * Continuity Interactive Engine
 * Handles:
 * - Slideshow swiping & button controls (Section 05 & Section 09)
 * - FAQ accordion expand/collapse
 * - Service tab switching
 * - Smooth anchor navigation & active navbar states
 * - CLI copy interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initSlideshows();
  initFaqAccordion();
  initCliCopy();
  initNavActiveSync();
});

/* -------------------------------------------------------------
 * 1. SLIDESHOW SWIPER & CONTROLS
 * ----------------------------------------------------------- */
function initSlideshows() {
  const slideshowSections = document.querySelectorAll('section.framer-slideshow');

  slideshowSections.forEach((section, sIndex) => {
    const ul = section.querySelector('ul');
    if (!ul) return;

    const items = ul.querySelectorAll('li');
    if (items.length === 0) return;

    const buttons = section.querySelectorAll('fieldset.framer--slideshow-controls button');
    const prevBtn = buttons[0];
    const nextBtn = buttons[1];

    // Compute item width and gap
    function getMetrics() {
      const firstItem = items[0];
      const secondItem = items[1];
      const itemWidth = firstItem.getBoundingClientRect().width;
      let gap = 10;
      if (secondItem) {
        gap = secondItem.getBoundingClientRect().left - firstItem.getBoundingClientRect().right;
        if (gap < 0) gap = 10;
      }
      return { itemWidth, gap, step: itemWidth + gap };
    }

    let currentIndex = 0;
    const maxIndex = items.length - 1;

    // Reset initial transform to 0 for a clean start
    ul.style.transition = 'transform 0.45s cubic-bezier(0.44, 0, 0.56, 1)';
    ul.style.transform = 'translateX(0px)';

    function goToIndex(idx) {
      if (idx < 0) idx = maxIndex;
      if (idx > maxIndex) idx = 0;
      currentIndex = idx;
      const { step } = getMetrics();
      const offset = -(currentIndex * step);
      ul.style.transition = 'transform 0.45s cubic-bezier(0.44, 0, 0.56, 1)';
      ul.style.transform = `translateX(${offset}px)`;
    }

    if (prevBtn) {
      prevBtn.style.cursor = 'pointer';
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToIndex(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.style.cursor = 'pointer';
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToIndex(currentIndex + 1);
      });
    }

    // Touch swipe support
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    ul.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      ul.style.transition = 'none';
    }, { passive: true });

    ul.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      const { step } = getMetrics();
      const baseOffset = -(currentIndex * step);
      ul.style.transform = `translateX(${baseOffset + diff}px)`;
    }, { passive: true });

    ul.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      const diff = currentX - startX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToIndex(currentIndex - 1);
        } else {
          goToIndex(currentIndex + 1);
        }
      } else {
        goToIndex(currentIndex);
      }
      startX = 0;
      currentX = 0;
    });

    // Mouse drag support
    let mouseStartX = 0;
    let isMouseDown = false;

    ul.addEventListener('mousedown', (e) => {
      mouseStartX = e.clientX;
      isMouseDown = true;
      ul.style.cursor = 'grabbing';
      ul.style.transition = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const diff = e.clientX - mouseStartX;
      const { step } = getMetrics();
      const baseOffset = -(currentIndex * step);
      ul.style.transform = `translateX(${baseOffset + diff}px)`;
    });

    window.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      ul.style.cursor = 'grab';
      const diff = e.clientX - mouseStartX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) {
          goToIndex(currentIndex - 1);
        } else {
          goToIndex(currentIndex + 1);
        }
      } else {
        goToIndex(currentIndex);
      }
    });

    // Handle responsive resize
    window.addEventListener('resize', () => {
      goToIndex(currentIndex);
    });
  });
}

/* -------------------------------------------------------------
 * 2. FAQ ACCORDION LOGIC
 * ----------------------------------------------------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.continuity-faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.continuity-faq-trigger');
    const content = item.querySelector('.continuity-faq-content');
    const icon = item.querySelector('.continuity-faq-icon');

    if (trigger && content) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // Close all other items for a clean single-open behavior
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
            const otherContent = other.querySelector('.continuity-faq-content');
            const otherIcon = other.querySelector('.continuity-faq-icon');
            if (otherContent) otherContent.style.maxHeight = '0px';
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
          }
        });

        if (isOpen) {
          item.classList.remove('active');
          content.style.maxHeight = '0px';
          if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
          item.classList.add('active');
          content.style.maxHeight = content.scrollHeight + 30 + 'px';
          if (icon) icon.style.transform = 'rotate(45deg)';
        }
      });
    }
  });
}

/* -------------------------------------------------------------
 * 3. CLI COPY INTERACTIONS
 * ----------------------------------------------------------- */
function initCliCopy() {
  document.querySelectorAll('a, button, div').forEach(el => {
    const text = el.textContent ? el.textContent.trim() : '';
    if (text === 'npm i -g continuity' || text.includes('continuity resume') || text === 'Install CLI') {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        const toCopy = text.includes('resume') ? 'continuity resume' : 'npm install -g continuity';
        navigator.clipboard.writeText(toCopy).then(() => {
          const originalText = el.innerText;
          el.innerText = '✓ Copied!';
          el.style.borderColor = '#f3ffc9';
          setTimeout(() => {
            el.innerText = originalText;
            el.style.borderColor = '';
          }, 2000);
        });
      });
    }
  });
}

/* -------------------------------------------------------------
 * 4. NAVBAR ACTIVE SYNC
 * ----------------------------------------------------------- */
function initNavActiveSync() {
  const sectionIds = ['hero', 'about', 'features', 'pillars', 'stats', 'results', 'method', 'faq'];
  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 150;
    sectionIds.forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          document.querySelectorAll('.framer-qyI5w a').forEach(a => {
            const href = a.getAttribute('href');
            if (href === `#${id}`) {
              a.style.color = '#f3ffc9';
              a.style.backgroundColor = 'var(--token-60e80955-6a00-4025-b930-d753d40d1742, rgb(47, 49, 38))';
            } else if (href && href.startsWith('#')) {
              a.style.color = 'var(--token-0b26d712-cbcf-4ace-a7c0-88344a26d4c7, rgb(169, 173, 155))';
              a.style.backgroundColor = 'transparent';
            }
          });
        }
      }
    });
  }, { passive: true });
}
