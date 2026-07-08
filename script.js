const csvFile = 'art.csv';

let artData = [];
let currentCategory = 'All';

// ---------------- OVERLAY ----------------
const overlay = document.createElement('div');
overlay.className = 'fullscreen-overlay';
document.body.appendChild(overlay);

const floatingCategory = document.getElementById('floating-category');

overlay.addEventListener('click', () => {
  overlay.classList.remove('active');
  floatingCategory.style.opacity = 0;

  const img = overlay.querySelector('img');
  if (!img) return;

  const rect = img.dataset.originalRect && JSON.parse(img.dataset.originalRect);

  if (rect) {
    img.style.transform =
      `translate(${rect.left}px, ${rect.top}px)
       scale(${rect.width / img.naturalWidth}, ${rect.height / img.naturalHeight})`;
  }

  setTimeout(() => overlay.innerHTML = '', 350);
});

// ---------------- OBSERVER (LAZY LOAD) ----------------
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const img = entry.target;

    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }

    observer.unobserve(img);
  });
}, {
  rootMargin: '150px'
});

// ---------------- INIT ----------------
window.addEventListener('DOMContentLoaded', init);

function init() {
  fetch(csvFile)
    .then(r => r.text())
    .then(text => {
      artData = csvToArray(text);

      renderCategories();
      renderGallery('All');
    })
    .catch(err => console.error('CSV load error:', err));

  const searchInput = document.getElementById('search');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    renderGallery(currentCategory, query);
  });
}

// ---------------- CSV ----------------
function csvToArray(str) {
  const lines = str.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const clean = line.replace('\r', '');
    const values = clean.split(',').map(v => v.trim());

    return {
      FileName: values[0],
      Category: values[1],
      Title: values[2]
    };
  });
}

// ---------------- CATEGORIES ----------------
function renderCategories() {
  const categories = ['All', ...new Set(artData.map(a => a.Category))];

  const container = document.getElementById('categories');
  container.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;

    if (cat === currentCategory) btn.classList.add('active');

    btn.addEventListener('click', () => {
      currentCategory = cat;
      renderCategories();
      renderGallery(cat);
    });

    container.appendChild(btn);
  });
}

// ---------------- GALLERY ----------------
function renderGallery(filter, searchQuery = '') {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  const filtered = artData
    .filter(a => filter === 'All' || a.Category === filter)
    .filter(a => (a.Title || '').toLowerCase().includes(searchQuery));

  filtered.forEach(a => {
    const img = document.createElement('img');

    const src = `images/${a.FileName}`;

    img.dataset.src = src;
    img.dataset.full = src;
    img.alt = a.Title;
    img.loading = 'lazy';

    img.classList.add('gallery-img');

    observer.observe(img);

    img.addEventListener('click', () => {
    floatingCategory.innerHTML = `
  <span style="font-weight:700">${a.Category}</span>
  <span style="opacity:0.7; margin-left:8px;">${a.Year || ''}</span>
`;

      floatingCategory.textContent = a.Category;
      floatingCategory.style.opacity = 1;

      const zoomImg = document.createElement('img');
      zoomImg.src = img.dataset.full;

      const rect = img.getBoundingClientRect();
      zoomImg.dataset.originalRect = JSON.stringify(rect);

      zoomImg.style.position = 'fixed';
      zoomImg.style.left = rect.left + 'px';
      zoomImg.style.top = rect.top + 'px';
      zoomImg.style.width = rect.width + 'px';
      zoomImg.style.height = rect.height + 'px';
      zoomImg.style.transition = 'all 0.35s ease';

      // ---------------- ZOOM MODE ----------------
     overlay.innerHTML = '';

      // ---------------- PIXEL CLOUD BACKGROUND ----------------
const zoomBg = document.createElement('div');
zoomBg.className = 'zoom-bg';

overlay.appendChild(zoomBg);
overlay.appendChild(zoomImg);

overlay.classList.add('active');

setZoomColours(zoomImg, zoomBg);

      //-------ZOOM ANIMATIONS_______DONT TOUCH

      requestAnimationFrame(() => {
        zoomImg.style.left = '50%';
        zoomImg.style.top = '50%';
        zoomImg.style.transform = 'translate(-50%, -50%) scale(1)';
        zoomImg.style.width = '';
        zoomImg.style.height = '';
      });
    });

    gallery.appendChild(img);
  });
}
// ---------------- PIXEL CLOUD COLOUR BACKGROUND ----------------
function setZoomColours(img, bgEl) {
  function boostColour(r, g, b) {
    const avg = (r + g + b) / 3;

    r = avg + (r - avg) * 1.8;
    g = avg + (g - avg) * 1.8;
    b = avg + (b - avg) * 1.8;

    const max = Math.max(r, g, b);

    if (max < 185) {
      const boost = 185 / Math.max(max, 1);
      r *= boost;
      g *= boost;
      b *= boost;
    }

    r = Math.min(255, Math.max(70, Math.round(r)));
    g = Math.min(255, Math.max(70, Math.round(g)));
    b = Math.min(255, Math.max(70, Math.round(b)));

    return `rgb(${r}, ${g}, ${b})`;
  }

  function sampleColours() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 50;
    canvas.height = 50;

    try {
      ctx.drawImage(img, 0, 0, 50, 50);

      const data = ctx.getImageData(0, 0, 50, 50).data;
      const colours = {};

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max - min;
        const brightness = max;

        if (brightness < 95) continue;
        if (saturation < 45) continue;
        if (r > 215 && g > 215 && b > 215) continue;

        if (
          r > 180 &&
          g > 165 &&
          b > 130 &&
          saturation < 85
        ) continue;

        const key = `${Math.round(r / 36) * 36},${Math.round(g / 36) * 36},${Math.round(b / 36) * 36}`;

        colours[key] = (colours[key] || 0) + 1 + saturation / 50 + brightness / 170;
      }

      const topColours = Object.entries(colours)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([colour]) => {
          const [r, g, b] = colour.split(',').map(Number);
          return boostColour(r, g, b);
        });

      const c1 = topColours[0] || 'rgb(255, 90, 200)';
      const c2 = topColours[1] || 'rgb(90, 220, 255)';
      const c3 = topColours[2] || 'rgb(255, 225, 80)';

      bgEl.innerHTML = '';

      for (let i = 0; i < 90; i++) {
        const pixel = document.createElement('span');
        pixel.className = 'zoom-pixel';

        const colour = [c1, c2, c3][i % 3];

        pixel.style.background = colour;
        pixel.style.left = Math.random() * 100 + '%';
        pixel.style.top = Math.random() * 100 + '%';
        pixel.style.width = 30 + Math.random() * 120 + 'px';
        pixel.style.height = pixel.style.width;
        pixel.style.animationDelay = Math.random() * -12 + 's';
        pixel.style.animationDuration = 8 + Math.random() * 14 + 's';
        pixel.style.opacity = 0.2 + Math.random() * 0.5;

        bgEl.appendChild(pixel);
      }
    } catch (err) {
      bgEl.innerHTML = '';
    }
  }

  if (img.complete) {
    sampleColours();
  } else {
    img.onload = sampleColours;
  }
}

