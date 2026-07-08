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
zoomBg.className = 'paintsquish-bg';

overlay.appendChild(zoomBg);
overlay.appendChild(zoomImg);

setPaintsquishColours(zoomImg, zoomBg);

      
      overlay.classList.add('active');

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

// ---------------- PAINTSQUISH COLOUR BACKGROUND ----------------
function setPaintsquishColours(img, bgEl) {
  function boostColour(r, g, b) {
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);

    // brighten weak/dull colours
    if (max < 180) {
      const boost = 180 / Math.max(max, 1);
      r *= boost;
      g *= boost;
      b *= boost;
    }

    // increase saturation by pushing away from grey average
    const avg = (r + g + b) / 3;
    r = avg + (r - avg) * 1.9;
    g = avg + (g - avg) * 1.9;
    b = avg + (b - avg) * 1.9;

    r = Math.max(45, Math.min(255, Math.round(r)));
    g = Math.max(45, Math.min(255, Math.round(g)));
    b = Math.max(45, Math.min(255, Math.round(b)));

    return `rgb(${r}, ${g}, ${b})`;
  }

  function sampleColours() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 70;
    canvas.height = 70;

    try {
      ctx.drawImage(img, 0, 0, 70, 70);

      const data = ctx.getImageData(0, 0, 70, 70).data;
      const colours = {};

      for (let i = 0; i < data.length; i += 12) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max - min;
        const brightness = max;

        // skip black/grey/brown/dead sludge
        if (brightness < 55) continue;
        if (saturation < 18) continue;
        if (r > g * 1.15 && g > b * 1.15 && brightness < 170) continue;

        const key = `${Math.round(r / 28) * 28},${Math.round(g / 28) * 28},${Math.round(b / 28) * 28}`;

        // weight vivid colours harder
        colours[key] = (colours[key] || 0) + 1 + saturation / 45 + brightness / 140;
      }

      const picked = Object.entries(colours)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([colour]) => {
          const [r, g, b] = colour.split(',').map(Number);
          return boostColour(r, g, b);
        });

      const fallback = [
        'rgb(255, 64, 190)',
        'rgb(70, 220, 255)',
        'rgb(255, 225, 70)',
        'rgb(90, 255, 160)',
        'rgb(255, 125, 60)'
      ];

      const c = [...picked, ...fallback].slice(0, 5);

      bgEl.style.setProperty('--squish1', c[0]);
      bgEl.style.setProperty('--squish2', c[1]);
      bgEl.style.setProperty('--squish3', c[2]);
      bgEl.style.setProperty('--squish4', c[3]);
      bgEl.style.setProperty('--squish5', c[4]);
    } catch (err) {
      bgEl.style.setProperty('--squish1', 'rgb(255, 64, 190)');
      bgEl.style.setProperty('--squish2', 'rgb(70, 220, 255)');
      bgEl.style.setProperty('--squish3', 'rgb(255, 225, 70)');
      bgEl.style.setProperty('--squish4', 'rgb(90, 255, 160)');
      bgEl.style.setProperty('--squish5', 'rgb(255, 125, 60)');
    }
  }

  if (img.complete) {
    sampleColours();
  } else {
    img.onload = sampleColours;
  }
}
