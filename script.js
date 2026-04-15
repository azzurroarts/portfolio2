let observer; 
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
    img.style.transform = `translate(${rect.left}px, ${rect.top}px) scale(${rect.width / img.naturalWidth}, ${rect.height / img.naturalHeight})`;
  }
  setTimeout(() => overlay.innerHTML = '', 350);
});

window.addEventListener('DOMContentLoaded', init);

function init() {
  zoomImg.src = img.dataset.full;
  observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;

      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }

      observer.unobserve(img);
    }
  });
});
  
  fetch(csvFile)
    .then(response => response.text())
    .then(text => {
  console.log("RAW CSV TEXT:", text);

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

function csvToArray(str, delimiter = ',') {
  const lines = str.trim().split('\n');
  const headers = lines[0].split(delimiter).map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim());
    let obj = {};
    headers.forEach((header, i) => obj[header] = values[i]);
    return obj;
  });
}

// Render categories & active highlight
function renderCategories() {
  const categories = ['All', ...new Set(artData.map(a => a.Category))];
  const catContainer = document.getElementById('categories');
  catContainer.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;

    // highlight active category
    if (cat === currentCategory) btn.classList.add('active');

    btn.addEventListener('click', () => {
      currentCategory = cat;
      renderCategories(); // update highlight
      
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
    .filter(a => a.Title.toLowerCase().includes(searchQuery))
    .forEach(a => {
      const img = document.createElement('img');
    img.src = `images/${a.FileName}`;
img.dataset.full = `images/${a.FileName}`;
img.loading = "lazy";
      img.alt = a.Title;
      img.style.height = '450px';
      img.style.width = 'auto';
      img.style.cursor = 'pointer';
      img.style.transition = 'transform 0.25s ease';

      img.addEventListener('click', () => {
        currentCategory = a.Category;
        renderCategories(); // highlight category

        // Show floating category label
        floatingCategory.textContent = a.Category;
        floatingCategory.style.opacity = 1;

        const zoomImg = document.createElement('img');
        zoomImg.src = img.src;

        const rect = img.getBoundingClientRect();
        zoomImg.dataset.originalRect = JSON.stringify(rect);

        zoomImg.style.position = 'fixed';
        zoomImg.style.left = rect.left + 'px';
        zoomImg.style.top = rect.top + 'px';
        zoomImg.style.width = rect.width + 'px';
        zoomImg.style.height = rect.height + 'px';
        zoomImg.style.transform = 'none';
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
