let paymentsData = [];
let filteredPayments = [];
let lastUpdated = null;
let selectedPayment = null;

const paymentsList = document.getElementById("paymentsList");
const totalSumEl = document.getElementById("totalSum");
const updatedAtEl = document.getElementById("updatedAt");
const dialog = document.getElementById("dialog");
const dialogText = document.getElementById("dialogText");
const paymentsCountBadge = document.getElementById("paymentsCountBadge");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

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
  dialogText.innerText = `Провести платёж "${row["Название"]}" на сумму ${row["Сумма"]}?`;
  dialog.style.display = "block";
}

function closeDialog() {
  dialog.style.display = "none";
  selectedPayment = null;
}

function showNotification(message, type = "info", duration = 3000) {
  // Создаём или обновляем overlay
  let overlay = document.getElementById("notification-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "notification-overlay";
    document.body.appendChild(overlay);
  }
  overlay.style.display = "block";

  // Создаём или обновляем уведомление
  let notif = document.getElementById("notification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "notification";
    document.body.appendChild(notif);
  }
  notif.className = "show" + (type === "error" ? " error" : "");
  notif.textContent = message;

  // Показываем уведомление
  notif.style.opacity = "1";
  notif.style.pointerEvents = "auto";

  // Длительность показа (по умолчанию 3 сек, для ошибок 4.5 сек, для статуса 2 сек)
  let showTime = duration;
  if (type === "error") showTime = 4500;
  if (type === "status") showTime = 2000;

  // Скрываем через showTime
  setTimeout(() => {
    notif.style.opacity = "0";
    notif.style.pointerEvents = "none";
    overlay.style.display = "none";
  }, showTime);
}


function confirmPayment() {
  if (!selectedPayment) {
    showNotification("Ошибка: платеж не выбран", "error", 4500);
    console.error("Платёж не выбран");
    return;
  }

  const payload = {
    invoice_id: selectedPayment["№"],
    amount: selectedPayment["Сумма"]
  };

  console.log("Отправка платежа:", payload);
  showNotification("Отправка платежа...", "status", 2000);

  fetch("https://fastapi-myapp-production.up.railway.app/update_invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
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
    console.log("Данные от сервера:", data);
    showNotification(`Платёж "${selectedPayment["Название"]}" на сумму ${selectedPayment["Сумма"]} успешно проведён.`, "info", 4000);
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




// События для поиска
searchInput.addEventListener("input", filterPayments);
clearSearchBtn.addEventListener("click", clearSearch);

// Первая загрузка
fetchPayments();
