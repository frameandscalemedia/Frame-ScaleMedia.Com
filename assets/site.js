/* Frame and Scale Media shared behavior. Loaded on every page with defer. */
(function () {
  'use strict';

  /* Mobile nav toggle */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Media slots: show the "coming soon" frame until a real file loads.
     Drop a video into assets/portfolio with the name in the HTML and it appears automatically. */
  function watchSlot(slot) {
    var media = slot.querySelector('video, img');
    if (!media) return;
    var mark = function () { slot.classList.add('has-media'); };
    if (media.tagName === 'IMG') {
      if (media.complete && media.naturalWidth) mark();
      else media.addEventListener('load', mark);
    } else {
      if (media.readyState >= 1) mark();
      media.addEventListener('loadedmetadata', mark);
      media.addEventListener('loadeddata', mark);
    }
  }
  document.querySelectorAll('.media-slot').forEach(watchSlot);

  /* Play muted preview videos only while they are on screen */
  var lazyVideos = document.querySelectorAll('video.lazy-autoplay');
  if ('IntersectionObserver' in window && lazyVideos.length) {
    var videoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (v.preload === 'none') { v.preload = 'metadata'; v.load(); }
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    lazyVideos.forEach(function (v) { videoIO.observe(v); });
  }

  /* Portfolio: click a style to open its examples right below that row */
  var toggles = document.querySelectorAll('.pf-toggle');
  function closePanel(btn, returnFocus) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', 'false');
    btn.closest('.pf-card').classList.remove('is-active');
    if (panel) {
      panel.hidden = true;
      panel.querySelectorAll('video').forEach(function (v) { v.pause(); });
    }
    if (returnFocus) btn.focus();
  }
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      toggles.forEach(function (other) { if (other !== btn) closePanel(other, false); });
      if (isOpen) { closePanel(btn, false); return; }
      btn.setAttribute('aria-expanded', 'true');
      btn.closest('.pf-card').classList.add('is-active');
      panel.hidden = false;
      panel.querySelectorAll('video').forEach(function (v) {
        if (v.preload === 'none') { v.preload = 'metadata'; v.load(); }
      });
      /* point the little notch at the card that opened it */
      var cardBox = btn.getBoundingClientRect();
      var panelBox = panel.getBoundingClientRect();
      panel.style.setProperty('--arrow', (cardBox.left + cardBox.width / 2 - panelBox.left) + 'px');
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var top = panel.getBoundingClientRect().top + window.pageYOffset - 110;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  document.querySelectorAll('.pf-close').forEach(function (b) {
    b.addEventListener('click', function () {
      var btn = document.querySelector('.pf-toggle[aria-controls="' + b.closest('.pf-panel').id + '"]');
      if (btn) closePanel(btn, true);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openBtn = document.querySelector('.pf-toggle[aria-expanded="true"]');
    if (openBtn && (!lightbox || lightbox.hidden)) closePanel(openBtn, true);
  });


  /* Only one example video plays at a time */
  document.addEventListener('play', function (e) {
    if (!e.target.classList || !e.target.classList.contains('example-video')) return;
    document.querySelectorAll('video.example-video').forEach(function (v) { if (v !== e.target) v.pause(); });
  }, true);

  /* Image lightbox for still photos */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lightboxImg = document.getElementById('lightboxImg');
    var closeBtn = document.getElementById('lightboxClose');
    var lastFocused = null;
    var openLightbox = function (src, alt) {
      lastFocused = document.activeElement;
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.hidden = false;
      requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };
    var closeLightbox = function () {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () { lightbox.hidden = true; lightboxImg.src = ''; }, 250);
      if (lastFocused) lastFocused.focus();
    };
    document.querySelectorAll('.media-slot--zoom img, .showcase-photo img').forEach(function (img) {
      img.addEventListener('click', function () { openLightbox(img.currentSrc || img.src, img.alt); });
    });
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });
  }

  /* Brand reel on the About page: try sound first, fall back to muted with a one click sound button */
  var heroVideo = document.querySelector('.hero-video');
  var heroSoundBtn = document.getElementById('heroSoundBtn');
  var heroPlayerNote = document.getElementById('heroPlayerNote');
  if (heroVideo) {
    heroVideo.muted = false;
    var startWithSound = heroVideo.play();
    if (startWithSound && typeof startWithSound.catch === 'function') {
      startWithSound.catch(function () {
        heroVideo.muted = true;
        heroVideo.play().catch(function () {});
        if (heroSoundBtn) heroSoundBtn.hidden = false;
        if (heroPlayerNote) heroPlayerNote.textContent = 'Autoplay muted by your browser';
      });
    }
    if (heroSoundBtn) {
      heroSoundBtn.addEventListener('click', function () {
        heroVideo.muted = false;
        heroVideo.volume = 1;
        heroVideo.play().catch(function () {});
        heroSoundBtn.hidden = true;
        if (heroPlayerNote) heroPlayerNote.textContent = 'Sound and playback controls available';
      });
    }
  }

  /* Cookie notice */
  var KEY = 'fsm_cookie_ack_v1';
  var banner = document.getElementById('cookieBanner');
  var acceptBtn = document.getElementById('cookieBannerAccept');
  if (banner && acceptBtn) {
    var acked = false;
    try { acked = !!localStorage.getItem(KEY); } catch (e) {}
    if (!acked) {
      requestAnimationFrame(function () { banner.classList.add('is-visible'); });
      acceptBtn.addEventListener('click', function () {
        try { localStorage.setItem(KEY, '1'); } catch (e) {}
        banner.classList.remove('is-visible');
      });
    }
  }
})();
