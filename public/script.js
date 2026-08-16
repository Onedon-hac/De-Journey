(() => {
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const currentPreference = () => localStorage.getItem('portfolio-theme') || 'system';

  function applyTheme(preference) {
    root.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.querySelectorAll('.theme-button').forEach(button => {
      const active = button.dataset.theme === preference;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active);
    });
    const color = getComputedStyle(root).getPropertyValue('--bg').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }

  applyTheme(currentPreference());
  media.addEventListener('change', () => { if (currentPreference() === 'system') applyTheme('system'); });
  document.querySelectorAll('.theme-button').forEach(button => button.addEventListener('click', () => {
    localStorage.setItem('portfolio-theme', button.dataset.theme);
    applyTheme(button.dataset.theme);
  }));

  const canvas = document.getElementById('bg-canvas');
  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const context = canvas.getContext('2d');
    const fontSize = 15;
    const chars = '01<>/{}[]#@%&*+=ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let width, height, columns = [];
    const resize = () => { width = canvas.width = innerWidth; height = canvas.height = innerHeight; columns = Array(Math.floor(width / fontSize)).fill(0); };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = getComputedStyle(root).getPropertyValue('--accent').trim();
      context.font = `${fontSize}px monospace`;
      columns.forEach((y, index) => {
        context.fillText(chars[Math.floor(Math.random() * chars.length)], index * fontSize, y);
        columns[index] = y > height && Math.random() > .98 ? 0 : y + fontSize;
      });
      requestAnimationFrame(draw);
    };
    addEventListener('resize', resize); resize(); draw();
  }

  const header = document.querySelector('.site-header');
  addEventListener('scroll', () => header?.classList.toggle('scrolled', scrollY > 20), { passive: true });
  header?.classList.toggle('scrolled', scrollY > 20);

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    const menu = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    menu?.addEventListener('click', () => {
      const open = nav.classList.toggle('active');
      menu.setAttribute('aria-expanded', open);
    });
    nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('active');
      menu?.setAttribute('aria-expanded', 'false');
    }));
    document.getElementById('contactForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button[type="submit"]');
      const status = document.getElementById('contactStatus');
      button.disabled = true;
      status.textContent = 'Sending...';
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.elements.name.value,
            email: form.elements.email.value,
            message: form.elements.message.value
          })
        });
        const responseText = await response.text();
        let body = {};
        try {
          body = responseText ? JSON.parse(responseText) : {};
        } catch {
          // Hosting errors are sometimes HTML or plain text instead of JSON.
        }
        if (!response.ok) {
          throw new Error(body.error || `Contact service is unavailable (error ${response.status}).`);
        }
        form.reset();
        status.textContent = body.message || 'Thanks — your message has been sent.';
      } catch (error) {
        status.textContent = error.message || 'Unable to send your message. Please try again.';
      } finally {
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll('.tool').forEach((tool, index, tools) => {
    const angle = (index / tools.length) * Math.PI * 2;
    tool.style.transform = `translate(${120 * Math.cos(angle) + 94}px, ${120 * Math.sin(angle) + 120}px)`;
  });
})();
