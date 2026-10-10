// Address of the FastAPI backend
const API_URL = "http://127.0.0.1:8000/api/opportunities";

// The nine fields that are sent to the API (id is created by the database)
const FIELDS = [
  "title",
  "description",
  "research_area",
  "faculty_name",
  "department",
  "required_skills",
  "available_positions",
  "application_deadline",
  "status",
];

// ---------- page elements ----------
const messageEl = document.getElementById("message");
const listEl = document.getElementById("list");
const detailsSection = document.getElementById("details-section");
const detailsEl = document.getElementById("details");
const form = document.getElementById("opportunity-form");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const lookupInput = document.getElementById("lookup-id");

let editingId = null; // null = creating, a number = updating that opportunity
let messageTimer = null;

// ---------- small helpers ----------
function field(name) {
  return document.getElementById("f_" + name);
}

function make(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text; // textContent keeps the page safe from injected HTML
  if (className) node.className = className;
  return node;
}

function makeButton(label, className, onClick) {
  const btn = make("button", label, className);
  btn.type = "button";
  btn.addEventListener("click", onClick);
  return btn;
}

function showMessage(text, type = "success") {
  messageEl.textContent = text;
  messageEl.className = "message " + type;
  messageEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    messageEl.className = "message hidden";
  }, 7000);
}

// One function for every call to the backend
async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(API_URL + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    // response had no JSON body
  }

  if (!response.ok) {
    let message = "Request failed (status " + response.status + ")";
    if (data && typeof data.detail === "string") message = data.detail;
    if (data && Array.isArray(data.errors)) {
      message += ": " + data.errors.map((e) => e.field + " - " + e.message).join("; ");
    }
    throw new Error(message);
  }
  return data;
}

// ---------- 1. display all opportunities ----------
function renderList(items) {
  listEl.innerHTML = "";

  if (items.length === 0) {
    const row = make("tr");
    const cell = make("td", "No research opportunities yet.");
    cell.colSpan = 8;
    row.appendChild(cell);
    listEl.appendChild(row);
    return;
  }

  items.forEach((item) => {
    const row = make("tr");

    [item.id, item.title, item.faculty_name, item.department, item.available_positions, item.application_deadline].forEach(
      (value) => row.appendChild(make("td", String(value)))
    );

    const statusCell = make("td");
    statusCell.appendChild(make("span", item.status, "badge " + item.status.toLowerCase()));
    row.appendChild(statusCell);

    const actions = make("td", "", "actions");
    actions.appendChild(makeButton("View", "btn small", () => viewDetails(item.id)));
    actions.appendChild(makeButton("Edit", "btn small", () => startEdit(item.id)));

    const closeBtn = makeButton("Close", "btn small warn", () => closeOpportunity(item.id));
    closeBtn.disabled = item.status === "Closed";
    actions.appendChild(closeBtn);

    actions.appendChild(makeButton("Delete", "btn small danger", () => deleteOpportunity(item.id)));
    row.appendChild(actions);

    listEl.appendChild(row);
  });
}

async function loadOpportunities() {
  try {
    renderList(await api(""));
  } catch (err) {
    showMessage(err.message, "error");
  }
}

// ---------- 2. display details of one opportunity ----------
function showDetails(item) {
  detailsEl.innerHTML = "";
  const rows = [
    ["ID", item.id],
    ["Title", item.title],
    ["Description", item.description],
    ["Research area", item.research_area],
    ["Faculty member", item.faculty_name],
    ["Department", item.department],
    ["Required skills", item.required_skills],
    ["Available positions", item.available_positions],
    ["Application deadline", item.application_deadline],
    ["Status", item.status],
  ];
  const list = make("dl");
  rows.forEach(([label, value]) => {
    list.appendChild(make("dt", label));
    list.appendChild(make("dd", String(value)));
  });
  detailsEl.appendChild(list);
  detailsSection.classList.remove("hidden");
  detailsSection.scrollIntoView({ behavior: "smooth" });
}

async function viewDetails(id) {
  try {
    showDetails(await api("/" + id));
  } catch (err) {
    showMessage(err.message, "error");
  }
}

