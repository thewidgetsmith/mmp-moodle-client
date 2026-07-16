// Browser-side script for the Vault browsing demo. Only ever talks to this
// server's own same-origin `/api/*` endpoints -- it never sees a Moodle
// token, which stays on the server (see server.mjs).

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const form = document.getElementById("search-form");
const criterianameSelect = document.getElementById("criterianame");
const criteriavalueInput = document.getElementById("criteriavalue");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalVideoWrapper = document.getElementById("modal-video-wrapper");
const modalVideo = document.getElementById("modal-video");
const modalNoVideo = document.getElementById("modal-no-video");
const modalSummary = document.getElementById("modal-summary");
const modalTranscriptWrapper = document.getElementById("modal-transcript-wrapper");
const modalTranscript = document.getElementById("modal-transcript");
const modalClose = document.getElementById("modal-close");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const criterianame = criterianameSelect.value;
  const criteriavalue = criteriavalueInput.value.trim();
  if (criteriavalue) {
    loadCourses(criterianame, criteriavalue);
  }
});

async function loadCourses(criterianame, criteriavalue) {
  setStatus(`Searching Moodle (criterianame=${criterianame}, criteriavalue=${criteriavalue})...`);
  grid.replaceChildren();

  try {
    const response = await fetch(
      `/api/courses?criterianame=${encodeURIComponent(criterianame)}&criteriavalue=${encodeURIComponent(criteriavalue)}`,
    );
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Something went wrong.", true);
      return;
    }

    renderCards(data.courses);
    setStatus(`Found ${data.total} course(s).`);
  } catch (error) {
    setStatus(`Request failed: ${error.message}`, true);
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("status-error", isError);
}

function renderCards(cards) {
  grid.replaceChildren();

  if (cards.length === 0) {
    setStatus("No courses found.");
    return;
  }

  for (const card of cards) {
    grid.appendChild(buildCardElement(card));
  }
}

function buildCardElement(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "card";

  const img = document.createElement("img");
  img.className = "card-image";
  img.src = card.image ?? "";
  img.alt = "";
  button.appendChild(img);

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h3");
  title.textContent = card.title;
  body.appendChild(title);

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = [card.contentType, card.duration].filter(Boolean).join(" \u00b7 ");
  body.appendChild(badge);

  button.appendChild(body);
  button.addEventListener("click", () => openModal(card));

  return button;
}

async function openModal(card) {
  modalTitle.textContent = card.title;
  // Course summaries are admin-authored HTML (Moodle format `1`), so it's
  // safe to render directly -- this mirrors how a real frontend would treat
  // trusted CMS content.
  modalSummary.innerHTML = card.summaryHtml ?? "";
  modalVideoWrapper.hidden = true;
  modalNoVideo.hidden = true;
  modalTranscriptWrapper.hidden = true;
  modalVideo.src = "about:blank";
  modal.hidden = false;

  try {
    const response = await fetch(`/api/courses/${card.id}/contents`);
    const data = await response.json();

    if (!response.ok) {
      showModalNote(data.error ?? "Failed to load content.");
      return;
    }

    if (data.videoEmbedUrl) {
      modalVideo.src = data.videoEmbedUrl;
      modalVideoWrapper.hidden = false;
    } else {
      showModalNote("No video available for this card.");
    }

    if (data.transcriptUrl) {
      modalTranscript.href = data.transcriptUrl;
      modalTranscriptWrapper.hidden = false;
    }
  } catch (error) {
    showModalNote(`Failed to load content: ${error.message}`);
  }
}

function showModalNote(message) {
  modalNoVideo.textContent = message;
  modalNoVideo.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  modalVideo.src = "about:blank";
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});
