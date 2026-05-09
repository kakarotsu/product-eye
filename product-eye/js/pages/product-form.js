import { navigate, getParams } from '../router.js';
import { addProduct, getProduct, updateProduct, deleteProduct } from '../db.js';
import { compressImage } from '../utils/image-utils.js';

let editingId = null;
let photos = [];

export function render(app) {
  const params = getParams();
  editingId = params.id || null;
  photos = [];

  const isEdit = !!editingId;
  const title = isEdit ? '编辑商品' : '添加商品';

  app.innerHTML = `
    <div class="page active">
      <div class="page-header">
        <button class="btn-back" id="btn-back">←</button>
        <h1 class="page-title">${title}</h1>
      </div>
      <div class="page-content">
        <div class="form-group">
          <label class="form-label">商品名称</label>
          <input class="form-input" id="input-name" type="text" placeholder="例如：蒙牛纯牛奶" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">价格（元）</label>
          <input class="form-input" id="input-price" type="number" placeholder="例如：3.50" step="0.01" inputmode="decimal">
        </div>
        <div class="form-group">
          <label class="form-label">条码（可选）</label>
          <input class="form-input" id="input-barcode" type="text" placeholder="扫描或手动输入" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">参考图片（最多5张）</label>
          <div class="photos-area" id="photos-area"></div>
          <input type="file" id="photo-input" accept="image/*" capture="environment" style="display:none">
        </div>
        <div style="margin-top:24px;">
          <button class="btn-primary" id="btn-save">保存</button>
        </div>
        ${isEdit ? '<div style="margin-top:12px;"><button class="btn-danger" id="btn-delete">删除此商品</button></div>' : ''}
      </div>
    </div>
  `;

  document.getElementById('btn-back').addEventListener('click', () => navigate('#products'));

  if (isEdit) {
    loadProduct(editingId);
    document.getElementById('btn-delete').addEventListener('click', onDelete);
  } else if (params.barcode) {
    document.getElementById('input-barcode').value = params.barcode;
  }

  document.getElementById('btn-save').addEventListener('click', onSave);

  const photoInput = document.getElementById('photo-input');
  document.getElementById('photos-area').addEventListener('click', (e) => {
    if (e.target.classList.contains('add-photo-btn')) {
      photoInput.click();
    }
    if (e.target.closest('.photo-thumb')) {
      const idx = Number(e.target.closest('.photo-thumb').dataset.index);
      photos.splice(idx, 1);
      renderPhotos();
    }
  });

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    photoInput.value = '';
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      photos.push({
        id: crypto.randomUUID(),
        blob: compressed.blob,
        dataUrl: compressed.dataUrl
      });
      renderPhotos();
    } catch (err) {
      alert('图片处理失败：' + err.message);
    }
  });

  renderPhotos();
}

function renderPhotos() {
  const area = document.getElementById('photos-area');
  if (!area) return;
  area.innerHTML = photos
    .map(
      (p, i) =>
        `<img class="photo-thumb" data-index="${i}" src="${p.dataUrl}" alt="参考图${i + 1}">`
    )
    .join('') +
    (photos.length < 5 ? '<button class="add-photo-btn">+</button>' : '');
}

async function loadProduct(id) {
  try {
    const product = await getProduct(id);
    if (!product) {
      alert('商品不存在');
      navigate('#products');
      return;
    }
    document.getElementById('input-name').value = product.name || '';
    document.getElementById('input-price').value = product.price ?? '';
    document.getElementById('input-barcode').value = product.barcode || '';
    photos = (product.referencePhotos || []).map((p) => ({
      id: p.id,
      blob: p.blob,
      dataUrl: p.dataUrl || (p.blob ? URL.createObjectURL(p.blob) : '')
    }));
    renderPhotos();
  } catch (err) {
    alert('加载商品失败：' + err.message);
    navigate('#products');
  }
}

async function onSave() {
  const name = document.getElementById('input-name').value.trim();
  const priceStr = document.getElementById('input-price').value.trim();
  const barcode = document.getElementById('input-barcode').value.trim();

  if (!name) { alert('请输入商品名称'); return; }
  if (!priceStr) { alert('请输入价格'); return; }

  const price = parseFloat(priceStr);
  if (isNaN(price) || price < 0) { alert('价格格式不正确'); return; }

  const product = {
    id: editingId || crypto.randomUUID(),
    name,
    price,
    barcode: barcode || null,
    referencePhotos: photos.map((p) => ({
      id: p.id,
      blob: p.blob,
      dataUrl: p.dataUrl
    }))
  };

  try {
    if (editingId) {
      await updateProduct(product);
    } else {
      await addProduct(product);
    }
    navigate('#products');
  } catch (err) {
    if (err.message && err.message.includes('barcode')) {
      alert('该条码已被其他商品使用');
    } else {
      alert('保存失败：' + err.message);
    }
  }
}

async function onDelete() {
  if (!confirm('确定要删除「' + document.getElementById('input-name').value + '」吗？此操作不可撤销。')) return;
  try {
    await deleteProduct(editingId);
    navigate('#products');
  } catch (err) {
    alert('删除失败：' + err.message);
  }
}
