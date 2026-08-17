/**
 * ═══════════════════════════════════════════════════════════
 * ROTEX EMPORIUM — admin.js
 * Admin Dashboard: Auth · Product CRUD · Order Management
 * Backend: Supabase
 * Flynn Technologies © 2025
 * ═══════════════════════════════════════════════════════════
 */
'use strict';

/* ── SUPABASE CONFIG ─────────────────────────────────────── */
const SUPABASE_URL      = 'https://ftrqsvdfjxhjkwzxuntg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BvwznwMV1Y68_ZAekTmdrQ_OIRKWM1n';
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
if (!db) {
  document.addEventListener('DOMContentLoaded', () => {
    const err = document.getElementById('loginError');
    if (err) err.textContent = 'Failed to load backend connection. Check your internet and refresh.';
  });
}

/* ── DOM HELPERS ─────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const kes = (n) => `KES ${Number(n).toLocaleString('en-KE')}`;
const escapeHTML = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[c]));

let _toastTimer;
const toast = (msg, type = '') => {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show${type ? ' toast--' + type : ''}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
};

/* ── AUTH ────────────────────────────────────────────────── */
const showApp = () => {
  $('loginScreen').style.display = 'none';
  $('adminApp').hidden = false;
  loadProducts();
};
const showLogin = () => {
  $('loginScreen').style.display = 'flex';
  $('adminApp').hidden = true;
};

const checkSession = async () => {
  const { data: { session } } = await db.auth.getSession();
  session ? showApp() : showLogin();
};

$('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  const btn = $('loginBtn');
  const errEl = $('loginError');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const { error } = await db.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = 'Sign In';

  if (error) {
    errEl.textContent = error.message || 'Sign in failed. Check your credentials.';
    return;
  }
  showApp();
});

$('logoutBtn')?.addEventListener('click', async () => {
  await db.auth.signOut();
  showLogin();
});

/* ── TABS ────────────────────────────────────────────────── */
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('admin-tab--active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('admin-panel--active'));
    tab.classList.add('admin-tab--active');
    $(`panel-${tab.dataset.tab}`)?.classList.add('admin-panel--active');
    if (tab.dataset.tab === 'orders') loadOrders();
  });
});

/* ── PRODUCTS: LOAD + RENDER ─────────────────────────────── */
const labelFor = (cat) => ({
  executive: 'Executive', statement: 'Statement', essentials: 'Essentials', finishing: 'Finishing',
}[cat] || cat);

