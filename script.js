const csvFile = 'art.csv';
let artData = [];
let currentCategory = 'All';

// Fullscreen overlay
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

window.addEventListener('DOMContentLoaded', init);

function init() {
  fetch(csvFile)
    .then(response => response.text())
    .then(text => {
      artData = csvToArray(text);

      console.log("PARSED DATA:", artData);

      renderCategories();
      renderGallery('All');
    })
    .catch(err => console.error('Error loading CSV:', err));

  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    renderGallery('All', query);
  });
}

function csvToArray(str) {
  const lines = str.trim().split('\n');

  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const cleanLine = line.replace('\r', '');
    const values = cleanLine.split(',').map(v => v.trim());

    return {
      FileName: values[0],
      Category: values[1],
      Title: values[2]
    };
  });
}

// Render categories
function renderCategories() {
  const categories = ['All', ...new Set(artData.map(a => a.Category))];

  const catContainer = document.getElementById('categories');
  catContainer.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;

    if (cat === currentCategory) btn.classList.add('active');

    btn.addEventListener('click', () => {
      currentCategory = cat;
      renderCategories();
      renderGallery(cat);
    });

    catContainer.appendChild(btn);
  });
}

// Render gallery
function renderGallery(filter, searchQuery = '') {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  artData
    .filter(a => filter === 'All' || a.Category === filter)
    .filter(a => (a.Title || '').toLowerCase().includes(searchQuery))
    .forEach(a => {

      const img = document.createElement('img');

      const src = `images/${a.FileName}`;

      img.src = src;
      img.dataset.full = src;
      img.alt = a.Title;
      img.loading = "lazy";

      img.style.height = '450px';
      img.style.width = 'auto';
      img.style.cursor = 'pointer';
      img.style.transition = 'transform 0.25s ease';

      img.addEventListener('click', () => {
        currentCategory = a.Category;
        renderCategories();

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

        overlay.innerHTML = '';
        overlay.appendChild(zoomImg);
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
