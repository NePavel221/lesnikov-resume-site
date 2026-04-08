(function () {
  const ADMIN_KEY = 'wb-resume-admin';
  const ADMIN_PASSWORD = '2503';
  const API_BASE = '/gallery-api';
  const MAX_DIMENSION = 1600;
  const JPEG_QUALITY = 0.82;

  function isAdmin() {
    return localStorage.getItem(ADMIN_KEY) === 'true';
  }

  function setAdmin(state) {
    localStorage.setItem(ADMIN_KEY, state ? 'true' : 'false');
    document.body.classList.toggle('admin-mode', state);
    const toggle = document.querySelector('[data-admin-toggle]');
    if (toggle) toggle.textContent = state ? 'Выйти' : 'Войти';
  }

  function openAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const input = modal.querySelector('[data-admin-password]');
    const error = modal.querySelector('[data-admin-error]');
    if (error) error.hidden = true;
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 10);
    }
  }

  function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function initAdminUI() {
    const toggle = document.querySelector('[data-admin-toggle]');
    const modal = document.getElementById('admin-modal');
    if (!toggle || !modal) return;

    setAdmin(isAdmin());

    toggle.addEventListener('click', () => {
      if (isAdmin()) {
        setAdmin(false);
      } else {
        openAdminModal();
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-admin-close')) closeAdminModal();
    });

    const submit = modal.querySelector('[data-admin-submit]');
    const input = modal.querySelector('[data-admin-password]');
    const error = modal.querySelector('[data-admin-error]');
    const passwordToggle = modal.querySelector('[data-admin-password-toggle]');

    const tryLogin = () => {
      if (!input) return;
      if (input.value === ADMIN_PASSWORD) {
        setAdmin(true);
        closeAdminModal();
      } else if (error) {
        error.hidden = false;
      }
    };

    submit?.addEventListener('click', tryLogin);
    passwordToggle?.addEventListener('click', () => {
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      passwordToggle.textContent = isPassword ? '🙈' : '👁';
      passwordToggle.setAttribute('aria-label', isPassword ? 'Скрыть пароль' : 'Показать пароль');
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryLogin();
      if (e.key === 'Escape') closeAdminModal();
    });
  }

  function fileToImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function compressImage(file) {
    const img = await fileToImage(file);
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.round(img.width * ratio);
    const height = Math.round(img.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  }

  function ensureModal() {
    let modal = document.getElementById('image-lightbox');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'image-lightbox';
    modal.className = 'image-lightbox';
    modal.innerHTML = `
      <div class="image-lightbox-backdrop" data-close></div>
      <div class="image-lightbox-dialog">
        <button class="image-lightbox-close" type="button" data-close aria-label="Закрыть">×</button>
        <img class="image-lightbox-image" alt="Увеличенное фото" />
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        closeAdminModal();
      }
    });
    return modal;
  }

  function openModal(src) {
    const modal = ensureModal();
    modal.querySelector('.image-lightbox-image').src = src;
    modal.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    const modal = document.getElementById('image-lightbox');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  async function apiGetGallery(id) {
    const res = await fetch(`${API_BASE}/list?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to load gallery');
    const data = await res.json();
    return data.items || [];
  }

  async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }

  function getState(root) {
    if (!root._galleryState) root._galleryState = { items: [], index: 0 };
    return root._galleryState;
  }

  function renderGallery(root) {
    const state = getState(root);
    const items = state.items;
    let index = state.index || 0;
    if (index >= items.length) index = Math.max(0, items.length - 1);
    state.index = index;

    const imageEl = root.querySelector('[data-image]');
    const bgEl = root.querySelector('[data-image-bg]');
    const emptyEl = root.querySelector('[data-empty]');
    const countEl = root.querySelector('[data-count]');
    const prevBtn = root.querySelector('[data-prev]');
    const nextBtn = root.querySelector('[data-next]');
    const removeBtn = root.querySelector('[data-remove-current]');
    const clearBtn = root.querySelector('[data-clear-all]');
    const shiftLeftBtn = root.querySelector('[data-shift-left]');
    const shiftRightBtn = root.querySelector('[data-shift-right]');

    countEl.textContent = items.length ? `${index + 1} / ${items.length}` : '0 фото';

    if (!items.length) {
      imageEl.hidden = true;
      if (bgEl) bgEl.hidden = true;
      emptyEl.hidden = false;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      removeBtn.disabled = true;
      clearBtn.disabled = true;
      if (shiftLeftBtn) shiftLeftBtn.disabled = true;
      if (shiftRightBtn) shiftRightBtn.disabled = true;
      return;
    }

    imageEl.src = items[index];
    imageEl.hidden = false;
    if (bgEl) {
      bgEl.src = items[index];
      bgEl.hidden = false;
    }
    emptyEl.hidden = true;
    prevBtn.disabled = items.length <= 1;
    nextBtn.disabled = items.length <= 1;
    removeBtn.disabled = !isAdmin();
    clearBtn.disabled = !isAdmin();
    if (shiftLeftBtn) shiftLeftBtn.disabled = !isAdmin() || items.length <= 1 || index === 0;
    if (shiftRightBtn) shiftRightBtn.disabled = !isAdmin() || items.length <= 1 || index === items.length - 1;
  }

  async function refreshGallery(root, keepIndex = true) {
    const state = getState(root);
    const oldIndex = state.index || 0;
    state.items = await apiGetGallery(root.dataset.galleryId);
    state.index = keepIndex ? oldIndex : Math.max(0, state.items.length - 1);
    renderGallery(root);
  }

  async function onUpload(root, files) {
    const payload = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      payload.push(await compressImage(file));
    }
    if (!payload.length) return;
    await apiPost('/upload', { id: root.dataset.galleryId, images: payload });
    await refreshGallery(root, false);
  }

  function initGallery(root) {
    const uploadInput = root.querySelector('[data-upload]');
    const prevBtn = root.querySelector('[data-prev]');
    const nextBtn = root.querySelector('[data-next]');
    const removeBtn = root.querySelector('[data-remove-current]');
    const clearBtn = root.querySelector('[data-clear-all]');
    const shiftLeftBtn = root.querySelector('[data-shift-left]');
    const shiftRightBtn = root.querySelector('[data-shift-right]');
    const imageEl = root.querySelector('[data-image]');
    const frameEl = root.querySelector('.gallery-frame');

    uploadInput.addEventListener('change', async (e) => {
      if (!isAdmin()) return;
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      await onUpload(root, files);
      uploadInput.value = '';
    });

    prevBtn.addEventListener('click', () => {
      const state = getState(root);
      if (!state.items.length) return;
      state.index = (state.index - 1 + state.items.length) % state.items.length;
      renderGallery(root);
    });

    nextBtn.addEventListener('click', () => {
      const state = getState(root);
      if (!state.items.length) return;
      state.index = (state.index + 1) % state.items.length;
      renderGallery(root);
    });

    shiftLeftBtn?.addEventListener('click', async () => {
      if (!isAdmin()) return;
      const state = getState(root);
      if (state.index <= 0 || !state.items.length) return;
      await apiPost('/move', { id: root.dataset.galleryId, index: state.index, direction: 'left' });
      state.index -= 1;
      await refreshGallery(root, true);
    });

    shiftRightBtn?.addEventListener('click', async () => {
      if (!isAdmin()) return;
      const state = getState(root);
      if (state.index >= state.items.length - 1 || !state.items.length) return;
      await apiPost('/move', { id: root.dataset.galleryId, index: state.index, direction: 'right' });
      state.index += 1;
      await refreshGallery(root, true);
    });

    removeBtn.addEventListener('click', async () => {
      if (!isAdmin()) return;
      const ok = window.confirm('Удалить текущее фото из этой карусели?');
      if (!ok) return;
      const state = getState(root);
      await apiPost('/delete', { id: root.dataset.galleryId, index: state.index });
      await refreshGallery(root, true);
    });

    clearBtn.addEventListener('click', async () => {
      if (!isAdmin()) return;
      const ok = window.confirm('Удалить все фото из этой карусели? Это действие нельзя отменить.');
      if (!ok) return;
      await apiPost('/clear', { id: root.dataset.galleryId });
      await refreshGallery(root, true);
    });

    frameEl.addEventListener('click', (e) => {
      if (!imageEl.src || imageEl.hidden) return;
      if (e.target.closest('.gallery-nav') || e.target.closest('.gallery-controls') || e.target.closest('.gallery-upload') || e.target.closest('.gallery-action')) return;
      openModal(imageEl.src);
    });

    refreshGallery(root).catch(() => renderGallery(root));
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureModal();
    initAdminUI();
    document.querySelectorAll('.experience-gallery').forEach(initGallery);
  });
})();
