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
    if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const readJsonResponse = async response => {
      const text = await response.text();
      try {
        return text ? JSON.parse(text) : {};
      } catch {
        return {};
      }
    };
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

    const toolButtons = document.querySelectorAll('.tool-card');
    toolButtons.forEach(button => button.addEventListener('click', () => {
      toolButtons.forEach(item => { item.classList.toggle('is-selected', item === button); item.setAttribute('aria-selected', item === button); });
      document.querySelectorAll('.tool-panel').forEach(panel => { const active = panel.id === button.dataset.tool; panel.hidden = !active; panel.classList.toggle('is-active', active); });
    }));

    const paletteSwatches = document.getElementById('paletteSwatches');
    const paletteFeedback = document.getElementById('paletteFeedback');
    const makePalette = () => {
      const hue = Math.floor(Math.random() * 360);
      const colors = [0, 28, 65, 185, 230].map(offset => `hsl(${(hue + offset) % 360} 72% ${42 + Math.floor(Math.random() * 18)}%)`);
      paletteSwatches.innerHTML = '';
      colors.forEach(color => { const button = document.createElement('button'); button.className = 'palette-swatch'; button.style.background = color; const hex = rgbToHex(color); button.textContent = hex; button.addEventListener('click', async () => { await navigator.clipboard?.writeText(hex); paletteFeedback.textContent = `${hex} copied to clipboard.`; }); paletteSwatches.append(button); });
    };
    const rgbToHex = color => { const test = document.createElement('i'); test.style.color = color; document.body.append(test); const values = getComputedStyle(test).color.match(/\d+/g).map(Number); test.remove(); return `#${values.slice(0, 3).map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`; };
    document.getElementById('newPalette')?.addEventListener('click', makePalette); makePalette();

    const prompts = ['a neon city reflecting in rain', 'an abstract ocean made of glass', 'a quiet cyberpunk garden at midnight', 'a golden desert under two moons'];
    const generatedImage = document.getElementById('generatedImage');
    const artEmpty = document.getElementById('artEmpty');
    const generateButton = document.getElementById('generateArt');
    const generateArt = async () => { const prompt = document.getElementById('imagePrompt').value.trim(); if (!prompt) { artEmpty.textContent = 'Please describe the image you want to create.'; return; } generateButton.disabled = true; generateButton.textContent = 'Generating…'; artEmpty.hidden = false; artEmpty.textContent = 'Generating your image…'; try { const response = await fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) }); const data = await readJsonResponse(response); if (!response.ok) throw new Error(data.error || 'Unable to generate an image.'); generatedImage.src = data.image; generatedImage.classList.add('is-visible'); artEmpty.hidden = true; } catch (error) { generatedImage.classList.remove('is-visible'); artEmpty.hidden = false; artEmpty.textContent = error.message || 'Unable to generate an image.'; } finally { generateButton.disabled = false; generateButton.textContent = '⚡ Generate image'; } };
    document.getElementById('randomPrompt')?.addEventListener('click', () => { document.getElementById('imagePrompt').value = prompts[Math.floor(Math.random() * prompts.length)]; });
    document.getElementById('generateArt')?.addEventListener('click', generateArt);
    const chatHistory = [];
    const addChatMessage = (content, user = false) => { const message = document.createElement('p'); if (user) message.className = 'user-message'; if (!user) { const title = document.createElement('b'); title.textContent = 'Creative assistant'; message.append(title, document.createElement('br')); } message.append(document.createTextNode(content)); document.getElementById('chatLog').append(message); };
    document.getElementById('chatForm')?.addEventListener('submit', async event => { event.preventDefault(); const input = document.getElementById('chatInput'); const submit = event.currentTarget.querySelector('button'); const message = input.value.trim(); if (!message) return; addChatMessage(message, true); chatHistory.push({ role: 'user', content: message }); input.value = ''; submit.disabled = true; submit.textContent = 'Thinking…'; try { const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: chatHistory }) }); const data = await readJsonResponse(response); if (!response.ok) throw new Error(data.error || 'Unable to get a response.'); addChatMessage(data.message); chatHistory.push({ role: 'assistant', content: data.message }); } catch (error) { addChatMessage(error.message || 'Unable to get a response.'); } finally { submit.disabled = false; submit.textContent = 'Send'; document.getElementById('chatLog').scrollTop = document.getElementById('chatLog').scrollHeight; } });
    let selectedFile;
    const fileInput = document.getElementById('fileInput'); const convertFormat = document.getElementById('convertFormat'); const convertButton = document.getElementById('convertFile');
    const documentFormats = '<option value="txt">Plain text (.txt)</option><option value="pdf">PDF document (.pdf)</option><option value="docx">Word document (.docx)</option><option value="xlsx">Excel workbook (.xlsx)</option>';
    fileInput?.addEventListener('change', event => { selectedFile = event.target.files[0]; if (!selectedFile) return; const isImage = selectedFile.type.startsWith('image/'); convertFormat.innerHTML = isImage ? '<option value="png">PNG image</option><option value="jpeg">JPEG image</option><option value="webp">WebP image</option>' : documentFormats; convertFormat.disabled = false; convertButton.disabled = false; document.getElementById('fileLabel').textContent = selectedFile.name; document.getElementById('fileFeedback').textContent = `${selectedFile.type || 'Unknown type'} · ${(selectedFile.size / 1024).toFixed(1)} KB`; });
    const downloadBlob = (blob, name) => { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); };
    const extractDocumentText = async file => {
      const extension = file.name.split('.').pop().toLowerCase();
      if (extension === 'docx') return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
      if (extension === 'pdf') { const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise; const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => { const content = await (await pdf.getPage(index + 1)).getTextContent(); return content.items.map(item => item.str).join(' '); })); return pages.join('\n\n'); }
      if (extension === 'xlsx' || extension === 'xls') { const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' }); return workbook.SheetNames.map(name => `# ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join('\n\n'); }
      return file.text();
    };
    const createDocumentBlob = async (text, format) => {
      if (format === 'txt') return new Blob([text], { type: 'text/plain' });
      if (format === 'pdf') { const pdf = new jspdf.jsPDF(); const lines = pdf.splitTextToSize(text || ' ', 180); lines.forEach((line, index) => { if (index && index % 45 === 0) pdf.addPage(); pdf.text(line, 15, 18 + (index % 45) * 6); }); return pdf.output('blob'); }
      if (format === 'docx') { const document = new docx.Document({ sections: [{ children: (text || ' ').split(/\n+/).map(line => new docx.Paragraph({ text: line })) }] }); return docx.Packer.toBlob(document); }
      const workbook = XLSX.utils.book_new(); const rows = text.split('\n').map(line => line.split(',')); XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Converted'); return new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    };
    convertButton?.addEventListener('click', async () => { if (!selectedFile) return; const format = convertFormat.value; const baseName = selectedFile.name.replace(/\.[^.]+$/, ''); const feedback = document.getElementById('fileFeedback'); convertButton.disabled = true; convertButton.textContent = 'Converting…'; try { if (selectedFile.type.startsWith('image/')) { const image = new Image(); const source = URL.createObjectURL(selectedFile); await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = source; }); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; const context = canvas.getContext('2d'); if (format === 'jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); } context.drawImage(image, 0, 0); const blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`, .92)); downloadBlob(blob, `${baseName}.${format === 'jpeg' ? 'jpg' : format}`); URL.revokeObjectURL(source); } else { const text = await extractDocumentText(selectedFile); const blob = await createDocumentBlob(text, format); downloadBlob(blob, `${baseName}.${format}`); } feedback.textContent = 'Conversion complete - your download has started.'; } catch (error) { feedback.textContent = `Conversion failed: ${error.message || 'unsupported file.'}`; } finally { convertButton.disabled = false; convertButton.textContent = 'Convert & download'; } });
    const updateStorage = () => { let bytes = 0; Object.keys(localStorage).forEach(key => { bytes += (localStorage.getItem(key).length + key.length) * 2; }); document.getElementById('storageUsage').textContent = `${(bytes / 1024).toFixed(1)} KB used`; document.getElementById('storageFill').style.width = `${Math.min(100, bytes / 52428800 * 100)}%`; }; updateStorage();

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
          if (response.status === 405) {
            status.textContent = 'The message server is unavailable here. Opening your email client instead…';
            const subject = encodeURIComponent(`Portfolio message from ${form.elements.name.value}`);
            const message = encodeURIComponent(`${form.elements.message.value}\n\nFrom: ${form.elements.name.value} (${form.elements.email.value})`);
            window.location.href = `mailto:ohenebaonedon2@gmail.com?subject=${subject}&body=${message}`;
            return;
          }
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
