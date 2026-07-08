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
zoomBg.className = 'mural-zigzag-bg';

overlay.appendChild(zoomBg);
overlay.appendChild(zoomImg);

setMuralZoomColours(zoomImg, zoomBg);

      
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

// ---------------- MURAL ZIGZAG COLOUR BACKGROUND ----------------
function setMuralZoomColours(img, bgEl) {
  function sampleColours() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 40;
    canvas.height = 40;

    try {
      ctx.drawImage(img, 0, 0, 40, 40);

      const data = ctx.getImageData(0, 0, 40, 40).data;
      const colours = {};

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r + g + b > 720 || r + g + b < 80) continue;

        const key = `${Math.round(r / 40) * 40},${Math.round(g / 40) * 40},${Math.round(b / 40) * 40}`;
        colours[key] = (colours[key] || 0) + 1;
      }

      const topColours = Object.entries(colours)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([colour]) => `rgb(${colour})`);

      const c1 = topColours[0] || '#ff4dd2';
      const c2 = topColours[1] || '#4de2ff';
      const c3 = topColours[2] || '#ffdd55';

      bgEl.style.setProperty('--mural-c1', c1);
      bgEl.style.setProperty('--mural-c2', c2);
      bgEl.style.setProperty('--mural-c3', c3);
    } catch (err) {
      bgEl.style.setProperty('--mural-c1', '#ff4dd2');
      bgEl.style.setProperty('--mural-c2', '#4de2ff');
      bgEl.style.setProperty('--mural-c3', '#ffdd55');
    }
  }

  if (img.complete) {
    sampleColours();
  } else {
    img.onload = sampleColours;
  }
}
