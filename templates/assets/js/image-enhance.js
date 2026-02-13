/**
 * Image enhancements: responsive sizing, zoom button, lightbox overlay
 */
document.addEventListener('DOMContentLoaded', function () {
  // --- Create shared lightbox overlay ---
  var overlay = document.createElement('div');
  overlay.className = 'img-lightbox-overlay';

  var lightboxImg = document.createElement('img');
  lightboxImg.alt = '';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'img-lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close lightbox');
  closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  overlay.appendChild(lightboxImg);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  // --- Lightbox open / close ---
  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(function () {
      lightboxImg.src = '';
      lightboxImg.alt = '';
    }, 300);
  }

  // Close triggers
  closeBtn.addEventListener('click', closeLightbox);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeLightbox();
    }
  });

  // --- Enhance article images ---
  var images = document.querySelectorAll('section.content img');
  images.forEach(function (img) {
    function enhance() {
      // Skip small images (icons, badges)
      if (img.naturalWidth > 0 && img.naturalWidth < 80) return;

      // Avoid double-wrapping
      if (img.parentElement && img.parentElement.classList.contains('img-zoom-wrapper')) return;

      // Wrap image
      var wrapper = document.createElement('div');
      wrapper.className = 'img-zoom-wrapper';
      img.parentElement.insertBefore(wrapper, img);
      wrapper.appendChild(img);

      // Zoom button
      var btn = document.createElement('button');
      btn.className = 'img-zoom-btn';
      btn.setAttribute('aria-label', 'Zoom image');
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';

      btn.addEventListener('click', function () {
        openLightbox(img.src, img.alt);
      });

      wrapper.appendChild(btn);

      // Double-click on image opens lightbox
      img.addEventListener('dblclick', function () {
        openLightbox(img.src, img.alt);
      });
    }

    if (img.complete && img.naturalWidth > 0) {
      enhance();
    } else {
      img.addEventListener('load', enhance);
    }
  });
});
