(function () {
  const ADMIN_KEY = 'wb-resume-admin';
  const ADMIN_PASSWORD = '2503';
  const GALLERY_API = '/gallery-api';
  const FAQ_API = '/faq-api';
  const CONTENT_API = '/content-api';
  const MAX_DIMENSION = 1600;
  const JPEG_QUALITY = 0.82;
  const HERO_VARIANT_KEY = 'wb-resume-hero-variant';

  const HERO_VARIANTS = {
    1: {
      eyebrow: 'Павел Лесников • Менеджер маркетплейсов Wildberries / Ozon',
      title: '',
      lead: '1,5+ года практического опыта в Wildberries: реклама, SEO, инфографика, поставки, отзывы, логистика и unit-экономика.\nПлюс опыт собственного магазина и автоматизации процессов с помощью ИИ.',
      badge: 'Коротко',
      facts: [
        '<strong>1,5+ года</strong> в WB',
        '<strong>LOMKA, Cosmo Beauty, IT\'S BASE</strong>',
        'Опыт со стороны <strong>селлера</strong>',
        'Фокус на <strong>аналитике и марже</strong>'
      ]
    },
    2: {
      eyebrow: 'Павел Лесников • Пермь • Менеджер маркетплейсов',
      title: 'Привет, я Павел Лесников',
      lead: 'Это мой сайт-визитка, где я кратко собрал информацию о себе, своём опыте и сильных сторонах в e-commerce.\n\nЗдесь можно посмотреть мой реальный опыт работы с Wildberries, фото по проектам, ответы на частые вопросы и понять, чем я могу быть полезен бизнесу.',
      badge: 'Что здесь есть',
      facts: [
        '<strong>Опыт:</strong> реальные проекты и задачи',
        '<strong>Фото:</strong> подтверждение практики',
        '<strong>FAQ:</strong> ответы на частые вопросы',
        '<strong>Контакты:</strong> для связи по сотрудничеству'
      ]
    },
    3: {
      eyebrow: 'Павел Лесников • Пермь • Wildberries / E-commerce',
      title: 'Меня зовут Павел, и здесь — кратко обо мне как о специалисте',
      lead: 'Последние годы я работаю в digital и e-commerce: занимался Telegram-проектами, работал с Wildberries, пробовал себя как селлер и развивал навыки автоматизации с помощью AI.\n\nЭтот сайт нужен для того, чтобы быстро показать мой релевантный опыт, подход к работе и реальные точки, где я уже был полезен.',
      badge: 'Коротко обо мне',
      facts: [
        '<strong>6 лет</strong> работы в интернете',
        '<strong>1,5+ года</strong> практики в WB',
        '<strong>Свой магазин</strong> как опыт селлера',
        '<strong>AI</strong> для упрощения рутины'
      ]
    },
    4: {
      eyebrow: 'Павел Лесников • Пермь • Менеджер Wildberries',
      title: 'Вы попали на мой сайт-визитку',
      lead: 'Я собрал здесь основные блоки о себе: кто я, какой у меня опыт в Wildberries, в чём мои сильные стороны и какие задачи я уже решал на практике.\n\nИдея простая — чтобы HR или владелец бизнеса могли быстро понять, подхожу ли я им по опыту и формату мышления.',
      badge: 'Навигация по сайту',
      facts: [
        '<strong>Обо мне</strong> — общий бэкграунд',
        '<strong>Сильные стороны</strong> — что меня выделяет',
        '<strong>E-Commerce</strong> — рабочий опыт',
        '<strong>FAQ</strong> — ответы на ваши вопросы',
        '<strong>Контакты</strong> — как связаться'
      ]
    },
    5: {
      eyebrow: 'Павел Лесников • Пермь • E-commerce / Wildberries',
      title: 'Здесь я кратко показываю, кто я, чем занимался и куда хочу двигаться дальше',
      lead: 'Это не просто красивая страница, а сжатая презентация моего опыта: работа на Wildberries, собственный селлерский опыт, операционка, реклама, карточки, аналитика и практический взгляд на e-commerce.\n\nЕсли вам важно быстро понять, кто перед вами и стоит ли идти дальше в диалог — на этом сайте всё собрано в одном месте.',
      badge: 'Смысл сайта',
      facts: [
        '<strong>Кто я</strong> — как специалист и человек',
        '<strong>Чем занимался</strong> — по реальным кейсам',
        '<strong>Что умею</strong> — без лишней воды',
        '<strong>Зачем сайт</strong> — быстро показать суть'
      ]
    }
  };

  function isAdmin() {
    return localStorage.getItem(ADMIN_KEY) === 'true';
  }

  function setAdmin(state) {
    localStorage.setItem(ADMIN_KEY, state ? 'true' : 'false');
    document.body.classList.toggle('admin-mode', state);
    const toggle = document.querySelector('[data-admin-toggle]');
    if (toggle) toggle.textContent = state ? 'Выйти' : 'Войти';
    const faqAdmin = document.querySelector('[data-faq-admin]');
    if (faqAdmin) faqAdmin.hidden = !state;
    const heroAdmin = document.querySelector('[data-hero-admin]');
    if (heroAdmin) heroAdmin.hidden = !state;
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
      if (isAdmin()) setAdmin(false);
      else openAdminModal();
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
      } else if (error) error.hidden = false;
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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('GET failed');
    return res.json();
  }

  async function apiPost(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('POST failed');
    return res.json();
  }

  let faqState = [];

  function renderFaq() {
    const list = document.querySelector('[data-faq-list]');
    if (!list) return;
    list.innerHTML = faqState.map((item, index) => `
      <details class="faq-item glass-card" ${index === 0 ? 'open' : ''}>
        <summary>${escapeHtml(item.question)}</summary>
        <div class="faq-answer">${escapeHtml(item.answer)}</div>
        <div class="faq-item-actions">
          <button class="faq-mini-btn" type="button" data-faq-edit="${item.id}">Редактировать</button>
          <button class="faq-mini-btn" type="button" data-faq-up="${item.id}">↑</button>
          <button class="faq-mini-btn" type="button" data-faq-down="${item.id}">↓</button>
          <span class="faq-move-group">
            <input class="faq-move-input" type="number" min="1" max="${faqState.length}" value="${index + 1}" data-faq-target="${item.id}" />
            <button class="faq-mini-btn" type="button" data-faq-move="${item.id}">Перенести</button>
          </span>
          <button class="faq-mini-btn danger" type="button" data-faq-delete="${item.id}">Удалить</button>
        </div>
      </details>
    `).join('');
  }

  async function refreshFaq() {
    const data = await apiGet(`${FAQ_API}/list`);
    faqState = data.items || [];
    renderFaq();
  }

  function initFaqAdmin() {
    const questionInput = document.querySelector('[data-faq-question]');
    const answerInput = document.querySelector('[data-faq-answer]');
    const saveBtn = document.querySelector('[data-faq-save]');
    const resetBtn = document.querySelector('[data-faq-reset]');
    const list = document.querySelector('[data-faq-list]');
    if (!questionInput || !answerInput || !saveBtn || !resetBtn || !list) return;

    let editingId = null;

    function resetForm() {
      editingId = null;
      questionInput.value = '';
      answerInput.value = '';
      saveBtn.textContent = 'Сохранить вопрос';
    }

    saveBtn.addEventListener('click', async () => {
      if (!isAdmin()) return;
      const question = questionInput.value.trim();
      const answer = answerInput.value;
      if (!question || !answer.trim()) return;
      await apiPost(`${FAQ_API}/save`, { id: editingId, question, answer });
      await refreshFaq();
      resetForm();
    });

    resetBtn.addEventListener('click', resetForm);

    list.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-faq-edit]');
      const deleteBtn = e.target.closest('[data-faq-delete]');
      const upBtn = e.target.closest('[data-faq-up]');
      const downBtn = e.target.closest('[data-faq-down]');
      const moveBtn = e.target.closest('[data-faq-move]');

      if (editBtn) {
        if (!isAdmin()) return;
        const id = Number(editBtn.getAttribute('data-faq-edit'));
        const item = faqState.find(x => x.id === id);
        if (!item) return;
        editingId = id;
        questionInput.value = item.question;
        answerInput.value = item.answer;
        saveBtn.textContent = 'Сохранить изменения';
        questionInput.focus();
      }

      if (deleteBtn) {
        if (!isAdmin()) return;
        const id = Number(deleteBtn.getAttribute('data-faq-delete'));
        if (!window.confirm('Удалить этот вопрос из FAQ?')) return;
        await apiPost(`${FAQ_API}/delete`, { id });
        await refreshFaq();
        resetForm();
      }

      if (upBtn) {
        if (!isAdmin()) return;
        const id = Number(upBtn.getAttribute('data-faq-up'));
        await apiPost(`${FAQ_API}/move`, { id, direction: 'up' });
        await refreshFaq();
      }

      if (downBtn) {
        if (!isAdmin()) return;
        const id = Number(downBtn.getAttribute('data-faq-down'));
        await apiPost(`${FAQ_API}/move`, { id, direction: 'down' });
        await refreshFaq();
      }

      if (moveBtn) {
        if (!isAdmin()) return;
        const id = Number(moveBtn.getAttribute('data-faq-move'));
        const input = list.querySelector(`[data-faq-target="${id}"]`);
        const target = Number(input?.value || 1) - 1;
        await apiPost(`${FAQ_API}/move`, { id, target_index: target });
        await refreshFaq();
      }
    });

    refreshFaq();
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
    const data = await apiGet(`${GALLERY_API}/list?id=${encodeURIComponent(id)}`);
    return data.items || [];
  }

  async function apiPostGallery(path, body) {
    return apiPost(`${GALLERY_API}${path}`, body);
  }

  function getState(root) {
    if (!root._galleryState) root._galleryState = { items: [], index: 0 };
    return root._galleryState;
  }

  async function loadProfileImage() {
    const profile = document.querySelector('.photo-slot-image');
    if (!profile) return;
    try {
      const data = await apiGet('/profile-api');
      if (data?.src) profile.src = data.src;
    } catch (_) {}
  }

  function applyHeroVariant(variantId) {
    const variant = HERO_VARIANTS[variantId] || HERO_VARIANTS[1];
    const eyebrow = document.querySelector('[data-hero-eyebrow]');
    const title = document.querySelector('[data-hero-title]');
    const lead = document.querySelector('[data-hero-lead]');
    const badge = document.querySelector('[data-hero-badge]');
    const factEls = Array.from(document.querySelectorAll('[data-hero-fact]'));

    if (eyebrow) eyebrow.textContent = variant.eyebrow;
    if (title) {
      title.textContent = variant.title;
      title.hidden = !variant.title;
    }
    if (lead) lead.textContent = variant.lead;
    if (badge) badge.textContent = variant.badge;
    factEls.forEach((el, index) => {
      el.innerHTML = variant.facts[index] || '';
    });

    document.body.classList.remove('hero-variant-1', 'hero-variant-2', 'hero-variant-3', 'hero-variant-4', 'hero-variant-5');
    document.body.classList.add(`hero-variant-${variantId}`);
    document.querySelectorAll('[data-hero-variant]').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.dataset.heroVariant) === Number(variantId));
    });
    localStorage.setItem(HERO_VARIANT_KEY, String(variantId));
  }

  function initHeroVariants() {
    const current = Number(localStorage.getItem(HERO_VARIANT_KEY) || '1');
    document.querySelectorAll('[data-hero-variant]').forEach((btn) => {
      btn.addEventListener('click', () => applyHeroVariant(Number(btn.dataset.heroVariant)));
    });
    applyHeroVariant(current);
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
    await apiPostGallery('/upload', { id: root.dataset.galleryId, images: payload });
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
      await apiPostGallery('/move', { id: root.dataset.galleryId, index: state.index, direction: 'left' });
      state.index -= 1;
      await refreshGallery(root, true);
    });

    shiftRightBtn?.addEventListener('click', async () => {
      if (!isAdmin()) return;
      const state = getState(root);
      if (state.index >= state.items.length - 1 || !state.items.length) return;
      await apiPostGallery('/move', { id: root.dataset.galleryId, index: state.index, direction: 'right' });
      state.index += 1;
      await refreshGallery(root, true);
    });

    removeBtn.addEventListener('click', async () => {
      if (!isAdmin()) return;
      const ok = window.confirm('Удалить текущее фото из этой карусели?');
      if (!ok) return;
      const state = getState(root);
      await apiPostGallery('/delete', { id: root.dataset.galleryId, index: state.index });
      await refreshGallery(root, true);
    });

    clearBtn.addEventListener('click', async () => {
      if (!isAdmin()) return;
      const ok = window.confirm('Удалить все фото из этой карусели? Это действие нельзя отменить.');
      if (!ok) return;
      await apiPostGallery('/clear', { id: root.dataset.galleryId });
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
    initFaqAdmin();
    initHeroVariants();
    loadProfileImage();
    document.querySelectorAll('.experience-gallery').forEach(initGallery);
  });
})();
