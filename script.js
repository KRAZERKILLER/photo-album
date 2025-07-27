import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

const SUPABASE_URL = 'https://djhsduwbtxwqxunxfryf.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual Supabase anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentPage = 0;
let allPhotos = [];
let deleteId = null;

function setupNavigation() {
  document.getElementById("upload-btn").addEventListener("click", () => goToPage("upload"));
  document.getElementById("memories-btn").addEventListener("click", () => goToPage("memories"));
}

window.goToPage = async function(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`${page}-page`).classList.remove('hidden');
  if (page === 'memories') await renderMemories();
}

window.savePhoto = async function () {
  const photoInput = document.getElementById("photoInput");
  const captionInput = document.getElementById("captionInput");
  const note = document.getElementById("upload-note");

  const file = photoInput.files[0];
  if (!file) return alert("Please select a photo.");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "scrapbook_upload");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/djioitxex/image/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    const photo = { src: data.secure_url, caption: captionInput.value.trim() };

    await supabase.from("photos").insert([photo]);

    captionInput.value = "";
    photoInput.value = "";
    note.style.display = "block";

    document.getElementById('successModal').style.display = 'flex';
  } catch (err) {
    alert("Upload failed. Please try again.");
    console.error(err);
  }
}

async function renderMemories() {
  const { data, error } = await supabase.from("photos").select("*").order("id", { ascending: true });
  if (error) return console.error("Load failed:", error);

  allPhotos = data;
  const book = document.getElementById('book');
  const noPhotoMsg = document.getElementById('no-photo');

  if (allPhotos.length === 0) {
    noPhotoMsg.style.display = 'block';
    book.innerHTML = '';
    return;
  }
  noPhotoMsg.style.display = 'none';

  const start = currentPage * 8;
  const spread = allPhotos.slice(start, start + 8);
  const paddedSpread = [...spread];

  while (paddedSpread.length < 8) paddedSpread.push(null);

  book.innerHTML = '';

  const leftPage = document.createElement('div');
  leftPage.className = 'page-side';
  const rightPage = document.createElement('div');
  rightPage.className = 'page-side';

  paddedSpread.slice(0, 4).forEach(p => leftPage.appendChild(createMemory(p)));
  paddedSpread.slice(4, 8).forEach(p => rightPage.appendChild(createMemory(p)));

  book.appendChild(leftPage);
  book.appendChild(rightPage);
}

function createMemory(p) {
  const mem = document.createElement('div');
  mem.className = 'memory';
  if (p) {
    mem.innerHTML = `
      <button class="delete-btn" onclick="deletePhoto(${p.id})">×</button>
      <img src="${p.src}" />
      <div class="caption">${p.caption}</div>
    `;
  } else {
    mem.innerHTML = `<div class="empty-slot"></div>`;
  }
  return mem;
}

window.deletePhoto = async function(id) {
  deleteId = id;
  document.getElementById('confirmModal').style.display = 'flex';
}

window.confirmDelete = async function() {
  if (deleteId !== null) {
    await supabase.from("photos").delete().eq("id", deleteId);
    deleteId = null;
    await renderMemories();
  }
  closeModal();
}

window.closeModal = function() {
  document.getElementById('confirmModal').style.display = 'none';
}

window.closeSuccessModal = function() {
  document.getElementById('successModal').style.display = 'none';
}

window.changePage = function(delta) {
  const maxPage = Math.floor((allPhotos.length - 1) / 8);
  currentPage = Math.min(Math.max(currentPage + delta, 0), maxPage);
  renderMemories();
}

// Initialize listeners after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
});
