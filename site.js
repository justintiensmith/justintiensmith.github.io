(() => {
  const dialog = document.querySelector('[data-lightbox-dialog]');
  const links = Array.from(document.querySelectorAll('[data-lightbox]'));
  if (!dialog || !links.length) return;

  const image = dialog.querySelector('[data-lightbox-image]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  const original = dialog.querySelector('[data-lightbox-original]');
  const counter = dialog.querySelector('[data-lightbox-counter]');
  let selected = 0;
  let previousOverflow = '';

  function display(index) {
    selected = (index + links.length) % links.length;
    const link = links[selected];
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    image.style.setProperty('--crop-left', link.dataset.cropLeft || '0%');
    caption.textContent = link.dataset.caption || image.alt;
    original.href = link.href;
    counter.textContent = `${selected + 1} / ${links.length}`;
  }

  links.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      display(index);
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lightbox-prev]').addEventListener('click', () => display(selected - 1));
  dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => display(selected + 1));
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    image.removeAttribute('src');
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); display(selected - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); display(selected + 1); }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
})();

(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const status = form.querySelector('[data-contact-status]');
  const button = form.querySelector('button[type="submit"]');
  const endpoint = (form.getAttribute('action') || '').trim();

  const fields = Array.from(form.querySelectorAll('input, textarea'));
  fields.forEach(field => field.addEventListener('input', () => field.setCustomValidity('')));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = '';
    status.removeAttribute('data-state');
    for (const field of fields) {
      if (field.required && !field.value.trim()) field.setCustomValidity('Please fill out this field.');
    }
    if (!form.reportValidity()) return;

    if (!endpoint) {
      status.textContent = 'Your form is ready, but this private preview does not send messages. Nothing has been sent.';
      status.dataset.state = 'preview';
      return;
    }

    let destination;
    try {
      destination = new URL(endpoint);
      if (destination.protocol !== 'https:') throw new Error('HTTPS required');
    } catch {
      status.textContent = 'Message delivery is unavailable. Please try again later.';
      status.dataset.state = 'error';
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const response = await fetch(destination.href, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error('Delivery failed');
      status.textContent = 'Thank you. Your message has been sent.';
      status.dataset.state = 'success';
      form.reset();
    } catch {
      status.textContent = 'Your message could not be sent. Please try again; your text is still here.';
      status.dataset.state = 'error';
    } finally {
      button.disabled = false;
      button.textContent = 'Send message ↗';
    }
  });
})();
