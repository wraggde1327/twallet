let paymentsData = [];
let filteredPayments = [];
let lastUpdated = null;
let selectedPayment = null;
let isEditing = false;
let editInput = null;

const paymentsList = document.getElementById("paymentsList");
const totalSumEl = document.getElementById("totalSum");
const updatedAtEl = document.getElementById("updatedAt");
const dialog = document.getElementById("dialog");
const dialogText = document.getElementById("dialogText");
const paymentsCountBadge = document.getElementById("paymentsCountBadge");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const dialogButtons = document.getElementById("dialog-buttons");
const buttons = dialogButtons.getElementsByTagName("button"); // [0] Да, [1] Изменить, [2] Нет

// Загрузка данных
function fetchPayments() {
  updatedAtEl.textContent = "Обновление...";
  fetch("https://fastapi-myapp-production.up.railway.app/pending")
    .then(res => res.json())
    .then(data => {
      paymentsData = data;
      lastUpdated = new Date();
      filteredPayments = paymentsData; // Изначально без фильтра
      renderPayments();
    })
    .catch(err => {
      paymentsList.innerHTML = "<p style='color:red; padding:12px;'>Ошибка загрузки данных</p>";
      totalSumEl.textContent = "Общая сумма: 0";
      updatedAtEl.textContent = "Обновлено: —";
      paymentsCountBadge.textContent = "0";
      console.error("Ошибка загрузки данных:", err);
    });
}

// Фильтрация по названию
function filterPayments() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    filteredPayments = paymentsData;
  } else {
    filteredPayments = paymentsData.filter(p =>
      p["Название"].toLowerCase().startsWith(query)
    );
  }
  renderPayments();
}

// Сброс поиска
function clearSearch() {
  searchInput.value = "";
  filteredPayments = paymentsData;
  renderPayments();
}

// Рендер платежей (используем filteredPayments)
function renderPayments() {
  if (!filteredPayments.length) {
    paymentsList.innerHTML = "<p style='padding: 12px; color: #999;'>Нет ожидающих платежей.</p>";
    totalSumEl.textContent = "Общая сумма: 0";
    updatedAtEl.textContent = lastUpdated
      ? "Обновлено: " + lastUpdated.toLocaleTimeString("ru-RU")
      : "Обновлено: —";
    paymentsCountBadge.textContent = "0";
    return;
  }

  let sum = 0;
  paymentsList.innerHTML = "";

  filteredPayments.forEach((row, idx) => {
    const div = document.createElement("div");
    div.className = "payment-row";
    div.tabIndex = 0;
    div.setAttribute("role", "row");
    div.setAttribute(
      "aria-label",
      `Платёж ${row["Название"]} №${row["№"]}, сумма ${row["Сумма"]}, статус ${row["Статус"]}`
    );

    // Форматируем дату
    let formattedDate = "—";
    if (row["Дата"]) {
      const dateObj = new Date(row["Дата"]);
      if (!isNaN(dateObj)) {
        formattedDate = dateObj.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      }
    }

    div.innerHTML = `
      <div role="cell">${row["№"] ?? idx + 1}</div>
      <div role="cell">${row["Название"] ?? "—"}</div>
      <div role="cell">${row["Тип"] ?? "—"}</div>
      <div role="cell">${formattedDate}</div>
      <div role="cell">${row["Сумма"] ?? "—"}</div>
      <div role="cell" class="status ${row["Статус"]?.toLowerCase().trim() === "ожидает" ? "ожидает" : ""}">${row["Статус"] ?? "—"}</div>
    `;

    div.addEventListener("click", () => openDialog(row));
    paymentsList.appendChild(div);

    if (row["Статус"]?.toLowerCase().trim() === "ожидает") {
      sum += +row["Сумма"];
    }
  });

  totalSumEl.textContent = "Общая сумма: " + sum.toLocaleString("ru-RU");
  updatedAtEl.textContent = "Обновлено: " + lastUpdated.toLocaleTimeString("ru-RU");
  paymentsCountBadge.textContent = filteredPayments.length.toString();
}

