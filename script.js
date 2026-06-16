/* =============================================
   SHOKU — Cart, Menu & Account JavaScript
   ============================================= */

(function () {
  'use strict';

  // ── Item catalogue ─────────────────────────────────
  const PRICES = {
    'Onigiri': 4.99, 'Ramen': 12.99, 'Salmon Nigiri': 9.99,
    'Tekka Maki': 8.49, 'Temaki': 7.99, 'Tempura': 10.99,
    'Brownie': 3.99, 'Hanami Dango': 4.49, 'Strawberry Shortcake': 5.99,
    'Bottled Water': 1.49, 'Coffee': 3.49, 'Pepsi': 2.49, 'Ramune Soda': 2.99,
  };

  // ── App State ──────────────────────────────────────
  let cart = {};

  // Persistent account state via localStorage
  let account = loadAccount();

  function loadAccount() {
    try {
      return JSON.parse(localStorage.getItem('shoku_account')) || {
        loggedIn: false,
        name: '',
        email: '',
        password: '',
        avatar: '',          // base64 or ''
        addresses: [],       // [{ id, label, text, isDefault }]
        orders: [],          // [{ id, date, items, total, status }]
        activeAuthTab: 'login',
      };
    } catch { return { loggedIn: false, name: '', email: '', password: '', avatar: '', addresses: [], orders: [], activeAuthTab: 'login' }; }
  }

  function saveAccount() {
    localStorage.setItem('shoku_account', JSON.stringify(account));
  }

  // ── Seed demo data for new accounts ───────────────
  function seedDemoData() {
    if (account.orders.length === 0) {
      account.orders = [
        {
          id: '#SHK-0021',
          date: 'Jun 10, 2025',
          items: [{ name: 'Ramen', qty: 1, price: 12.99 }, { name: 'Ramune Soda', qty: 2, price: 2.99 }],
          total: 18.97,
          status: 'DELIVERED',
        },
        {
          id: '#SHK-0014',
          date: 'May 28, 2025',
          items: [{ name: 'Temaki', qty: 2, price: 7.99 }, { name: 'Coffee', qty: 1, price: 3.49 }],
          total: 19.47,
          status: 'DELIVERED',
        },
      ];
    }
    if (account.addresses.length === 0) {
      account.addresses = [
        { id: 'addr-1', label: 'HOME', text: '123 Sakura St, Makati City, 1200', isDefault: true },
        { id: 'addr-2', label: 'WORK', text: '88 Noodle Ave, BGC, 1634', isDefault: false },
      ];
    }
    saveAccount();
  }

  // ════════════════════════════════════════════════════
  //  MENU CARDS
  // ════════════════════════════════════════════════════
  function buildMenuCards() {
    const sections = document.querySelectorAll('.savory-dishes, .sweet-desserts, .beverages');
    sections.forEach(section => {
      const h3 = section.querySelector('h3');
      const paragraphs = [...section.querySelectorAll('p')];
      const grid = document.createElement('div');
      grid.className = 'section-grid';

      paragraphs.forEach(p => {
        const img = p.querySelector('img');
        const name = p.childNodes[0]?.textContent?.trim() || '';
        const price = PRICES[name] ?? 0;

        const card = document.createElement('div');
        card.className = 'menu-item';
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', name);

        const imgEl = img ? img.cloneNode() : document.createElement('span');
        imgEl.setAttribute('aria-hidden', 'true');
        card.appendChild(imgEl);

        const nameEl = document.createElement('span');
        nameEl.className = 'item-name';
        nameEl.textContent = name;
        card.appendChild(nameEl);

        const priceEl = document.createElement('span');
        priceEl.className = 'item-price';
        priceEl.textContent = `$${price.toFixed(2)}`;
        card.appendChild(priceEl);

        const btn = document.createElement('button');
        btn.className = 'add-btn';
        btn.textContent = '+ ADD TO CART';
        btn.setAttribute('aria-label', `Add ${name} to cart`);
        btn.addEventListener('click', () => addToCart(name, price, img?.src || ''));
        card.appendChild(btn);

        grid.appendChild(card);
        p.remove();
      });

      if (h3) h3.insertAdjacentElement('afterend', grid);
      else section.appendChild(grid);
    });
  }

  // ════════════════════════════════════════════════════
  //  CART
  // ════════════════════════════════════════════════════
  function addToCart(name, price, imgSrc) {
    if (cart[name]) cart[name].qty++;
    else cart[name] = { qty: 1, price, img: imgSrc };
    updateCartUI();
    showToast(`${name} added!`);
  }

  function removeFromCart(name) { delete cart[name]; updateCartUI(); }

  function changeQty(name, delta) {
    if (!cart[name]) return;
    cart[name].qty += delta;
    if (cart[name].qty <= 0) { removeFromCart(name); return; }
    updateCartUI();
  }

  function totalItems() { return Object.values(cart).reduce((s, i) => s + i.qty, 0); }
  function totalPrice() { return Object.values(cart).reduce((s, i) => s + i.qty * i.price, 0); }

  function updateCartUI() {
    const count = totalItems();
    const badge = document.querySelector('.cart-count');
    if (badge) { badge.textContent = count; badge.classList.toggle('visible', count > 0); }

    const list = document.querySelector('.cart-items');
    const empty = document.querySelector('.cart-empty');
    if (!list) return;
    list.innerHTML = '';

    const names = Object.keys(cart);
    if (names.length === 0) {
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      names.forEach(name => {
        const { qty, price, img } = cart[name];
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <img src="${img}" alt="${name}" width="48" height="48">
          <div class="cart-item-info">
            <div class="cart-item-name">${name}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" data-name="${name}" data-delta="-1" aria-label="Decrease">−</button>
              <span class="qty-display">${qty}</span>
              <button class="qty-btn" data-name="${name}" data-delta="1" aria-label="Increase">+</button>
            </div>
          </div>
          <span class="cart-item-price">$${(qty * price).toFixed(2)}</span>
          <button class="remove-btn" data-name="${name}" aria-label="Remove ${name}">✕</button>
        `;
        list.appendChild(row);
      });
    }
    document.querySelector('.cart-total span:last-child').textContent = `$${totalPrice().toFixed(2)}`;
  }

  function buildCartDrawer() {
    const overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.addEventListener('click', closeCart);

    const drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Shopping Cart');
    drawer.innerHTML = `
      <div class="cart-header">
        <h2>CART</h2>
        <button class="close-btn" id="closeCartBtn">✕ CLOSE</button>
      </div>
      <div class="cart-items"></div>
      <p class="cart-empty">YOUR CART IS EMPTY.<br>ADD SOMETHING DELICIOUS!</p>
      <div class="cart-footer">
        <div class="cart-total"><span>TOTAL</span><span>$0.00</span></div>
        <button class="checkout-btn" id="checkoutBtn">CHECKOUT →</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    document.getElementById('closeCartBtn').addEventListener('click', closeCart);
    document.getElementById('checkoutBtn').addEventListener('click', () => {
      if (totalItems() === 0) { showToast('Cart is empty!'); return; }
      // Save order to account history
      if (account.loggedIn) {
        const orderItems = Object.entries(cart).map(([name, { qty, price }]) => ({ name, qty, price }));
        const order = {
          id: `#SHK-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          items: orderItems,
          total: totalPrice(),
          status: 'PREPARING',
        };
        account.orders.unshift(order);
        saveAccount();
      }
      showToast('Order placed! Arigatou!');
      cart = {};
      updateCartUI();
      closeCart();
    });

    drawer.querySelector('.cart-items').addEventListener('click', e => {
      const qtyBtn = e.target.closest('.qty-btn');
      const removeBtn = e.target.closest('.remove-btn');
      if (qtyBtn) changeQty(qtyBtn.dataset.name, Number(qtyBtn.dataset.delta));
      if (removeBtn) removeFromCart(removeBtn.dataset.name);
    });
  }

  function openCart() {
    document.querySelector('.cart-drawer').classList.add('open');
    document.querySelector('.cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    document.querySelector('.cart-drawer').classList.remove('open');
    document.querySelector('.cart-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function wireNavCart() {
    const cartLink = [...document.querySelectorAll('.nav-links a')]
      .find(a => a.textContent.trim() === 'CART');
    if (!cartLink) return;
    const btn = document.createElement('button');
    btn.className = 'cart-btn';
    btn.setAttribute('aria-label', 'Open cart');
    btn.innerHTML = `CART <span class="cart-count" aria-live="polite"></span>`;
    btn.addEventListener('click', openCart);
    cartLink.parentElement.replaceChild(btn, cartLink);
  }

  // ════════════════════════════════════════════════════
  //  ACCOUNT DRAWER
  // ════════════════════════════════════════════════════

  let currentAccTab = 'auth'; // 'auth' | 'orders' | 'addresses' | 'settings'

  function buildAccountDrawer() {
    const overlay = document.createElement('div');
    overlay.className = 'account-overlay';
    overlay.addEventListener('click', closeAccount);

    const drawer = document.createElement('div');
    drawer.className = 'account-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Account');
    drawer.innerHTML = `
      <div class="account-drawer-header">
        <h2 id="accDrawerTitle">ACCOUNT</h2>
        <button class="close-btn" id="closeAccBtn">✕ CLOSE</button>
      </div>
      <div class="account-tabs" id="accTabs" style="display:none">
        <button class="acc-tab active" data-tab="auth">PROFILE</button>
        <button class="acc-tab" data-tab="orders">ORDERS</button>
        <button class="acc-tab" data-tab="addresses">ADDRESS</button>
        <button class="acc-tab" data-tab="settings">SETTINGS</button>
      </div>
      <div id="accPanelAuth" class="account-panel active"></div>
      <div id="accPanelOrders" class="account-panel"></div>
      <div id="accPanelAddresses" class="account-panel"></div>
      <div id="accPanelSettings" class="account-panel"></div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    document.getElementById('closeAccBtn').addEventListener('click', closeAccount);

    // Tab switching
    document.getElementById('accTabs').addEventListener('click', e => {
      const tab = e.target.closest('.acc-tab');
      if (!tab) return;
      currentAccTab = tab.dataset.tab;
      document.querySelectorAll('.acc-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.account-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`accPanel${capitalize(currentAccTab)}`).classList.add('active');
      renderCurrentPanel();
    });

    renderAccountDrawer();
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderAccountDrawer() {
    if (account.loggedIn) {
      document.getElementById('accTabs').style.display = 'flex';
      document.getElementById('accDrawerTitle').textContent = `HI, ${account.name.split(' ')[0].toUpperCase()}!`;
    } else {
      document.getElementById('accTabs').style.display = 'none';
      document.getElementById('accDrawerTitle').textContent = 'ACCOUNT';
      currentAccTab = 'auth';
      document.querySelectorAll('.account-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('accPanelAuth').classList.add('active');
    }
    renderCurrentPanel();
  }

  function renderCurrentPanel() {
    if (!account.loggedIn) { renderAuthPanel(); return; }
    switch (currentAccTab) {
      case 'auth':      renderProfileHero(); break;
      case 'orders':    renderOrdersPanel(); break;
      case 'addresses': renderAddressesPanel(); break;
      case 'settings':  renderSettingsPanel(); break;
    }
  }

  // ── Auth Panel (Login / Sign Up) ───────────────────
  function renderAuthPanel() {
    const panel = document.getElementById('accPanelAuth');
    const mode = account.activeAuthTab || 'login';
    panel.innerHTML = `
      <div class="auth-toggle">
        <button class="auth-toggle-btn ${mode === 'login' ? 'active' : ''}" id="authTabLogin">LOGIN</button>
        <button class="auth-toggle-btn ${mode === 'signup' ? 'active' : ''}" id="authTabSignup">SIGN UP</button>
      </div>
      ${mode === 'login' ? renderLoginForm() : renderSignupForm()}
    `;

    panel.querySelector('#authTabLogin').addEventListener('click', () => {
      account.activeAuthTab = 'login'; renderAuthPanel();
    });
    panel.querySelector('#authTabSignup').addEventListener('click', () => {
      account.activeAuthTab = 'signup'; renderAuthPanel();
    });

    if (mode === 'login') {
      panel.querySelector('#loginSubmit').addEventListener('click', () => {
        const email = panel.querySelector('#loginEmail').value.trim();
        const pass  = panel.querySelector('#loginPass').value;
        if (!email || !pass) { showToast('Fill in all fields!'); return; }
        if (account.email && account.email !== email) { showToast('Email not found!'); return; }
        if (account.password && account.password !== pass) { showToast('Wrong password!'); return; }
        // If no stored account yet, auto-create on first login attempt
        if (!account.email) { showToast('No account found. Sign up first!'); return; }
        account.loggedIn = true;
        saveAccount();
        showToast(`Welcome back, ${account.name}!`);
        renderAccountDrawer();
        updateAccountNavBtn();
      });
    } else {
      panel.querySelector('#signupSubmit').addEventListener('click', () => {
        const name  = panel.querySelector('#signupName').value.trim();
        const email = panel.querySelector('#signupEmail').value.trim();
        const pass  = panel.querySelector('#signupPass').value;
        const pass2 = panel.querySelector('#signupPass2').value;
        if (!name || !email || !pass || !pass2) { showToast('Fill in all fields!'); return; }
        if (pass !== pass2) { showToast('Passwords do not match!'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Invalid email!'); return; }
        account.name = name;
        account.email = email;
        account.password = pass;
        account.loggedIn = true;
        account.activeAuthTab = 'login';
        seedDemoData();
        saveAccount();
        showToast(`Welcome, ${name}!`);
        renderAccountDrawer();
        updateAccountNavBtn();
      });
    }
  }

  function renderLoginForm() {
    return `
      <form class="acc-form" onsubmit="return false">
        <label>EMAIL
          <input type="email" id="loginEmail" placeholder="you@email.com" autocomplete="email">
        </label>
        <label>PASSWORD
          <input type="password" id="loginPass" placeholder="••••••••" autocomplete="current-password">
        </label>
        <button class="acc-submit-btn" id="loginSubmit">LOGIN →</button>
      </form>
    `;
  }

  function renderSignupForm() {
    return `
      <form class="acc-form" onsubmit="return false">
        <label>FULL NAME
          <input type="text" id="signupName" placeholder="Sakura Tanaka" autocomplete="name">
        </label>
        <label>EMAIL
          <input type="email" id="signupEmail" placeholder="you@email.com" autocomplete="email">
        </label>
        <label>PASSWORD
          <input type="password" id="signupPass" placeholder="••••••••" autocomplete="new-password">
        </label>
        <label>CONFIRM PASSWORD
          <input type="password" id="signupPass2" placeholder="••••••••" autocomplete="new-password">
        </label>
        <button class="acc-submit-btn" id="signupSubmit">CREATE ACCOUNT →</button>
      </form>
    `;
  }

  // ── Profile Hero (logged-in overview) ─────────────
  function renderProfileHero() {
    const panel = document.getElementById('accPanelAuth');
    const avatarSrc = account.avatar || generatePixelAvatar(account.name);
    panel.innerHTML = `
      <div class="profile-hero">
        <div class="avatar-wrap">
          <img id="avatarPreview" src="${avatarSrc}" alt="avatar">
          <button class="avatar-edit-btn" id="avatarEditBtn" title="Change avatar">✎</button>
          <input type="file" id="avatarFileInput" accept="image/*">
        </div>
        <div class="profile-hero-info">
          <div class="profile-hero-name">${account.name}</div>
          <div class="profile-hero-email">${account.email}</div>
        </div>
      </div>
      <p style="font-family:var(--pixel);font-size:0.42rem;color:var(--muted);line-height:2.2;text-align:center;padding:16px 0">
        USE THE TABS ABOVE<br>TO MANAGE YOUR ACCOUNT
      </p>
    `;

    panel.querySelector('#avatarEditBtn').addEventListener('click', () => {
      panel.querySelector('#avatarFileInput').click();
    });
    panel.querySelector('#avatarFileInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        account.avatar = ev.target.result;
        saveAccount();
        panel.querySelector('#avatarPreview').src = ev.target.result;
        showToast('Avatar updated!');
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Orders Panel ───────────────────────────────────
  function renderOrdersPanel() {
    const panel = document.getElementById('accPanelOrders');
    if (account.orders.length === 0) {
      panel.innerHTML = `<p class="no-orders">NO ORDERS YET.<br>TIME TO EAT!</p>`;
      return;
    }
    panel.innerHTML = account.orders.map(order => `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-id">${order.id}</span>
          <span class="order-date">${order.date}</span>
        </div>
        <div class="order-items-list">
          ${order.items.map(i => `
            <div class="order-line">
              <span>${i.name} × ${i.qty}</span>
              <span>$${(i.qty * i.price).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-total-line">
          <span>TOTAL</span>
          <span>$${order.total.toFixed(2)}</span>
        </div>
        <span class="order-status">◆ ${order.status}</span>
      </div>
    `).join('');
  }

  // ── Addresses Panel ────────────────────────────────
  function renderAddressesPanel() {
    const panel = document.getElementById('accPanelAddresses');
    panel.innerHTML = `
      ${account.addresses.map(addr => `
        <div class="address-card ${addr.isDefault ? 'default-addr' : ''}">
          <div>
            <div class="address-label">${addr.label}${addr.isDefault ? ' ★ DEFAULT' : ''}</div>
            <div class="address-text">${addr.text}</div>
          </div>
          <div class="address-actions">
            ${!addr.isDefault ? `<button class="addr-btn" data-action="default" data-id="${addr.id}">SET DEFAULT</button>` : ''}
            <button class="addr-btn danger" data-action="delete" data-id="${addr.id}">DELETE</button>
          </div>
        </div>
      `).join('')}
      <button class="add-addr-toggle" id="toggleAddAddr">+ ADD ADDRESS</button>
      <div class="add-address-form" id="addAddrForm">
        <form class="acc-form" onsubmit="return false">
          <label>LABEL (e.g. HOME, WORK)
            <input type="text" id="addrLabel" placeholder="HOME" maxlength="20">
          </label>
          <label>FULL ADDRESS
            <input type="text" id="addrText" placeholder="123 Sakura St, City">
          </label>
          <button class="acc-submit-btn" id="saveAddrBtn">SAVE ADDRESS</button>
        </form>
      </div>
    `;

    panel.querySelector('#toggleAddAddr').addEventListener('click', () => {
      panel.querySelector('#addAddrForm').classList.toggle('visible');
    });

    panel.querySelector('#saveAddrBtn').addEventListener('click', () => {
      const label = panel.querySelector('#addrLabel').value.trim().toUpperCase();
      const text  = panel.querySelector('#addrText').value.trim();
      if (!label || !text) { showToast('Fill in all fields!'); return; }
      account.addresses.push({
        id: `addr-${Date.now()}`,
        label, text,
        isDefault: account.addresses.length === 0,
      });
      saveAccount();
      showToast('Address saved!');
      renderAddressesPanel();
    });

    panel.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'delete') {
        account.addresses = account.addresses.filter(a => a.id !== id);
        // If deleted was default, make first one default
        if (account.addresses.length > 0 && !account.addresses.some(a => a.isDefault)) {
          account.addresses[0].isDefault = true;
        }
        saveAccount();
        showToast('Address removed!');
        renderAddressesPanel();
      } else if (action === 'default') {
        account.addresses.forEach(a => a.isDefault = a.id === id);
        saveAccount();
        renderAddressesPanel();
      }
    });
  }

  // ── Settings Panel ─────────────────────────────────
  function renderSettingsPanel() {
    const panel = document.getElementById('accPanelSettings');
    panel.innerHTML = `
      <div class="settings-section-title">EDIT PROFILE</div>
      <form class="acc-form" onsubmit="return false">
        <label>FULL NAME
          <input type="text" id="settingName" value="${account.name}">
        </label>
        <label>EMAIL
          <input type="email" id="settingEmail" value="${account.email}">
        </label>
        <button class="acc-submit-btn" id="saveProfileBtn">SAVE CHANGES</button>
      </form>
      <div class="settings-section-title" style="margin-top:8px">CHANGE PASSWORD</div>
      <form class="acc-form" onsubmit="return false">
        <label>CURRENT PASSWORD
          <input type="password" id="settingOldPass" placeholder="••••••••">
        </label>
        <label>NEW PASSWORD
          <input type="password" id="settingNewPass" placeholder="••••••••">
        </label>
        <button class="acc-submit-btn" id="savePassBtn">UPDATE PASSWORD</button>
      </form>
      <button class="logout-btn" id="logoutBtn">⏻ LOGOUT</button>
    `;

    panel.querySelector('#saveProfileBtn').addEventListener('click', () => {
      const name  = panel.querySelector('#settingName').value.trim();
      const email = panel.querySelector('#settingEmail').value.trim();
      if (!name || !email) { showToast('Fields cannot be empty!'); return; }
      account.name = name;
      account.email = email;
      saveAccount();
      showToast('Profile updated!');
      document.getElementById('accDrawerTitle').textContent = `HI, ${name.split(' ')[0].toUpperCase()}!`;
      updateAccountNavBtn();
    });

    panel.querySelector('#savePassBtn').addEventListener('click', () => {
      const old  = panel.querySelector('#settingOldPass').value;
      const next = panel.querySelector('#settingNewPass').value;
      if (!old || !next) { showToast('Fill in both fields!'); return; }
      if (old !== account.password) { showToast('Wrong current password!'); return; }
      if (next.length < 6) { showToast('Password too short!'); return; }
      account.password = next;
      saveAccount();
      showToast('Password updated!');
      panel.querySelector('#settingOldPass').value = '';
      panel.querySelector('#settingNewPass').value = '';
    });

    panel.querySelector('#logoutBtn').addEventListener('click', () => {
      account.loggedIn = false;
      saveAccount();
      currentAccTab = 'auth';
      document.querySelectorAll('.acc-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
      document.querySelectorAll('.account-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('accPanelAuth').classList.add('active');
      showToast('Logged out. See you soon!');
      renderAccountDrawer();
      updateAccountNavBtn();
    });
  }

  // ── Pixel avatar fallback (canvas-generated) ───────
  function generatePixelAvatar(name) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    // Simple deterministic color from name
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    ctx.fillStyle = `hsl(${hue},60%,25%)`;
    ctx.fillRect(0, 0, 64, 64);
    // Draw initials in pixel font (fallback to regular)
    ctx.fillStyle = `hsl(${hue},80%,75%)`;
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    ctx.fillText(initials, 32, 34);
    return canvas.toDataURL();
  }

  // ── Open / Close Account ───────────────────────────
  function openAccount() {
    renderAccountDrawer();
    document.querySelector('.account-drawer').classList.add('open');
    document.querySelector('.account-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeAccount() {
    document.querySelector('.account-drawer').classList.remove('open');
    document.querySelector('.account-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Wire ACCOUNT nav link ──────────────────────────
  function wireNavAccount() {
    const accLink = [...document.querySelectorAll('.nav-links a')]
      .find(a => a.textContent.trim() === 'ACCOUNT');
    if (!accLink) return;
    const btn = document.createElement('button');
    btn.className = `account-btn${account.loggedIn ? ' logged-in' : ''}`;
    btn.id = 'accountNavBtn';
    btn.setAttribute('aria-label', 'Open account');
    btn.textContent = account.loggedIn ? `▲ ${account.name.split(' ')[0].toUpperCase()}` : 'ACCOUNT';
    btn.addEventListener('click', openAccount);
    accLink.parentElement.replaceChild(btn, accLink);
  }

  function updateAccountNavBtn() {
    const btn = document.getElementById('accountNavBtn');
    if (!btn) return;
    btn.textContent = account.loggedIn ? `▲ ${account.name.split(' ')[0].toUpperCase()}` : 'ACCOUNT';
    btn.classList.toggle('logged-in', account.loggedIn);
  }

  // ── Toast ──────────────────────────────────────────
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function buildToast() {
    const t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast';
    t.setAttribute('aria-live', 'polite');
    document.body.appendChild(t);
  }

  // ── Init ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    buildMenuCards();
    buildCartDrawer();
    buildAccountDrawer();
    buildToast();
    wireNavCart();
    wireNavAccount();
    updateCartUI();
  });
})();