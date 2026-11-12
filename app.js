"use strict";

/* =========================================================
   GreenLoop – Recycling Pickup Coordinator (client-side only)
   ========================================================= */

/* ---------- Data (student-created sample records) ---------- */
const MATERIALS = {
  paper:     { label: "Paper & newspaper", rate: 40 },
  cardboard: { label: "Cardboard",         rate: 30 },
  plastic:   { label: "Plastic bottles",   rate: 60 },
  glass:     { label: "Glass",             rate: 10 },
  metal:     { label: "Metal & cans",      rate: 120 },
  ewaste:    { label: "Small e-waste",     rate: 150 }
};

// booked = places already taken by other households (sample data)
const SLOTS = [
  { id: "S1", zone: "Satellite Town",     day: "Monday",    time: "09:00–11:00", materials: ["paper", "cardboard", "plastic"],        capacity: 8,  booked: 5, maxKg: 40 },
  { id: "S2", zone: "Satellite Town",     day: "Thursday",  time: "15:00–17:00", materials: ["glass", "metal", "plastic"],            capacity: 6,  booked: 6, maxKg: 50 },
  { id: "S3", zone: "Saddar",             day: "Tuesday",   time: "10:00–12:00", materials: ["paper", "cardboard", "metal", "ewaste"], capacity: 10, booked: 4, maxKg: 60 },
  { id: "S4", zone: "Bahria Town Phase 4", day: "Wednesday", time: "08:00–10:00", materials: ["plastic", "glass", "metal"],            capacity: 12, booked: 9, maxKg: 45 },
  { id: "S5", zone: "Chaklala Scheme III", day: "Friday",    time: "14:00–16:00", materials: ["paper", "plastic", "ewaste"],           capacity: 5,  booked: 2, maxKg: 30 },
  { id: "S6", zone: "Westridge",          day: "Saturday",  time: "09:30–11:30", materials: ["cardboard", "paper", "glass", "metal"],  capacity: 8,  booked: 7, maxKg: 55 },
  { id: "S7", zone: "Saddar",             day: "Saturday",  time: "16:00–18:00", materials: ["plastic", "glass", "ewaste"],           capacity: 6,  booked: 1, maxKg: 35 },
  { id: "S8", zone: "Bahria Town Phase 4", day: "Monday",    time: "17:00–19:00", materials: ["paper", "cardboard"],                   capacity: 10, booked: 3, maxKg: 40 }
];

const STORAGE_KEY = "greenloop-requests-v1";

/* ---------- State ---------- */
let requests = loadRequests();

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);

function loadRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveRequests() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(requests)); } catch (e) { /* storage blocked: keep in memory */ }
}

function getSlot(id) { return SLOTS.find((s) => s.id === id); }

function bookedCount(slot) {
  return slot.booked + requests.filter((r) => r.slotId === slot.id).length;
}

function spaceLeft(slot) { return Math.max(0, slot.capacity - bookedCount(slot)); }

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "text") node.textContent = v;
    else if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  });
  children.forEach((c) => node.append(c));
  return node;
}

function uniqueSorted(arr) { return [...new Set(arr)].sort(); }

function normalisePhone(p) { return p.replace(/-/g, ""); }

/* ---------- Populate selects / checkboxes ---------- */
function populateStaticControls() {
  const zones = uniqueSorted(SLOTS.map((s) => s.zone));
  zones.forEach((z) => {
    $("f-zone").append(new Option(z, z));
    $("r-zone").append(new Option(z, z));
  });
  Object.entries(MATERIALS).forEach(([key, m]) => {
    $("f-material").append(new Option(m.label, key));

    const id = "m-" + key;
    const input = el("input", { type: "checkbox", id, name: "materials", value: key });
    const label = el("label", { for: id, text: `${m.label} (Rs ${m.rate}/kg)` });
    $("material-options").append(el("div", { class: "check", "data-material": key }, [input, label]));
  });
}

/* =========================================================
   INTERACTION 1 – filter & search slots
   ========================================================= */
function getFilteredSlots() {
  const q = $("f-search").value.trim().toLowerCase();
  const zone = $("f-zone").value;
  const material = $("f-material").value;
  const day = $("f-day").value;
  const onlyAvail = $("f-available").checked;

  return SLOTS.filter((s) => {
    const text = [s.zone, s.day, s.time, ...s.materials.map((m) => MATERIALS[m].label)].join(" ").toLowerCase();
    if (q && !text.includes(q)) return false;
    if (zone && s.zone !== zone) return false;
    if (material && !s.materials.includes(material)) return false;
    if (day && s.day !== day) return false;
    if (onlyAvail && spaceLeft(s) === 0) return false;
    return true;
  });
}

