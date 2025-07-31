import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ufmmufpulqyhvzvbiipo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbW11ZnB1bHF5aHZ6dmJpaXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODAwOTEsImV4cCI6MjA2OTQ1NjA5MX0.RfIlSotJtY5xDRytZag60mYYxF6mR8hnklQwzUR9eY0';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentPage = 0;
let allPhotos = [];
let deleteId = null;

function goToPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`${page}-page`).classList.remove('hidden');

  if (page === 'memories') {
    currentPage = 0;
    renderMemories();
  }
}

async function savePhoto() {
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
    if (!data.secure_url) {
      alert("Image upload failed.");
      return;
    }

    const photo = {
      src: data.secure_url,
      caption: captionInput.value.trim()
    };

    const { error } = await supabase.from("photos").insert([photo]);
    if (error) {
      alert("Saving to Supabase failed.");
      console.error("Supabase insert error:", error);
      return;
    }

    captionInput.value = "";
    photoInput.value = "";
    document.getElementById('successModal').style.display = 'flex';

    setTimeout(() => {
      document.getElementById('successModal').style.display = 'none';
      goToPage('memories');
    }, 1500);

  } catch (err) {
    alert("Upload failed.");
    console.error("Upload error:", err);
  }
}

async function renderMemories() {
  const { data, error } = await supabase.from("photos").select("*").order("id", { ascending: true });
  if (error) {
    console.error("Error loading photos:", error);
    alert("Could not load memories.");
    return;
  }

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

  if (photo && photo.src) {
    mem.innerHTML = `
      <button class="delete-btn" data-id="${photo.id}">×</button>
      <img src="${photo.src}" alt="Memory image" />
      <div class="caption-container">
        <div class="caption" data-id="${photo.id}" contenteditable="false">${photo.caption}</div>
        <button class="edit-btn" data-id="${photo.id}"></button>
        <button class="save-caption-btn hidden" data-id="${photo.id}"></button>
      </div>
    `;
  } else {
    mem.innerHTML = `<div class="empty-slot"></div>`;
  }

  return mem;
}

function deletePhoto(id) {
  deleteId = id;
  document.getElementById("confirmModal").style.display = "flex";
}

async function confirmDelete() {
  if (deleteId !== null) {
    await supabase.from("photos").delete().eq("id", deleteId);
    deleteId = null;
    renderMemories();
  }
  closeModal();
}

function closeModal() {
  document.getElementById("confirmModal").style.display = "none";
}

function closeSuccessModal() {
  document.getElementById("successModal").style.display = "none";
}

function changePage(delta) {
  const max = Math.floor((allPhotos.length - 1) / 8);
  currentPage = Math.min(Math.max(currentPage + delta, 0), max);
  renderMemories();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => goToPage('cover'));
  });

  document.getElementById('save-btn')?.addEventListener('click', savePhoto);
  document.getElementById('upload-btn')?.addEventListener('click', () => goToPage('upload'));
  document.getElementById('memories-btn')?.addEventListener('click', () => goToPage('memories'));
  document.getElementById('prevPage')?.addEventListener('click', () => changePage(-1));
  document.getElementById('nextPage')?.addEventListener('click', () => changePage(1));

  document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeModal);
  document.getElementById('successOkayBtn')?.addEventListener('click', closeSuccessModal);
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
});

// Event delegation for dynamic elements
document.addEventListener('click', async e => {
  const delBtn = e.target.closest('.delete-btn');
  const editBtn = e.target.closest('.edit-btn');
  const saveBtn = e.target.closest('.save-caption-btn');

  if (delBtn) {
    const id = delBtn.dataset.id;
    deletePhoto(id);
  }

  if (editBtn) {
    const id = editBtn.dataset.id;
    const captionDiv = document.querySelector(`.caption[data-id="${id}"]`);
    const saveButton = document.querySelector(`.save-caption-btn[data-id="${id}"]`);
    captionDiv.contentEditable = true;
    captionDiv.focus();
    saveButton.classList.remove("hidden");
    editBtn.classList.add("hidden");
  }

  if (saveBtn) {
    const id = saveBtn.dataset.id;
    const captionDiv = document.querySelector(`.caption[data-id="${id}"]`);
    const newCaption = captionDiv.innerText.trim();

    const { error } = await supabase.from("photos").update({ caption: newCaption }).eq("id", id);
    if (error) {
      alert("Failed to update caption.");
      return;
    }

    captionDiv.contentEditable = false;
    saveBtn.classList.add("hidden");
    document.querySelector(`.edit-btn[data-id="${id}"]`).classList.remove("hidden");
  }
});
