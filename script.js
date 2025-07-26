let photos = JSON.parse(localStorage.getItem('scrapbookPhotos') || '[]');
let currentPage = 0;
let deleteIndex = null;

function goToPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`${page}-page`).classList.remove('hidden');
  if (page === 'memories') renderMemories();
}

function savePhoto() {
  const photoInput = document.getElementById("photoInput");
  const captionInput = document.getElementById("captionInput");
  const note = document.getElementById("upload-note");

  if (!photoInput.files.length) {
    alert("Please select a photo.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const photo = {
      src: e.target.result,
      caption: captionInput.value.trim()
    };

    let photos = JSON.parse(localStorage.getItem("scrapbookPhotos") || "[]");
    photos.push(photo);
    localStorage.setItem("scrapbookPhotos", JSON.stringify(photos));

    captionInput.value = "";
    photoInput.value = "";

    if (photos.length >= 4) {
      note.style.display = "none";
    } else {
      note.style.display = "block";
    }

    document.getElementById('successModal').style.display = 'flex';
  };

  reader.readAsDataURL(photoInput.files[0]);
}

function renderMemories() {
  photos = JSON.parse(localStorage.getItem('scrapbookPhotos') || '[]');
  const book = document.getElementById('book');
  const noPhotoMsg = document.getElementById('no-photo');

  if (photos.length === 0) {
    noPhotoMsg.style.display = 'block';
    book.innerHTML = '';
    return;
  }
  noPhotoMsg.style.display = 'none';

  const start = currentPage * 8;
  const spread = photos.slice(start, start + 8);
  const paddedSpread = [...spread];

  while (paddedSpread.length < 8) {
    paddedSpread.push(null);
  }

  book.innerHTML = '';

  const left = paddedSpread.slice(0, 4);
  const right = paddedSpread.slice(4, 8);

  const leftPage = document.createElement('div');
  leftPage.className = 'page-side';

  const rightPage = document.createElement('div');
  rightPage.className = 'page-side';

  left.forEach((p, i) => {
    const mem = document.createElement('div');
    mem.className = 'memory';
    if (p) {
      const photoIndex = start + i;
      mem.innerHTML = `
        <button class="delete-btn" onclick="deletePhoto(${photoIndex})">×</button>
        <img src="${p.src}">
        <div class="caption">${p.caption}</div>
      `;
    } else {
      mem.innerHTML = `<div class="empty-slot"></div>`;
    }
    leftPage.appendChild(mem);
  });

  right.forEach((p, i) => {
    const mem = document.createElement('div');
    mem.className = 'memory';
    if (p) {
      const photoIndex = start + 4 + i;
      mem.innerHTML = `
        <button class="delete-btn" onclick="deletePhoto(${photoIndex})">×</button>
        <img src="${p.src}">
        <div class="caption">${p.caption}</div>
      `;
    } else {
      mem.innerHTML = `<div class="empty-slot"></div>`;
    }
    rightPage.appendChild(mem);
  });

  book.appendChild(leftPage);
  book.appendChild(rightPage);
}

function deletePhoto(index) {
  deleteIndex = index;
  document.getElementById('confirmModal').style.display = 'flex';
}

function confirmDelete() {
  if (deleteIndex !== null) {
    photos.splice(deleteIndex, 1);
    localStorage.setItem('scrapbookPhotos', JSON.stringify(photos));
    const maxPage = Math.floor((photos.length - 1) / 8);
    if (currentPage > maxPage) currentPage = maxPage;
    renderMemories();
    deleteIndex = null;
  }
  closeModal();
}

function closeModal() {
  document.getElementById('confirmModal').style.display = 'none';
}

function closeSuccessModal() {
  document.getElementById('successModal').style.display = 'none';
}

function changePage(delta) {
  const maxPage = Math.floor((photos.length - 1) / 8);
  currentPage = Math.min(Math.max(currentPage + delta, 0), maxPage);
  renderMemories();
}