// ---------- form: read, validate ----------
function getFormData() {
  const data = {};
  FIELDS.forEach((name) => {
    data[name] = field(name).value.trim();
  });
  data.available_positions = data.available_positions === "" ? null : Number(data.available_positions);
  return data;
}

function validate(data) {
  const problems = [];
  document.querySelectorAll(".invalid").forEach((node) => node.classList.remove("invalid"));

  function fail(name, text) {
    problems.push(text);
    field(name).classList.add("invalid");
  }

  if (data.title.length < 5) fail("title", "Title must be at least 5 characters.");
  if (data.description.length < 10) fail("description", "Description must be at least 10 characters.");
  if (data.research_area.length < 2) fail("research_area", "Research area is required.");
  if (data.faculty_name.length < 2) fail("faculty_name", "Faculty name is required.");
  if (data.department.length < 2) fail("department", "Department is required.");
  if (data.required_skills.length < 2) fail("required_skills", "Required skills are required.");
  if (!Number.isInteger(data.available_positions) || data.available_positions < 1 || data.available_positions > 100) {
    fail("available_positions", "Available positions must be a whole number from 1 to 100.");
  }
  if (!data.application_deadline) fail("application_deadline", "Application deadline is required.");

  return problems;
}

function resetForm() {
  form.reset();
  document.querySelectorAll(".invalid").forEach((node) => node.classList.remove("invalid"));
  editingId = null;
  formTitle.textContent = "Add New Opportunity";
  submitBtn.textContent = "Create Opportunity";
  cancelBtn.classList.add("hidden");
}

// ---------- 3 and 4. create or update ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = getFormData();
  const problems = validate(data);
  if (problems.length > 0) {
    showMessage(problems.join(" "), "error");
    return;
  }

  try {
    if (editingId === null) {
      await api("", { method: "POST", body: JSON.stringify(data) });
      showMessage("Research opportunity created successfully.");
    } else {
      await api("/" + editingId, { method: "PUT", body: JSON.stringify(data) });
      showMessage("Research opportunity updated successfully.");
    }
    resetForm();
    await loadOpportunities();
  } catch (err) {
    showMessage(err.message, "error");
  }
});

async function startEdit(id) {
  try {
    const item = await api("/" + id);
    FIELDS.forEach((name) => {
      field(name).value = item[name];
    });
    editingId = id;
    formTitle.textContent = "Update Opportunity #" + id;
    submitBtn.textContent = "Save Changes";
    cancelBtn.classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showMessage(err.message, "error");
  }
}

// ---------- 5. change status from Open to Closed ----------
async function closeOpportunity(id) {
  if (!confirm("Close opportunity #" + id + "?")) return;
  try {
    const item = await api("/" + id);
    const payload = {};
    FIELDS.forEach((name) => {
      payload[name] = item[name];
    });
    payload.status = "Closed";
    await api("/" + id, { method: "PUT", body: JSON.stringify(payload) });
    showMessage("Opportunity #" + id + " is now Closed.");
    await loadOpportunities();
  } catch (err) {
    showMessage(err.message, "error");
  }
}

// ---------- 6. delete ----------
async function deleteOpportunity(id) {
  if (!confirm("Delete opportunity #" + id + "? This cannot be undone.")) return;
  try {
    const result = await api("/" + id, { method: "DELETE" });
    showMessage(result.message);
    detailsSection.classList.add("hidden");
    if (editingId === id) resetForm();
    await loadOpportunities();
  } catch (err) {
    showMessage(err.message, "error");
  }
}

// ---------- buttons ----------
document.getElementById("refresh-btn").addEventListener("click", loadOpportunities);
document.getElementById("hide-details-btn").addEventListener("click", () => detailsSection.classList.add("hidden"));
cancelBtn.addEventListener("click", resetForm);
document.getElementById("lookup-btn").addEventListener("click", () => {
  const id = Number(lookupInput.value);
  if (!Number.isInteger(id) || id < 1) {
    showMessage("Please enter a valid opportunity ID.", "error");
    return;
  }
  viewDetails(id); // an ID that does not exist shows the 404 message
});

// ---------- start ----------
loadOpportunities();