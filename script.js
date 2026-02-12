// script.js - manejo de reservas con persistencia en localStorage
const KEY = "reservas_hotel_v1";

const form = document.getElementById("reservaForm");
const listaReservasEl = document.getElementById("listaReservas");
const emptyMessage = document.getElementById("emptyMessage");
const btnNew = document.getElementById("btnNew");
const btnCancel = document.getElementById("btnCancel");

let reservas = [];
let editandoId = null;

// cargar al inicio
document.addEventListener("DOMContentLoaded", () => {
  cargarReservas();
  renderReservas();
});

// abrir formulario con nuevo
btnNew.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  limpiarFormulario();
  document.getElementById("nombre").focus();
});

// cancelar edición
btnCancel.addEventListener("click", (e) => {
  e.preventDefault();
  limpiarFormulario();
});

// submit (crear / editar)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = leerFormulario();
  if (!validarFechas(datos.fechaEntrada, datos.fechaSalida)) return;

  if (editandoId) {
    actualizarReserva(editandoId, datos);
  } else {
    crearReserva(datos);
  }
  guardarReservas();
  renderReservas();
  limpiarFormulario();
});

/* --------- LOGICA CRUD --------- */
function crearReserva(datos) {
  const nueva = {
    id: Date.now(),
    ...datos
  };
  reservas.push(nueva);
}

function actualizarReserva(id, datos) {
  reservas = reservas.map(r => (r.id === id ? { id, ...datos } : r));
  editandoId = null;
}

function eliminarReserva(id) {
  if (!confirm("¿Confirmas eliminar esta reserva?")) return;
  reservas = reservas.filter(r => r.id !== id);
  guardarReservas();
  renderReservas();
}

function editarReserva(id) {
  const r = reservas.find(x => x.id === id);
  if (!r) return;
  document.getElementById("idReserva").value = r.id;
  document.getElementById("nombre").value = r.nombre;
  document.getElementById("fechaEntrada").value = r.fechaEntrada;
  document.getElementById("fechaSalida").value = r.fechaSalida;
  document.getElementById("tipoHabitacion").value = r.tipoHabitacion;
  document.getElementById("adultos").value = r.adultos || 1;
  document.getElementById("ninos").value = r.ninos || 0;
  document.getElementById("notas").value = r.notas || "";
  editandoId = r.id;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* --------- RENDER --------- */
function renderReservas() {
  listaReservasEl.innerHTML = "";
  if (!reservas.length) {
    emptyMessage.style.display = "block";
    return;
  } else {
    emptyMessage.style.display = "none";
  }

  // ordenar por fecha de entrada (asc)
  reservas.sort((a,b) => new Date(a.fechaEntrada) - new Date(b.fechaEntrada));

  reservas.forEach(r => {
    const li = document.createElement("li");
    li.className = "item";

    const left = document.createElement("div");
    left.className = "item-left";
    left.innerHTML = `
      <div>
        <p class="item-title">${escapeHtml(r.nombre)} — <span style="font-weight:600">${escapeHtml(r.tipoHabitacion)}</span></p>
        <p class="item-meta">${formatDate(r.fechaEntrada)} → ${formatDate(r.fechaSalida)} · ${r.adultos} adulto(s) · ${r.ninos} niño(s)</p>
        ${r.notas ? `<p class="item-meta">Notas: ${escapeHtml(r.notas)}</p>` : ""}
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const btnE = document.createElement("button");
    btnE.className = "action-btn action-edit";
    btnE.textContent = "Editar";
    btnE.onclick = () => editarReserva(r.id);

    const btnD = document.createElement("button");
    btnD.className = "action-btn action-delete";
    btnD.textContent = "Eliminar";
    btnD.onclick = () => eliminarReserva(r.id);

    actions.appendChild(btnE);
    actions.appendChild(btnD);

    li.appendChild(left);
    li.appendChild(actions);
    listaReservasEl.appendChild(li);
  });
}

/* --------- STORAGE --------- */
function guardarReservas() {
  localStorage.setItem(KEY, JSON.stringify(reservas));
}

function cargarReservas() {
  const raw = localStorage.getItem(KEY);
  reservas = raw ? JSON.parse(raw) : [];
}

/* --------- UTIL --------- */
function leerFormulario() {
  return {
    nombre: document.getElementById("nombre").value.trim(),
    fechaEntrada: document.getElementById("fechaEntrada").value,
    fechaSalida: document.getElementById("fechaSalida").value,
    tipoHabitacion: document.getElementById("tipoHabitacion").value,
    adultos: parseInt(document.getElementById("adultos").value, 10) || 1,
    ninos: parseInt(document.getElementById("ninos").value, 10) || 0,
    notas: document.getElementById("notas").value.trim()
  };
}

function limpiarFormulario() {
  form.reset();
  document.getElementById("idReserva").value = "";
  editandoId = null;
}

function validarFechas(entrada, salida) {
  if (!entrada || !salida) {
    alert("Por favor selecciona fecha de entrada y salida.");
    return false;
  }
  const e = new Date(entrada);
  const s = new Date(salida);
  if (s <= e) {
    alert("La fecha de salida debe ser posterior a la fecha de entrada.");
    return false;
  }
  return true;
}

function formatDate(str) {
  if (!str) return "";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString();
}

// simple escape para evitar inyección de HTML en la UI
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
