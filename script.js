// ✅ Correct Supabase initialization (v2)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://djhsduwbtxwqunxfryf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqaHNkdXdidHh3cXh1bnhmcnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDI1NzIsImV4cCI6MjA2OTExODU3Mn0.oiy4qTjQhPZC495z3ZSGTsFFu4dDbHFDqzoQRb9d6tw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentPage = 0;
let allPhotos = [];
let deleteId = null;

function setupNavigation() {
  document.getElementById("upload-btn").addEventListener("click", () => goToPage("upload"));
  document.getElementById("memories-btn").addEventListener("click", () => goToPage("memories"));
}

window.goToPage = async function (page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`${page}-page`).classList.remove('hidden');
  if (page === 'memories') await renderMemories();
};

window.savePhoto = async function () {
  const photoInput = document.getElementById("photoInput");
  const captionInput = document.getElementById("captionInput");
  const file = photoInput.files[0];
  if (!file) return alert("Please select a photo.");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "scrapbook_upload");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/djioitxex/image/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    const photo = { src: data.secure_url, caption: captionInput.value.trim() };

    await supabase.from("photos").insert([photo]);

    captionInput.value = "";
    photoInput.value = "";

    document.getElementById('successModal').style.display = 'flex';
  } catch (err) {
    alert("Upload failed.");
    console.error(err);
  }
};

async function renderMemories() {
  const { data, error } = await supabase.from("photos").select("*").order("id", { ascending: true });
  if (error) return console.error("Error loading photos:", error);

  allPhotos = data;
  const book = document.getElementById("book");
  const noPhotoMsg = document.getElementById("no-photo");

  if (allPhotos.length === 0) {
    noPhotoMsg.style.display = "block";
    book.innerHTML = "";
    return;
  }

  noPhotoMsg.style.display = "none";

  const start = currentPage * 8;
  const spread = allPhotos.slice(start, start + 8);
  const padded = [...spread];
  while (padded.length < 8) padded.push(null);

  book.innerHTML = "";

  const left = document.createElement("div");
  left.className = "page-side";
  padded.slice(0, 4).forEach(p => left.appendChild(createMemory(p)));

  const right = document.createElement("div");
  right.className = "page-side";
  padded.slice(4, 8).forEach(p => right.appendChild(createMemory(p)));

  book.appendChild(left);
  book.appendChild(right);
}

function createMemory(photo) {
  const mem = document.createElement("div");
  mem.className = "memory";
  if (photo) {
    mem.innerHTML = `
      <button class="delete-btn" onclick="deletePhoto(${photo.id})">×</button>
      <img src="${photo.src}" />
      <div class="caption">${photo.caption}</div>
    `;
  } else {
    mem.innerHTML = `<div class="empty-slot"></div>`;
  }
  return mem;
}

window.deletePhoto = async function (id) {
  deleteId = id;
  document.getElementById("confirmModal").style.display = "flex";
};

window.confirmDelete = async function () {
  if (deleteId !== null) {
    await supabase.from("photos").delete().eq("id", deleteId);
    deleteId = null;
    await renderMemories();
  }
  closeModal();
};

window.closeModal = function () {
  document.getElementById("confirmModal").style.display = "none";
};

window.closeSuccessModal = function () {
  document.getElementById("successModal").style.display = "none";
};

window.changePage = function (delta) {
  const max = Math.floor((allPhotos.length - 1) / 8);
  currentPage = Math.min(Math.max(currentPage + delta, 0), max);
  renderMemories();
};

window.addEventListener("DOMContentLoaded", setupNavigation);