const loadProducts = async () => {
  const tbody = $('productsTableBody');
  tbody.innerHTML = `<tr><td colspan="8" class="admin-table-empty">Loading products…</td></tr>`;

  const { data, error } = await db
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="admin-table-empty">Failed to load products.</td></tr>`;
    console.error(error);
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="admin-table-empty">No products yet. Click "Add Product" to create one.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(p => `
    <tr data-id="${p.id}">
      <td><img class="admin-table-img" src="${escapeHTML(p.image_url)}" alt="" loading="lazy" /></td>
      <td>${escapeHTML(p.name)}</td>
      <td>${labelFor(p.category)}</td>
      <td>${kes(p.price)}</td>
      <td>${(p.sizes || []).join(', ')}</td>
      <td>${p.tag ? escapeHTML(p.tag) : '—'}</td>
      <td>
        <button class="active-toggle" data-action="toggle-active" data-id="${p.id}" data-active="${p.active}" aria-label="Toggle active">
          ${p.active
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#787878" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'}
        </button>
      </td>
      <td>
        <div class="admin-table-actions">
          <span class="admin-table-link" data-action="edit" data-id="${p.id}">Edit</span>
          <span class="admin-table-link admin-table-link--danger" data-action="delete" data-id="${p.id}">Delete</span>
        </div>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach(el =>
    el.addEventListener('click', () => openProductModal(data.find(p => p.id === el.dataset.id)))
  );
  tbody.querySelectorAll('[data-action="delete"]').forEach(el =>
    el.addEventListener('click', () => deleteProduct(el.dataset.id))
  );
  tbody.querySelectorAll('[data-action="toggle-active"]').forEach(el =>
    el.addEventListener('click', () => toggleActive(el.dataset.id, el.dataset.active === 'true'))
  );
};

/* ── PRODUCTS: TOGGLE ACTIVE ─────────────────────────────── */
const toggleActive = async (id, currentActive) => {
  const { error } = await db.from('products').update({ active: !currentActive }).eq('id', id);
  if (error) { toast('Failed to update product.'); console.error(error); return; }
  toast(currentActive ? 'Product hidden from storefront.' : 'Product is now live.', 'success');
  loadProducts();
};

/* ── PRODUCTS: DELETE ─────────────────────────────────────── */
const deleteProduct = async (id) => {
  if (!confirm('Delete this product permanently? This cannot be undone.')) return;
  const { error } = await db.from('products').delete().eq('id', id);
  if (error) { toast('Failed to delete product.'); console.error(error); return; }
  toast('Product deleted.', 'success');
  loadProducts();
};

/* ── PRODUCT MODAL: OPEN / CLOSE ─────────────────────────── */
const openProductModal = (product = null) => {
  $('productFormError').textContent = '';
  $('productModalTitle').textContent = product ? 'Edit Product' : 'Add Product';
  $('productId').value = product?.id || '';
  $('productName').value = product?.name || '';
  $('productCategory').value = product?.category || 'executive';
  $('productPrice').value = product?.price ?? '';
  $('productSizes').value = (product?.sizes || []).join(', ');
  $('productTag').value = product?.tag || '';
  $('productImage').value = product?.image_url || '';
  $('productActive').checked = product ? !!product.active : true;

  $('productModalOverlay').classList.add('active');
  $('productModalOverlay').setAttribute('aria-hidden', 'false');
};
const closeProductModal = () => {
  $('productModalOverlay').classList.remove('active');
  $('productModalOverlay').setAttribute('aria-hidden', 'true');
};
$('newProductBtn')?.addEventListener('click', () => openProductModal());
$('productModalCloseBtn')?.addEventListener('click', closeProductModal);
$('productModalOverlay')?.addEventListener('click', e => e.target === $('productModalOverlay') && closeProductModal());

/* ── PRODUCT MODAL: SAVE (INSERT OR UPDATE) ──────────────── */
$('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('productFormError');
  errEl.textContent = '';

  const id       = $('productId').value || null;
  const name     = $('productName').value.trim();
  const category = $('productCategory').value;
  const price    = Number($('productPrice').value);
  const sizes    = $('productSizes').value.split(',').map(s => s.trim()).filter(Boolean);
  const tag      = $('productTag').value || null;
  const image_url = $('productImage').value.trim();
  const active   = $('productActive').checked;

  if (!name || !sizes.length || !image_url || Number.isNaN(price) || price < 0) {
    errEl.textContent = 'Please fill in all required fields correctly.';
    return;
  }

  const btn = $('productSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const payload = { name, category, price, sizes, tag, image_url, active };
  const { error } = id
    ? await db.from('products').update(payload).eq('id', id)
    : await db.from('products').insert(payload);

  btn.disabled = false;
  btn.textContent = 'Save Product';

  if (error) {
    errEl.textContent = error.message || 'Failed to save product.';
    console.error(error);
    return;
  }

  toast(id ? 'Product updated.' : 'Product added.', 'success');
  closeProductModal();
  loadProducts();
});

/* ── ORDERS: LOAD + RENDER ───────────────────────────────── */
const STATUS_OPTIONS = ['new', 'confirmed', 'delivered'];

const loadOrders = async () => {
  const tbody = $('ordersTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="admin-table-empty">Loading orders…</td></tr>`;

  const { data, error } = await db
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="admin-table-empty">Failed to load orders. Make sure you're signed in.</td></tr>`;
    console.error(error);
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="admin-table-empty">No orders yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(o => {
    const date = new Date(o.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
    const itemsSummary = (o.items || []).map(i => `${i.name} (${i.size}) × ${i.qty}`).join(', ');
    return `
    <tr data-id="${o.id}">
      <td>${date}</td>
      <td>${escapeHTML(o.customer_name)}</td>
      <td>${escapeHTML(o.phone)}</td>
      <td>${escapeHTML(o.location)}</td>
      <td class="order-items-cell">${escapeHTML(itemsSummary)}</td>
      <td>${kes(o.total)}</td>
      <td>
        <select class="status-select" data-id="${o.id}">
          ${STATUS_OPTIONS.map(s => `<option value="${s}"${s === o.status ? ' selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.status-select').forEach(sel =>
    sel.addEventListener('change', () => updateOrderStatus(sel.dataset.id, sel.value))
  );
};

/* ── ORDERS: UPDATE STATUS ───────────────────────────────── */
const updateOrderStatus = async (id, status) => {
  const { error } = await db.from('orders').update({ status }).eq('id', id);
  if (error) { toast('Failed to update order status.'); console.error(error); return; }
  toast('Order status updated.', 'success');
};

$('refreshOrdersBtn')?.addEventListener('click', loadOrders);

/* ── INIT ────────────────────────────────────────────────── */
checkSession();

// Keep session in sync if it changes in another tab
db.auth.onAuthStateChange((_event, session) => {
  session ? showApp() : showLogin();
});
