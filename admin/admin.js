/**
 * ═══════════════════════════════════════════════════════════
 * ROTEX EMPORIUM — admin/admin.js
 * Admin Dashboard: Auth · Product CRUD · Order Management
 * Backend: Supabase
 * Requires: ../js/config.js loaded first
 * Flynn Technologies © 2025
 * ═══════════════════════════════════════════════════════════
 */
'use strict';

/* ── SUPABASE ────────────────────────────────────────────── */
const CFG = window.ROTEX_CONFIG;
const db  = window.supabase
  ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY)
  : null;

/* ── DOM HELPERS ─────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const kes = (n) => `KES ${Number(n).toLocaleString('en-KE')}`;
const escapeHTML = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[c]));
const safeURL = (u) => /^https?:\/\//i.test(String(u || '')) ? escapeHTML(u) : '';
const labelFor = (cat) => CFG.CATEGORIES[cat] || cat;

let _toastTimer;
const toast = (msg, type = '') => {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show${type ? ' toast--' + type : ''}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
};

/* Backend unavailable → tell the user and stop. Nothing below runs without `db`. */
if (!db) {
  const showErr = () => {
    const err = $('loginError');
    if (err) err.textContent = 'Could not reach the backend. Check your connection and refresh the page.';
    const btn = $('loginBtn');
    if (btn) btn.disabled = true;
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', showErr) : showErr();
} else {

/* ── AUTH ────────────────────────────────────────────────── */
let _appShown = false;   // prevents double-loading when signIn + onAuthStateChange both fire

const showApp = () => {
  $('loginScreen').style.display = 'none';
  $('adminApp').hidden = false;
  if (!_appShown) { _appShown = true; loadProducts(); }
};
const showLogin = () => {
  _appShown = false;
  $('loginScreen').style.display = 'flex';
  $('adminApp').hidden = true;
};

const checkSession = async () => {
  const { data: { session } } = await db.auth.getSession();
  session ? showApp() : showLogin();
};

$('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  const btn      = $('loginBtn');
  const errEl    = $('loginError');
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
  $('loginPassword').value = '';   // never leave the password sitting in the DOM
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
let _products = [];   // cache so Edit doesn't depend on a closure over `data`

const loadProducts = async () => {
  const tbody = $('productsTableBody');
  tbody.innerHTML = `<tr><td colspan="8" class="admin-table-empty">Loading products…</td></tr>`;

  const { data, error } = await db
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="admin-table-empty">Failed to load products. Make sure you're signed in, then refresh.</td></tr>`;
    console.error(error);
    return;
  }

  _products = data || [];

  if (!_products.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="admin-table-empty">No products yet. Click "Add Product" to create one.</td></tr>`;
    return;
  }

  tbody.innerHTML = _products.map(p => `
    <tr data-id="${escapeHTML(p.id)}">
      <td><img class="admin-table-img" src="${safeURL(p.image_url)}" alt="" loading="lazy" /></td>
      <td>${escapeHTML(p.name)}</td>
      <td>${escapeHTML(labelFor(p.category))}</td>
      <td>${kes(p.price)}</td>
      <td>${escapeHTML((p.sizes || []).join(', '))}</td>
      <td>${p.tag ? escapeHTML(p.tag) : '—'}</td>
      <td>
        <button class="active-toggle" data-action="toggle-active" data-id="${escapeHTML(p.id)}" data-active="${p.active}" aria-label="${p.active ? 'Hide from storefront' : 'Show on storefront'}">
          ${p.active
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#787878" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'}
        </button>
      </td>
      <td>
        <div class="admin-table-actions">
          <button class="admin-table-link" data-action="edit" data-id="${escapeHTML(p.id)}">Edit</button>
          <button class="admin-table-link admin-table-link--danger" data-action="delete" data-id="${escapeHTML(p.id)}">Delete</button>
        </div>
      </td>
    </tr>`).join('');
};

/* One delegated listener for the whole products table */
$('productsTableBody')?.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id } = el.dataset;
  if (action === 'edit')          openProductModal(_products.find(p => String(p.id) === id));
  else if (action === 'delete')   deleteProduct(id);
  else if (action === 'toggle-active') toggleActive(id, el.dataset.active === 'true');
});

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
  $('productId').value       = product?.id || '';
  $('productName').value     = product?.name || '';
  $('productCategory').value = product?.category || 'executive';
  $('productPrice').value    = product?.price ?? '';
  $('productSizes').value    = (product?.sizes || []).join(', ');
  $('productTag').value      = product?.tag || '';
  $('productImage').value    = product?.image_url || '';
  $('productActive').checked = product ? !!product.active : true;

  $('productModalOverlay').classList.add('active');
  $('productModalOverlay').setAttribute('aria-hidden', 'false');
  $('productName').focus();
};
const closeProductModal = () => {
  $('productModalOverlay').classList.remove('active');
  $('productModalOverlay').setAttribute('aria-hidden', 'true');
};
$('newProductBtn')?.addEventListener('click', () => openProductModal());
$('productModalCloseBtn')?.addEventListener('click', closeProductModal);
$('productModalOverlay')?.addEventListener('click', e => e.target === $('productModalOverlay') && closeProductModal());
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProductModal(); });

/* ── PRODUCT MODAL: SAVE (INSERT OR UPDATE) ──────────────── */
$('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('productFormError');
  errEl.textContent = '';

  const id        = $('productId').value || null;
  const name      = $('productName').value.trim();
  const category  = $('productCategory').value;
  const price     = Number($('productPrice').value);
  const sizes     = $('productSizes').value.split(',').map(s => s.trim()).filter(Boolean);
  const tag       = $('productTag').value || null;
  const image_url = $('productImage').value.trim();
  const active    = $('productActive').checked;

  if (!name || !sizes.length || !image_url || Number.isNaN(price) || price < 0) {
    errEl.textContent = 'Please fill in all required fields correctly.';
    return;
  }
  if (!/^https?:\/\//i.test(image_url)) {
    errEl.textContent = 'Image URL must start with http:// or https://';
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
    const tel = String(o.phone || '').replace(/[^\d+]/g, '');
    return `
    <tr data-id="${escapeHTML(o.id)}">
      <td>${escapeHTML(date)}</td>
      <td>${escapeHTML(o.customer_name)}</td>
      <td><a class="order-contact" href="tel:${escapeHTML(tel)}">${escapeHTML(o.phone)}</a></td>
      <td>${escapeHTML(o.location)}</td>
      <td class="order-items-cell">${escapeHTML(itemsSummary)}${o.notes ? `<span class="order-notes">Note: ${escapeHTML(o.notes)}</span>` : ''}</td>
      <td>${kes(o.total)}</td>
      <td>
        <select class="status-select" data-id="${escapeHTML(o.id)}" data-prev="${escapeHTML(o.status)}" aria-label="Order status">
          ${STATUS_OPTIONS.map(s => `<option value="${s}"${s === o.status ? ' selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
      </td>
    </tr>`;
  }).join('');
};

/* Delegated status-change handler */
$('ordersTableBody')?.addEventListener('change', (e) => {
  const sel = e.target.closest('.status-select');
  if (sel) updateOrderStatus(sel);
});

/* ── ORDERS: UPDATE STATUS (reverts the dropdown on failure) ─ */
const updateOrderStatus = async (sel) => {
  const { id } = sel.dataset;
  const status = sel.value;
  const { error } = await db.from('orders').update({ status }).eq('id', id);
  if (error) {
    toast('Failed to update order status.');
    console.error(error);
    sel.value = sel.dataset.prev;          // don't leave the UI showing a lie
    return;
  }
  sel.dataset.prev = status;
  toast('Order status updated.', 'success');
};

$('refreshOrdersBtn')?.addEventListener('click', loadOrders);

/* ── INIT ────────────────────────────────────────────────── */
checkSession();

// Keep session in sync if it changes in another tab or the token expires
db.auth.onAuthStateChange((_event, session) => {
  session ? showApp() : showLogin();
});

}  // end: if (db)
