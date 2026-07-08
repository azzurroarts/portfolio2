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

      // ---------------- STRIPEY ZIGZAG CONCEPT ----------------
const zoomBg = document.createElement('div');
paintBg.className = 'paintsquish-bg';

overlay.appendChild(paintBg);
overlay.appendChild(zoomImg);

      overlay.classList.add('active');

      

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

// ---------------- PAINTSQUISH 2 ----------------
function setPaintsquishColours(img, bgEl) {
  function boostColour(r, g, b) {
    const avg = (r + g + b) / 3;

    r = avg + (r - avg) * 2.1;
    g = avg + (g - avg) * 2.1;
    b = avg + (b - avg) * 2.1;

    const max = Math.max(r, g, b);

    if (max < 190) {
      const boost = 190 / Math.max(max, 1);
      r *= boost;
      g *= boost;
      b *= boost;
    }

    return `rgb(${Math.min(255, Math.max(80, Math.round(r)))}, ${Math.min(255, Math.max(80, Math.round(g)))}, ${Math.min(255, Math.max(80, Math.round(b)))})`;
  }

  function sampleColours() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 70;
    canvas.height = 70;

    let picked = [];

    try {
      ctx.drawImage(img, 0, 0, 70, 70);
      const data = ctx.getImageData(0, 0, 70, 70).data;
      const colours = {};

      for (let i = 0; i < data.length; i += 12) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max - min;
        const brightness = max;

        if (brightness < 75) continue;
        if (saturation < 30) continue;

        const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
        colours[key] = (colours[key] || 0) + 1 + saturation / 45 + brightness / 150;
      }

      picked = Object.entries(colours)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([colour]) => {
          const [r, g, b] = colour.split(',').map(Number);
          return boostColour(r, g, b);
        });
    } catch (err) {
      picked = [];
    }

    const fallback = [
      'rgb(255, 64, 180)',
      'rgb(70, 220, 255)',
      'rgb(255, 225, 70)',
      'rgb(90, 255, 150)',
      'rgb(255, 120, 60)',
      'rgb(170, 110, 255)'
    ];

    const palette = [...picked, ...fallback].slice(0, 6);

    bgEl.innerHTML = '';

    for (let i = 0; i < 46; i++) {
      const blob = document.createElement('span');
      blob.className = 'paintsquish-blob';

      const colour = palette[i % palette.length];
      const size = 180 + Math.random() * 520;

      blob.style.background = colour;
      blob.style.width = size + 'px';
      blob.style.height = size * (0.75 + Math.random() * 0.55) + 'px';
      blob.style.left = Math.random() * 100 + '%';
      blob.style.top = Math.random() * 100 + '%';
      blob.style.animationDelay = Math.random() * -18 + 's';
      blob.style.animationDuration = 10 + Math.random() * 16 + 's';
      blob.style.opacity = 0.35 + Math.random() * 0.4;

      bgEl.appendChild(blob);
    }
  }

  if (img.complete) {
    sampleColours();
  } else {
    img.onload = sampleColours;
  }
}