function renderSlots() {
  const list = $("slot-list");
  const results = getFilteredSlots();
  list.replaceChildren();

  results.forEach((s) => {
    const left = spaceLeft(s);
    const full = left === 0;
    const pct = Math.min(100, Math.round((bookedCount(s) / s.capacity) * 100));

    const tags = el("ul", { class: "tags", "aria-label": "Accepted materials" },
      s.materials.map((m) => el("li", { class: "tag", text: MATERIALS[m].label })));

    const bar = el("div", { class: "bar" + (full ? " full" : ""), role: "presentation" }, [
      el("span", { style: `width:${pct}%` })
    ]);

    const capText = el("p", { class: "capacity" });
    capText.append(full ? el("span", { class: "badge-full", text: "Fully booked" })
                        : document.createTextNode(`${left} of ${s.capacity} places left`));

    const btn = el("button", { type: "button", class: "btn btn-small", "data-slot": s.id,
      text: full ? "Slot full" : "Request this slot" });
    if (full) btn.disabled = true;

    list.append(el("article", { class: "slot-card" }, [
      el("h3", { text: s.zone }),
      el("p", { class: "slot-meta", text: `${s.day}, ${s.time} · max ${s.maxKg} kg per request` }),
      tags, capText, bar, btn
    ]));
  });

  $("empty-slots").hidden = results.length !== 0;
  $("results-count").textContent =
    results.length === 0 ? "0 slots found." :
    `Showing ${results.length} of ${SLOTS.length} slots.`;
}

function resetFilters() {
  $("filter-form").reset();
  renderSlots();
}

/* =========================================================
   INTERACTION 2 – request form, live calculation, conflict check
   ========================================================= */
function updateSlotOptions() {
  const zone = $("r-zone").value;
  const select = $("r-slot");
  select.replaceChildren(new Option(zone ? "Choose a slot" : "Choose a zone first", ""));
  select.disabled = !zone;
  if (!zone) { updateSummary(); return; }

  SLOTS.filter((s) => s.zone === zone).forEach((s) => {
    const full = spaceLeft(s) === 0;
    const opt = new Option(`${s.day} ${s.time}${full ? " (full)" : ""}`, s.id);
    opt.disabled = full;
    select.append(opt);
  });
  updateSummary();
}

function getSelectedMaterials() {
  return [...document.querySelectorAll('input[name="materials"]:checked')].map((i) => i.value);
}

function calcCredit(materialKeys, weight) {
  if (!materialKeys.length || !(weight > 0)) return 0;
  const share = weight / materialKeys.length;
  return Math.round(materialKeys.reduce((sum, k) => sum + MATERIALS[k].rate * share, 0));
}

function updateSummary() {
  const slot = getSlot($("r-slot").value);
  const mats = getSelectedMaterials();
  const weight = parseFloat($("r-weight").value);

  $("s-slot").textContent = slot ? `${slot.zone}, ${slot.day} ${slot.time}` : "Not selected";
  $("s-space").textContent = slot ? `${spaceLeft(slot)} of ${slot.capacity}` : "–";
  $("s-max").textContent = slot ? `${slot.maxKg} kg` : "–";
  $("s-materials").textContent = mats.length ? mats.map((m) => MATERIALS[m].label).join(", ") : "None selected";
  $("s-credit").textContent = "Rs " + calcCredit(mats, weight);

  // Highlight materials the chosen slot does not accept
  document.querySelectorAll(".check").forEach((box) => {
    const key = box.dataset.material;
    box.classList.toggle("unsupported", !!slot && !slot.materials.includes(key));
  });
}

function validateRequest(data) {
  const errors = [];
  const slot = getSlot(data.slotId);

  if (data.name.length < 3) errors.push("Enter your full name (at least 3 characters).");
  if (!/^03\d{2}-?\d{7}$/.test(data.phone)) errors.push("Enter a valid mobile number like 0300-1234567.");
  if (data.address.length < 8) errors.push("Enter a pickup address of at least 8 characters.");
  if (!data.zone) errors.push("Choose a zone.");
  if (!slot) errors.push("Choose a pickup slot.");
  if (data.materials.length === 0) errors.push("Select at least one material.");
  if (!(data.weight >= 1 && data.weight <= 200)) errors.push("Estimated weight must be between 1 and 200 kg.");

  if (slot) {
    // Availability / conflict checks
    if (spaceLeft(slot) === 0) errors.push("That slot is fully booked. Pick another slot.");

    const rejected = data.materials.filter((m) => !slot.materials.includes(m));
    if (rejected.length) {
      errors.push(`This slot does not accept: ${rejected.map((m) => MATERIALS[m].label).join(", ")}.`);
    }

    if (data.weight > slot.maxKg) {
      errors.push(`Load of ${data.weight} kg is over this slot's limit of ${slot.maxKg} kg per request.`);
    }

    const phone = normalisePhone(data.phone);
    const dup = requests.find((r) => normalisePhone(r.phone) === phone && r.slotId === slot.id);
    if (dup) errors.push("You already have a request for this slot.");

    const sameDay = requests.find((r) => normalisePhone(r.phone) === phone && r.slotId !== slot.id && getSlot(r.slotId).day === slot.day);
    if (sameDay) errors.push(`Time clash: you already have a pickup booked on ${slot.day}.`);
  }
  return errors;
}

