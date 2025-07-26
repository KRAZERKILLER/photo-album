// Initialize Supabase
const SUPABASE_URL = 'https://djhsduwbtxwqxunxfryf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqaHNkdXdidHh3cXh1bnhmcnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDI1NzIsImV4cCI6MjA2OTExODU3Mn0.oiy4qTjQhPZC495z3ZSGTsFFu4dDbHFDqzoQRb9d6tw';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let photos = [];
let currentPage = 0;
let deleteIndex = null;

function goToPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`${page}-page`).classList.remove('hidden');
  if (page === 'memories') loadPhotos();
}

async function savePhoto() {
  const photoInput = document.getElementById("photoInput");
  const captionInput = document.getElementById("captionInput");
  const note = document.getElementById("upload-note");

  const file = photoInput.files[0];
  if (!file) {
    alert("Please select a photo.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "scrapbook_upload");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/djioitxex/image/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    const imageUrl = data.secure_url;
    const caption = captionInput.value.trim();

    // Insert into Supabase
    const { error } = await supabase.from("photos").insert([{ src: imageUrl, caption }]);
    if (error) throw error;

    captionInput.value = "";
    photoInput.value = "";
    document.getElementById('successModal').style.display = 'flex';

    loadPhotos(); // Refresh photos
  } catch (err) {
    console.error(err);
    alert("Upload failed.");
  }
}


async function loadPhotos() {
  const { data, error } = await supabase.from("photos").select("*").order("id", { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  photos = data || [];
  renderMemories();
}

function renderMemories() {
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

async function confirmDelete() {
  if (deleteIndex !== null) {
    const photo = photos[deleteIndex];
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) {
      alert("Failed to delete photo.");
      console.error(error);
    } else {
      await loadPhotos();
    }
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
