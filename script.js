<script src="https://widget.cloudinary.com/v2.0/global/all.js" type="text/javascript"></script>
<script>
const cloudName = "djioitxex";
const uploadPreset = "our_scrapbook";
const folderName = "scrapbook";

let photos = [];
let currentPage = 0;
let deleteIndex = null;

function goToPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`${page}-page`).classList.remove('hidden');
  if (page === 'memories') loadPhotosFromCloudinary();
}

function openUploadWidget() {
  cloudinary.openUploadWidget({
    cloudName: cloudName,
    uploadPreset: uploadPreset,
    sources: ['local', 'url', 'camera'],
    multiple: false,
    folder: folderName,
    cropping: false,
    resourceType: 'image',
    maxFileSize: 2000000,
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif']
  }, function (error, result) {
    if (!error && result && result.event === "success") {
      const uploadedUrl = result.info.secure_url;
      const captionInput = document.getElementById("captionInput");
      const note = document.getElementById("upload-note");

      const photo = {
        src: uploadedUrl,
        caption: captionInput.value.trim()
      };

      photos.push(photo);
      captionInput.value = "";
      if (photos.length >= 4) note.style.display = "none";
      else note.style.display = "block";

      renderMemories();
      document.getElementById('successModal').style.display = 'flex';
    }
  });
}

async function loadPhotosFromCloudinary() {
  const book = document.getElementById('book');
  const noPhotoMsg = document.getElementById('no-photo');
  const res = await fetch(`https://res.cloudinary.com/${cloudName}/image/list/${folderName}.json`);
  
  if (!res.ok) {
    console.error("Failed to load Cloudinary images");
    noPhotoMsg.style.display = 'block';
    book.innerHTML = '';
    return;
  }

  const data = await res.json();
  photos = data.resources.map(resource => ({
    src: `https://res.cloudinary.com/${cloudName}/image/upload/${resource.public_id}.jpg`,
    caption: '' // captions can't be stored in Cloudinary by default
  }));

  if (photos.length === 0) {
    noPhotoMsg.style.display = 'block';
    book.innerHTML = '';
    return;
  }

  noPhotoMsg.style.display = 'none';
  renderMemories();
}

function renderMemories() {
  const book = document.getElementById('book');
  const start = currentPage * 8;
  const spread = photos.slice(start, start + 8);
  const paddedSpread = [...spread];
  while (paddedSpread.length < 8) paddedSpread.push(null);

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
      mem.innerHTML = `<img src="${p.src}"><div class="caption">${p.caption || ''}</div>`;
    } else {
      mem.innerHTML = `<div class="empty-slot"></div>`;
    }
    leftPage.appendChild(mem);
  });

  right.forEach((p, i) => {
    const mem = document.createElement('div');
    mem.className = 'memory';
    if (p) {
      mem.innerHTML = `<img src="${p.src}"><div class="caption">${p.caption || ''}</div>`;
    } else {
      mem.innerHTML = `<div class="empty-slot"></div>`;
    }
    rightPage.appendChild(mem);
  });

  book.appendChild(leftPage);
  book.appendChild(rightPage);
}

function changePage(delta) {
  const maxPage = Math.floor((photos.length - 1) / 8);
  currentPage = Math.min(Math.max(currentPage + delta, 0), maxPage);
  renderMemories();
}

function closeSuccessModal() {
  document.getElementById('successModal').style.display = 'none';
}
</script>
