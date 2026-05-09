import { navigate } from '../router.js';
import { getAllProducts, deleteProduct } from '../db.js';

export function render(app) {
  app.innerHTML = `
    <div class="page active">
      <div class="page-header">
        <button class="btn-back" id="btn-back">←</button>
        <h1 class="page-title">我的商品</h1>
      </div>
      <div class="page-content">
        <input class="search-bar" id="search-input" type="text" placeholder="搜索商品名称..." autocomplete="off">
        <div class="product-list" id="product-list"></div>
        <div style="margin-top:16px;">
          <button class="btn-primary" id="btn-add">添加商品</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => navigate('#home'));
  document.getElementById('btn-add').addEventListener('click', () => navigate('#add-product'));
  document.getElementById('search-input').addEventListener('input', renderList);

  renderList();
}

async function renderList() {
  const listEl = document.getElementById('product-list');
  const searchText = document.getElementById('search-input')?.value?.trim().toLowerCase() || '';

  let products;
  try {
    products = await getAllProducts();
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">加载失败</div></div>`;
    return;
  }

  const filtered = searchText
    ? products.filter((p) => p.name.toLowerCase().includes(searchText))
    : products;

  // Sort by most recently updated
  filtered.sort((a, b) => b.updatedAt - a.updatedAt);

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">${searchText ? '没有匹配的商品' : '还没有商品，点击下方按钮添加'}</div>
      </div>`;
    return;
  }

  listEl.innerHTML = filtered
    .map(
      (p) => `
      <div class="product-item" data-id="${p.id}">
        <img class="thumb" src="${getThumb(p)}" alt="${p.name}">
        <div class="info">
          <div class="name">${p.name}</div>
          <div class="price">¥${Number(p.price).toFixed(2)}</div>
        </div>
        <button class="btn-delete-item" data-id="${p.id}" style="
          width:44px;height:44px;font-size:20px;background:none;border:none;cursor:pointer;
          color:var(--color-disabled);border-radius:50%;display:flex;align-items:center;justify-content:center;
          -webkit-tap-highlight-color:transparent;
        ">🗑</button>
      </div>`
    )
    .join('');

  // Click item → edit
  listEl.querySelectorAll('.product-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-item')) return;
      navigate(`#edit-product?id=${el.dataset.id}`);
    });
  });

  // Delete button
  listEl.querySelectorAll('.btn-delete-item').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const product = products.find((p) => p.id === id);
      if (!confirm(`确定删除「${product?.name || '此商品'}」吗？`)) return;
      try {
        await deleteProduct(id);
        renderList();
      } catch (err) {
        alert('删除失败：' + err.message);
      }
    });
  });
}

function getThumb(product) {
  const photos = product.referencePhotos || [];
  if (photos.length > 0 && photos[0].dataUrl) return photos[0].dataUrl;
  if (photos.length > 0 && photos[0].blob) {
    return URL.createObjectURL(photos[0].blob);
  }
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="#E0E0E0" width="64" height="64"/><text x="32" y="40" text-anchor="middle" font-size="32">📦</text></svg>'
  );
}
