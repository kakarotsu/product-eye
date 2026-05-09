const routes = {};
let currentPage = null;

export function register(hash, renderFn) {
  routes[hash] = renderFn;
}

export function navigate(hash) {
  location.hash = hash;
}

export function start() {
  window.addEventListener('hashchange', render);
  if (!location.hash) {
    location.hash = '#home';
  } else {
    render();
  }
}

function render() {
  const hash = location.hash.split('?')[0];
  const page = hash || '#home';
  const renderFn = routes[page];

  if (!renderFn) {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="page active"><div class="page-content"><div class="empty-state"><div class="empty-text">页面未找到</div></div></div></div>`;
    return;
  }

  if (currentPage === page) return;
  currentPage = page;

  const app = document.getElementById('app');
  app.innerHTML = '';
  renderFn(app);
}

export function getCurrentHash() {
  return location.hash.split('?')[0] || '#home';
}

export function getParams() {
  const hash = location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return {};
  const params = new URLSearchParams(hash.slice(qIndex));
  const obj = {};
  for (const [k, v] of params) obj[k] = v;
  return obj;
}
