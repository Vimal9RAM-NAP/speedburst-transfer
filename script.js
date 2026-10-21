let currentTransferData = null;

function toggleDarkMode() {
  const html = document.documentElement;
  const btn = document.getElementById('themeToggleBtn');
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    btn.innerText = '☀️';
  } else {
    html.classList.add('dark');
    btn.innerText = '🌙';
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-950/10');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-950/10');
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-950/10');
  if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
}

function handleFileSelect(e) {
  if (e.target.files.length) uploadFile(e.target.files[0]);
}

function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  document.getElementById('dropzoneContent').classList.add('hidden');
  document.getElementById('uploadProgressState').classList.remove('hidden');
  document.getElementById('uploadFileName').innerText = file.name;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload', true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      document.getElementById('progressBar').style.width = percent + '%';
    }
  };

  xhr.onload = function() {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      if (data.success) {
        currentTransferData = data;
        
        document.getElementById('uploadProgressState').classList.add('hidden');
        document.getElementById('dropzoneContent').innerHTML = `
          <div class="text-emerald-400 font-mono text-sm font-bold uppercase tracking-widest">⚡ TRANSFER CREATED SUCCESSFULLY</div>
          <div class="text-xl font-extrabold text-white mt-1">${file.name}</div>
          <div class="text-xs font-mono text-slate-400 mt-1">Ready for 24-hour retrieval</div>
        `;
        document.getElementById('dropzoneContent').classList.remove('hidden');

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
          width: 180,
          height: 180
        });
      }
    } else {
      alert('Upload failed.');
      resetUpload();
    }
  };

  xhr.send(formData);
}

function resetUpload() {
  currentTransferData = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('uploadProgressState').classList.add('hidden');
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('dropzoneContent').innerHTML = `
    <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl text-emerald-400 group-hover:scale-110 group-hover:border-emerald-500/50 transition-all shadow-inner">⚡</div>
    <div>
      <p class="text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-white">DRAG AND DROP FILE</p>
      <p class="font-mono text-xs text-slate-400 mt-2">Drop any file here to instantly provision QR, link, & credential access</p>
    </div>
  `;
  document.getElementById('dropzoneContent').classList.remove('hidden');

  document.getElementById('btnQr').disabled = true;
  document.getElementById('btnLink').disabled = true;
  document.getElementById('btnCreds').disabled = true;
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function copyField(id) {
  const input = document.getElementById(id);
  input.select();
  navigator.clipboard.writeText(input.value);
  alert('Copied to clipboard!');
}

function copyCreds() {
  const text = `Username: ${currentTransferData.credentials.username}\nPassword: ${currentTransferData.credentials.password}`;
  navigator.clipboard.writeText(text);
  alert('Credentials copied to clipboard!');
}

function shareData() {
  if (navigator.share && currentTransferData) {
    navigator.share({ title: 'Speedburst Transfer', url: currentTransferData.downloadUrl });
  } else {
    copyField('linkInput');
  }
}

function shareCreds() {
  if (navigator.share && currentTransferData) {
    navigator.share({ title: 'Speedburst Credentials', text: `User: ${currentTransferData.credentials.username}\nPin: ${currentTransferData.credentials.password}` });
  } else {
    copyCreds();
  }
}

async function claimTransfer() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();

  if (!username || !password) {
    alert('Please enter both username and password.');
    return;
  }

  try {
    const res = await fetch('/api/login-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.downloadUrl) {
      window.location.href = data.downloadUrl;
    } else {
      alert(data.error || 'Invalid credentials or transfer expired.');
    }
  } catch (err) {
    alert('Connection error.');
  }
}