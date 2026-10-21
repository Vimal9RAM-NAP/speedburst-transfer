let currentTransferData = null;

function toggleDarkMode() {
  const html = document.documentElement;
  const btn = document.getElementById('themeToggleBtn');
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    btn.innerText = '🌙';
  } else {
    html.classList.add('dark');
    btn.innerText = '☀️';
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('border-brand-500', 'bg-brand-50/20');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('border-brand-500', 'bg-brand-50/20');
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('border-brand-500', 'bg-brand-50/20');
  if (e.dataTransfer.files.length) {
    uploadFile(e.dataTransfer.files[0]);
  }
}

function handleFileSelect(e) {
  if (e.target.files.length) {
    uploadFile(e.target.files[0]);
  }
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  document.getElementById('dropzoneContent').innerHTML = `<p class="text-xl font-bold animate-pulse text-brand-600">UPLOADING FILE...</p>`;

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    if (data.success) {
      currentTransferData = data;
      
      document.getElementById('fileName').innerText = file.name;
      document.getElementById('fileSize').innerText = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      document.getElementById('dropzoneContent').classList.add('hidden');
      document.getElementById('fileSelectedState').classList.remove('hidden');

      document.getElementById('btnQr').disabled = false;
      document.getElementById('btnLink').disabled = false;
      document.getElementById('btnCreds').disabled = false;

      document.getElementById('linkInput').value = data.downloadUrl;
      document.getElementById('usernameInput').value = data.credentials.username;
      document.getElementById('passwordInput').value = data.credentials.password;

      const qrContainer = document.getElementById('qrContainer');
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: data.downloadUrl,
        width: 200,
        height: 200
      });
    }
  } catch (err) {
    alert('Upload failed: ' + err.message);
    resetUpload();
  }
}

function resetUpload() {
  currentTransferData = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('dropzoneContent').classList.remove('hidden');
  document.getElementById('fileSelectedState').classList.add('hidden');
  document.getElementById('dropzoneContent').innerHTML = `
    <div class="w-16 h-16 mx-auto rounded-2xl border-2 border-slate-900 dark:border-slate-100 flex items-center justify-center text-2xl group-hover:bg-brand-500 group-hover:border-brand-500 group-hover:text-white transition-all">📂</div>
    <p class="text-2xl md:text-4xl font-extrabold tracking-wide uppercase text-slate-900 dark:text-slate-100">DRAG AND DROP</p>
    <p class="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Drop any file here to generate quick transfer access credentials instantly.</p>
  `;

  document.getElementById('btnQr').disabled = true;
  document.getElementById('btnLink').disabled = true;
  document.getElementById('btnCreds').disabled = true;
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function copyToClipboard(inputId) {
  const input = document.getElementById(inputId);
  input.select();
  navigator.clipboard.writeText(input.value);
  alert('Copied to clipboard!');
}

function copyCreds() {
  const text = `Username: ${currentTransferData.credentials.username}\nPassword: ${currentTransferData.credentials.password}`;
  navigator.clipboard.writeText(text);
  alert('Credentials copied to clipboard!');
}

function shareLink() {
  if (navigator.share && currentTransferData) {
    navigator.share({
      title: 'Speedburst Transfer',
      text: 'Download your file via Speedburst Transfer',
      url: currentTransferData.downloadUrl
    });
  } else {
    copyToClipboard('linkInput');
  }
}

function shareCreds() {
  if (navigator.share && currentTransferData) {
    navigator.share({
      title: 'Speedburst Transfer Credentials',
      text: `Username: ${currentTransferData.credentials.username}\nPassword: ${currentTransferData.credentials.password}`
    });
  } else {
    copyCreds();
  }
}