/**
 * Continuity Interactive Engine v2.0
 * 
 * Features:
 * 1. Subpixel-perfect infinite continuous marquee (Tickers: Hero badges & Partner logos)
 * 2. Touch & Mouse swiper engine for Slideshows (Section 05 IDEs & Section 09 Case Studies)
 * 3. Animated FAQ Accordion with smooth height transitions & rotating icons
 * 4. Interactive CLI command copy with inline feedback & toast notification
 * 5. Interactive CLI Workflow tabs (Section 11: continuity resume / work / handover)
 * 6. Early Access interactive form submission feedback
 * 7. Navbar active section scroll spy & smooth offset navigation
 */

(function () {
  'use strict';

  function init() {
    initContinuousTickers();
    initSlideshowEngines();
    initFaqAccordion();
    initCliCopyEngine();
    initCliWorkflowTabs();
    initEarlyAccessForm();
    initNavScrollSpy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ==========================================================================
     1. CONTINUOUS SUBPIXEL TICKER ENGINE (Zero glitch / zero jump infinite loop)
     ========================================================================== */
  function initContinuousTickers() {
    const tickerConfigs = [
      { selector: '.framer-njzxgm ul', speed: 0.75, direction: -1 }, // Hero feature badges
      { selector: '.framer-ur9l83 ul', speed: 0.65, direction: -1 }  // Client logos ticker
    ];

    tickerConfigs.forEach(({ selector, speed, direction }) => {
      const ul = document.querySelector(selector);
      if (!ul) return;

      // Disable any conflicting CSS animation so JS has 60fps subpixel control
      ul.style.animation = 'none';
      ul.style.webkitAnimation = 'none';
      ul.style.willChange = 'transform';
      ul.style.display = 'flex';
      ul.style.flexDirection = 'row';
      ul.style.flexWrap = 'nowrap';
      ul.style.width = 'max-content';

      const items = ul.querySelectorAll('li');
      if (items.length < 2) return;

      // Reset any inline item transforms
      items.forEach(li => {
        li.style.transform = 'none';
        li.style.flexShrink = '0';
      });

      // Halfway index represents the beginning of the cloned set
      const halfCount = Math.floor(items.length / 2);
      
      let currentPos = 0;
      let isPaused = false;
      let animationFrameId = null;

      // Calculate the exact distance between Set A and Set B
      function getResetThreshold() {
        const first = items[0].getBoundingClientRect();
        const clone = items[halfCount].getBoundingClientRect();
        const dist = Math.abs(clone.left - first.left);
        return dist > 0 ? dist : (ul.scrollWidth / 2);
      }

      let resetThreshold = getResetThreshold();

      // Recalculate on window resize
      window.addEventListener('resize', () => {
        resetThreshold = getResetThreshold();
      });

      // Pause on hover or touch
      const container = ul.closest('.framer-njzxgm') || ul.closest('.framer-ur9l83') || ul;
      container.addEventListener('mouseenter', () => { isPaused = true; });
      container.addEventListener('mouseleave', () => { isPaused = false; });
      container.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
      container.addEventListener('touchend', () => { isPaused = false; }, { passive: true });

      function step() {
        if (!isPaused && resetThreshold > 0) {
          currentPos += speed;
          if (currentPos >= resetThreshold) {
            currentPos -= resetThreshold;
          }
          const tx = direction * currentPos;
          ul.style.transform = `translate3d(${tx}px, 0, 0)`;
        }
        animationFrameId = requestAnimationFrame(step);
      }

      animationFrameId = requestAnimationFrame(step);
    });
  }

  /* ==========================================================================
     2. SLIDESHOW SWIPER ENGINE (Touch & Mouse Drag + Arrow Buttons)
     ========================================================================== */
  function initSlideshowEngines() {
    const slideshowSections = document.querySelectorAll('section.framer-slideshow');

    slideshowSections.forEach((section, sIdx) => {
      const ul = section.querySelector('ul');
      if (!ul) return;

      const items = Array.from(ul.children);
      if (items.length === 0) return;

      // Ensure all cards are visible
      items.forEach(li => {
        li.querySelectorAll('div').forEach(div => {
          if (div.style.visibility === 'hidden') {
            div.style.visibility = 'visible';
          }
        });
      });

      // Find arrows in controls
      const buttons = section.querySelectorAll('fieldset.framer--slideshow-controls button');
      const prevBtn = buttons[0];
      const nextBtn = buttons[1];

      // Measure slide step dynamically
      function getStep() {
        const firstChild = items[0].firstElementChild || items[0];
        const cardWidth = firstChild.getBoundingClientRect().width;
        let gap = 10;
        if (items.length > 1) {
          const secondChild = items[1].firstElementChild || items[1];
          const calculatedGap = secondChild.getBoundingClientRect().left - firstChild.getBoundingClientRect().right;
          if (calculatedGap > 0 && calculatedGap < 100) {
            gap = calculatedGap;
          }
        }
        return { cardWidth, gap, step: cardWidth + gap };
      }

      let currentIndex = 0;
      const isSingleCardSlider = (sIdx === 1) || (items.length <= 4); // Case Studies = single card view

      function getMaxIndex() {
        if (isSingleCardSlider) {
          return items.length - 1;
        }
        const { cardWidth } = getStep();
        const containerWidth = ul.parentElement.getBoundingClientRect().width;
        const visibleCards = Math.max(1, Math.floor(containerWidth / (cardWidth || 300)));
        return Math.max(0, items.length - visibleCards);
      }

      function updateSlide(targetIndex, animate = true) {
        const maxIdx = getMaxIndex();
        if (targetIndex > maxIdx) {
          targetIndex = 0;
        } else if (targetIndex < 0) {
          targetIndex = maxIdx;
        }
        currentIndex = targetIndex;

        const { step } = getStep();
        const offset = -(currentIndex * step);

        ul.style.transition = animate ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
        ul.style.transform = `translate3d(${offset}px, 0, 0)`;
      }

      // Initial alignment
      updateSlide(0, false);

      // Button controls
      if (prevBtn) {
        prevBtn.setAttribute('title', 'Previous Slide');
        prevBtn.style.cursor = 'pointer';
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          updateSlide(currentIndex - 1, true);
        });
      }

      if (nextBtn) {
        nextBtn.setAttribute('title', 'Next Slide');
        nextBtn.style.cursor = 'pointer';
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          updateSlide(currentIndex + 1, true);
        });
      }

      // Pointer-based touch & mouse drag swiping
      let isPointerDown = false;
      let startX = 0;
      let startY = 0;
      let currentDeltaX = 0;
      let isHorizontalSwipe = false;

      ul.style.cursor = 'grab';
      ul.style.touchAction = 'pan-y';

      ul.addEventListener('pointerdown', (e) => {
        // Only primary mouse button or touch
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        isPointerDown = true;
        startX = e.clientX;
        startY = e.clientY;
        currentDeltaX = 0;
        isHorizontalSwipe = false;
        ul.style.cursor = 'grabbing';
        ul.style.transition = 'none';
      });

      window.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Determine if horizontal swipe
        if (!isHorizontalSwipe && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
          if (Math.abs(dx) >= Math.abs(dy)) {
            isHorizontalSwipe = true;
          } else {
            isPointerDown = false;
            return;
          }
        }

        if (isHorizontalSwipe) {
          currentDeltaX = dx;
          const { step } = getStep();
          const baseOffset = -(currentIndex * step);
          ul.style.transform = `translate3d(${baseOffset + currentDeltaX}px, 0, 0)`;
        }
      });

      function onPointerEnd() {
        if (!isPointerDown) return;
        isPointerDown = false;
        ul.style.cursor = 'grab';

        if (isHorizontalSwipe) {
          const threshold = 40;
          if (currentDeltaX < -threshold) {
            updateSlide(currentIndex + 1, true);
          } else if (currentDeltaX > threshold) {
            updateSlide(currentIndex - 1, true);
          } else {
            updateSlide(currentIndex, true);
          }
        } else {
          updateSlide(currentIndex, true);
        }
        currentDeltaX = 0;
        isHorizontalSwipe = false;
      }

      window.addEventListener('pointerup', onPointerEnd);
      window.addEventListener('pointercancel', onPointerEnd);

      // Keyboard arrow keys when hovered
      section.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          updateSlide(currentIndex - 1, true);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          updateSlide(currentIndex + 1, true);
        }
      });

      // Responsive resize
      window.addEventListener('resize', () => {
        updateSlide(currentIndex, false);
      });
    });
  }

  /* ==========================================================================
     3. FAQ ACCORDION ENGINE (Smooth Height Transition & Spring Rotation)
     ========================================================================== */
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.continuity-faq-item');
    if (!faqItems.length) return;

    faqItems.forEach((item, index) => {
      const trigger = item.querySelector('.continuity-faq-trigger');
      const content = item.querySelector('.continuity-faq-content');
      const icon = item.querySelector('.continuity-faq-icon');

      if (!trigger || !content) return;

      trigger.style.cursor = 'pointer';
      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-expanded', 'false');

      function toggle() {
        const isActive = item.classList.contains('active');

        // Close other items
        faqItems.forEach(other => {
          if (other !== item && other.classList.contains('active')) {
            other.classList.remove('active');
            const oContent = other.querySelector('.continuity-faq-content');
            const oIcon = other.querySelector('.continuity-faq-icon');
            const oTrigger = other.querySelector('.continuity-faq-trigger');
            if (oContent) oContent.style.maxHeight = '0px';
            if (oIcon) {
              oIcon.style.transform = 'rotate(0deg)';
              oIcon.style.backgroundColor = 'rgba(243, 255, 201, 0.08)';
              oIcon.style.color = '#f3ffc9';
            }
            if (oTrigger) oTrigger.setAttribute('aria-expanded', 'false');
          }
        });

        if (isActive) {
          item.classList.remove('active');
          content.style.maxHeight = '0px';
          if (icon) {
            icon.style.transform = 'rotate(0deg)';
            icon.style.backgroundColor = 'rgba(243, 255, 201, 0.08)';
          }
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          content.style.maxHeight = `${content.scrollHeight + 32}px`;
          if (icon) {
            icon.style.transform = 'rotate(45deg)';
            icon.style.backgroundColor = 'rgba(243, 255, 201, 0.2)';
          }
          trigger.setAttribute('aria-expanded', 'true');
        }
      }

      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggle();
      });

      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /* ==========================================================================
     4. CLI COPY ENGINE (Inline Feedback + Sleek Bottom Toast)
     ========================================================================== */
  function initCliCopyEngine() {
    let toastTimeout = null;

    function showToast(message) {
      let toast = document.getElementById('continuity-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'continuity-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '28px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        toast.style.backgroundColor = '#161a18';
        toast.style.color = '#f3ffc9';
        toast.style.border = '1px solid #585e44';
        toast.style.borderRadius = '100px';
        toast.style.padding = '10px 24px';
        toast.style.fontSize = '14px';
        toast.style.fontFamily = 'Arial, sans-serif';
        toast.style.fontWeight = '500';
        toast.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.8), 0 0 16px rgba(243, 255, 201, 0.15)';
        toast.style.zIndex = '999999';
        toast.style.pointerEvents = 'none';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
        document.body.appendChild(toast);
      }

      toast.innerHTML = `<span style="color:#f3ffc9;margin-right:8px;">✓</span> ${message}`;
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';

      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
      }, 2400);
    }

    // Match all copyable triggers
    document.querySelectorAll('*').forEach(el => {
      // Avoid matching large containers
      if (el.children.length > 3) return;
      
      const txt = (el.innerText || el.textContent || '').trim();
      const isCliCommand = txt === 'npm i -g continuity' || 
                           txt === 'continuity resume' || 
                           txt === 'continuity work' || 
                           txt === 'continuity handover' ||
                           txt === 'Install CLI';

      if (isCliCommand && !el.dataset.copyInitialized) {
        el.dataset.copyInitialized = 'true';
        el.style.cursor = 'pointer';

        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          let command = 'npm install -g continuity';
          if (txt.includes('resume')) command = 'continuity resume';
          else if (txt.includes('work')) command = 'continuity work';
          else if (txt.includes('handover')) command = 'continuity handover';

          navigator.clipboard.writeText(command).then(() => {
            const originalText = el.innerText;
            el.innerText = '✓ Copied!';
            el.style.transition = 'color 0.2s, border-color 0.2s';
            el.style.borderColor = '#f3ffc9';

            showToast(`Copied to clipboard: <code style="color:#fff;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;">${command}</code>`);

            setTimeout(() => {
              el.innerText = originalText;
              el.style.borderColor = '';
            }, 2000);
          }).catch(() => {
            showToast(`Command: ${command}`);
          });
        });
      }
    });
  }

  /* ==========================================================================
     5. INTERACTIVE CLI WORKFLOW TABS (Section 11)
     ========================================================================== */
  function initCliWorkflowTabs() {
    const steps = [
      { container: document.querySelector('.framer-x12l25'), command: 'continuity resume' },
      { container: document.querySelector('.framer-1foqsuf'), command: 'continuity work' },
      { container: document.querySelector('.framer-r1rtjp'), command: 'continuity handover' }
    ].filter(s => s.container);

    if (steps.length === 3) {
      steps.forEach((step, idx) => {
        step.container.style.cursor = 'pointer';
        step.container.setAttribute('title', `Click to inspect: ${step.command}`);

        step.container.addEventListener('click', () => {
          steps.forEach((s, i) => {
            if (i === idx) {
              s.container.style.opacity = '1';
              s.container.style.border = '1px solid #585e44';
            } else {
              s.container.style.opacity = '0.4';
              s.container.style.border = 'none';
            }
          });
        });
      });
    }
  }

  /* ==========================================================================
     6. EARLY ACCESS INTERACTIVE FORM
     ========================================================================== */
  function initEarlyAccessForm() {
    const form = document.querySelector('form') || document.querySelector('.framer-11qbgpl-container')?.closest('form');
    const submitBtn = document.querySelector('button[type="submit"]');
    const emailInput = document.querySelector('input[type="email"]');

    if (submitBtn) {
      submitBtn.style.cursor = 'pointer';
      submitBtn.style.opacity = '1';

      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailInput ? emailInput.value.trim() : '';
        if (email && email.includes('@') && email.includes('.')) {
          submitBtn.innerHTML = '<span style="color:#161a18;font-weight:700;">✓ Access Granted</span>';
          submitBtn.style.backgroundColor = '#f3ffc9';
          if (emailInput) {
            emailInput.value = '';
            emailInput.placeholder = 'Welcome aboard!';
            emailInput.disabled = true;
          }
        } else {
          if (emailInput) {
            emailInput.focus();
            emailInput.style.outline = '1px solid #f3ffc9';
            setTimeout(() => { emailInput.style.outline = 'none'; }, 2000);
          }
        }
      });
    }
  }

  /* ==========================================================================
     7. NAVBAR SCROLL SPY & SMOOTH OFFSET NAVIGATION
     ========================================================================== */
  function initNavScrollSpy() {
    // Smooth scrolling with 80px sticky header offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const targetY = target.getBoundingClientRect().top + window.scrollY - 75;
          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });
        }
      });
    });

    // Active pill sync
    const sectionIds = ['hero', 'features', 'about', 'pillars', 'results', 'method', 'faq'];
    const navLinks = document.querySelectorAll('.framer-qyI5w a');

    function checkActiveSection() {
      const scrollPos = window.scrollY + 160;
      let currentActiveId = '';

      sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            currentActiveId = id;
          }
        }
      });

      if (currentActiveId) {
        navLinks.forEach(a => {
          const href = a.getAttribute('href');
          if (href === `#${currentActiveId}`) {
            a.style.color = '#f3ffc9';
            a.style.backgroundColor = 'var(--token-60e80955-6a00-4025-b930-d753d40d1742, rgb(47, 49, 38))';
          } else if (href && href.startsWith('#')) {
            a.style.color = 'var(--token-0b26d712-cbcf-4ace-a7c0-88344a26d4c7, rgb(169, 173, 155))';
            a.style.backgroundColor = 'transparent';
          }
        });
      }
    }

    window.addEventListener('scroll', checkActiveSection, { passive: true });
    checkActiveSection();
  }

})();