function showErrors(errors) {
  const box = $("form-errors");
  box.replaceChildren(el("strong", { text: "Please fix the following:" }),
    el("ul", {}, errors.map((e) => el("li", { text: e }))));
  box.hidden = false;
  box.focus();
}

function handleSubmit(event) {
  event.preventDefault();
  $("form-success").hidden = true;
  $("form-errors").hidden = true;

  const data = {
    name: $("r-name").value.trim(),
    phone: $("r-phone").value.trim(),
    address: $("r-address").value.trim(),
    zone: $("r-zone").value,
    slotId: $("r-slot").value,
    materials: getSelectedMaterials(),
    weight: parseFloat($("r-weight").value),
    notes: $("r-notes").value.trim()
  };

  const errors = validateRequest(data);
  if (errors.length) { showErrors(errors); return; }

  data.id = "R" + Date.now();
  data.credit = calcCredit(data.materials, data.weight);
  requests.push(data);
  saveRequests();

  $("request-form").reset();
  updateSlotOptions();
  updateSummary();
  renderSlots();
  renderRequests();

  const slot = getSlot(data.slotId);
  $("form-success").textContent =
    `Request confirmed for ${slot.zone}, ${slot.day} ${slot.time}. Estimated credit: Rs ${data.credit}.`;
  $("form-success").hidden = false;
}

/* ---------- My requests ---------- */
function renderRequests() {
  const list = $("request-list");
  list.replaceChildren();
  $("no-requests").hidden = requests.length !== 0;

  requests.forEach((r) => {
    const slot = getSlot(r.slotId);
    const info = el("div", {}, [
      el("p", {}, [el("strong", { text: `${slot.zone} · ${slot.day} ${slot.time}` })]),
      el("p", { text: `${r.name} · ${r.phone} · ${r.weight} kg` }),
      el("p", { class: "slot-meta", text: r.materials.map((m) => MATERIALS[m].label).join(", ") + ` · est. Rs ${r.credit}` })
    ]);
    const cancel = el("button", { type: "button", class: "btn btn-danger btn-small", "data-cancel": r.id,
      "aria-label": `Cancel request for ${slot.zone} on ${slot.day}`, text: "Cancel" });
    list.append(el("li", { class: "request-item" }, [info, cancel]));
  });
}

function cancelRequest(id) {
  requests = requests.filter((r) => r.id !== id);
  saveRequests();
  renderRequests();
  renderSlots();
  updateSlotOptions();
}

/* ---------- Custom validation messages ---------- */
function setupValidationMessages() {
  $("r-phone").addEventListener("input", (e) => {
    const input = e.target;
    input.setCustomValidity("");
    if (input.value && !input.validity.valid) input.setCustomValidity("Use the format 0300-1234567.");
  });
}

/* ---------- Wire up events ---------- */
function init() {
  populateStaticControls();
  setupValidationMessages();

  ["f-search", "f-zone", "f-material", "f-day", "f-available"].forEach((id) => {
    $(id).addEventListener(id === "f-search" ? "input" : "change", renderSlots);
  });
  $("filter-form").addEventListener("submit", (e) => e.preventDefault());
  $("f-reset").addEventListener("click", resetFilters);

  $("slot-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-slot]");
    if (!btn) return;
    const slot = getSlot(btn.dataset.slot);
    $("r-zone").value = slot.zone;
    updateSlotOptions();
    $("r-slot").value = slot.id;
    updateSummary();
    $("request").scrollIntoView();
    $("r-name").focus();
  });

  $("r-zone").addEventListener("change", updateSlotOptions);
  $("r-slot").addEventListener("change", updateSummary);
  $("r-weight").addEventListener("input", updateSummary);
  $("material-options").addEventListener("change", updateSummary);
  $("request-form").addEventListener("submit", handleSubmit);

  $("request-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cancel]");
    if (btn) cancelRequest(btn.dataset.cancel);
  });

  renderSlots();
  renderRequests();
  updateSummary();
}

document.addEventListener("DOMContentLoaded", init);