function openDialog(row) {
  selectedPayment = row;
  isEditing = false;

  dialogText.innerHTML = `Провести платёж "<strong>${row["Название"]}</strong>" на сумму <strong>${row["Сумма"]}</strong>?`;

  // Удаляем input если был
  if (editInput) {
    editInput.remove();
    editInput = null;
  }

  // Показываем все кнопки
  buttons[0].style.display = "inline-block"; // Да
  buttons[1].style.display = "inline-block"; // Изменить
  buttons[2].style.display = "inline-block"; // Нет

  dialog.style.display = "block";
}

function startEdit() {
  if (isEditing) return;
  isEditing = true;

  dialogText.innerHTML = `Изменить сумму платежа "<strong>${selectedPayment["Название"]}</strong>"? Введите новую сумму:`;

  editInput = document.createElement("input");
  editInput.type = "number";
  editInput.min = "0";
  editInput.value = selectedPayment["Сумма"];
  editInput.style.width = "100%";
  editInput.style.padding = "8px 12px";
  editInput.style.fontSize = "16px";
  editInput.style.marginTop = "12px";
  editInput.style.borderRadius = "8px";
  editInput.style.border = "1.5px solid #ccc";
  editInput.autofocus = true;

  dialogText.appendChild(editInput);

  // Скрываем кнопку "Изменить"
  buttons[1].style.display = "none";
}

function confirmPayment() {
  if (!selectedPayment) {
    showNotification("Ошибка: платеж не выбран", "error", 4500);
    console.error("Платёж не выбран");
    return;
  }

  let amountToSend = selectedPayment["Сумма"];

  if (isEditing) {
    if (!editInput) {
      alert("Ошибка: поле ввода суммы не найдено.");
      return;
    }
    const val = parseFloat(editInput.value);
    if (isNaN(val) || val <= 0) {
      alert("Введите корректную сумму больше 0.");
      return;
    }
    amountToSend = val;
  }

  const payload = {
    invoice_id: selectedPayment["№"],
    amount: amountToSend
  };

  console.log("Отправка платежа:", payload);
  showNotification("Отправка платежа...", "status", 2000);

  fetch("https://fastapi-myapp-production.up.railway.app/update_invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(response => {
      console.log("Ответ сервера:", response);
      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      showNotification(`Платёж "${selectedPayment["Название"]}" на сумму ${amountToSend} успешно проведён.`, "info", 4000);

      // Обновляем локальные данные
      if (isEditing) {
        const idx = paymentsData.findIndex(p => p["№"] === selectedPayment["№"]);
        if (idx !== -1) paymentsData[idx]["Сумма"] = amountToSend;
      }

      // Удаляем платёж из массива
      paymentsData = paymentsData.filter(p => p !== selectedPayment);

      filterPayments();
      closeDialog();
    })
    .catch(error => {
      console.error("Ошибка при отправке платежа:", error);
      showNotification(`Ошибка при отправке платежа: ${error.message}`, "error", 5000);
      closeDialog();
    });
}

function closeDialog() {
  dialog.style.display = "none";
  selectedPayment = null;
  isEditing = false;

  // Показываем кнопку "Изменить" если скрыта
  buttons[1].style.display = "inline-block";

  if (editInput) {
    editInput.remove();
    editInput = null;
  }
}

// Уведомления
function showNotification(message, type = "info", duration = 2000) {
  let overlay = document.getElementById("notification-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "notification-overlay";
    document.body.appendChild(overlay);
  }
  overlay.style.display = "block";

  let notif = document.getElementById("notification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "notification";
    document.body.appendChild(notif);
  }
  notif.className = "show" + (type === "error" ? " error" : "");
  notif.textContent = message;

  notif.style.opacity = "1";
  notif.style.pointerEvents = "auto";

  let showTime = duration;
  if (type === "error") showTime = 4500;
  if (type === "status") showTime = 1000;

  setTimeout(() => {
    notif.style.opacity = "0";
    notif.style.pointerEvents = "none";
    overlay.style.display = "none";
  }, showTime);
}

// События для поиска
searchInput.addEventListener("input", filterPayments);
clearSearchBtn.addEventListener("click", clearSearch);

// Кнопка "Изменить" по индексу 1
buttons[1].addEventListener("click", startEdit);

// Первая загрузка
fetchPayments();
