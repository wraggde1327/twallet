// --- Переменные и DOM-элементы ---
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
const dialogOverlay = document.getElementById("dialog-overlay");
const dialogButtons = document.getElementById("dialog-buttons");
const buttons = dialogButtons.getElementsByTagName("button"); // [0] Да, [1] Изменить, [2] Нет

// --- Telegram Web App интеграция ---
const tgUserInfoDiv = document.getElementById('tgUserInfo');
let tgUserLabel = '';
let tgUserId = null;
let tgUserObj = null;

const tg = window.Telegram?.WebApp;

if (tg) {
  document.body.classList.add('telegram-webapp');
  tg.ready();

  const user = tg.initDataUnsafe?.user;
  if (user) {
    tgUserObj = user;
    tgUserId = user.id;
    tgUserLabel = user.username ? '@' + user.username : 'ID: ' + user.id;

    if (tgUserInfoDiv) {
      tgUserInfoDiv.textContent = tgUserLabel;
      tgUserInfoDiv.title = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    }
  }
}

// --- Приветственный экран с проверкой Telegram никнейма ---
document.addEventListener('DOMContentLoaded', () => {
  // Массив разрешённых никнеймов
  const allowedNicks = ['nick_xnm', 'jekminaev', '123', 'user'];

  // Получение ника из Telegram WebApp API, если доступен
  let telegramNick = null;
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
    telegramNick = window.Telegram.WebApp.initDataUnsafe.user?.username || null;
  }

  // Для теста можно раскомментировать и задать ник вручную
  // telegramNick = 'user1';

  const welcomeScreen = document.getElementById('welcome-screen');
  const mainContent = document.querySelector('.container');
  const greetingBlock = document.getElementById('greeting');
  const nicknameInputBlock = document.getElementById('nickname-input');
  const userNickSpan = document.getElementById('user-nick');
  const continueBtn = document.getElementById('continue-btn');
  const submitNickBtn = document.getElementById('submit-nick-btn');
  const nicknameField = document.getElementById('nickname-field');
  const errorMsg = document.getElementById('error-msg');

  function showMainContent() {
    welcomeScreen.style.display = 'none';
    mainContent.style.filter = 'none';
  }

  function showGreeting(nick) {
    userNickSpan.textContent = '@' + nick;
    greetingBlock.style.display = 'block';
    nicknameInputBlock.style.display = 'none';
  }

  function showNicknameInput() {
    greetingBlock.style.display = 'none';
    nicknameInputBlock.style.display = 'block';
  }

  // Затемнение основного контента пока приветствие активно
  mainContent.style.filter = 'blur(3px)';

  if (telegramNick && allowedNicks.includes(telegramNick.toLowerCase())) {
    showGreeting(telegramNick);
  } else {
    showNicknameInput();
  }

  continueBtn.addEventListener('click', () => {
    showMainContent();
  });

  submitNickBtn.addEventListener('click', () => {
    const enteredNick = nicknameField.value.trim().toLowerCase();
    if (allowedNicks.includes(enteredNick)) {
      showGreeting(enteredNick);
      errorMsg.style.display = 'none';
    } else {
      errorMsg.style.display = 'block';
    }
  });

  nicknameField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      submitNickBtn.click();
    }
  });
});

// --- Переключение вкладок ---

document.addEventListener('DOMContentLoaded', () => {
  const tabs = {
    payments: document.getElementById('paymentsTab'),
    invoice: document.getElementById('invoiceTab'),
    contract: document.getElementById('contractTab'),
  };

  const contents = {
    payments: document.getElementById('paymentsContent'),
    invoice: document.getElementById('invoiceContent'),
    contract: document.getElementById('contractContent'),
  };

  function showTab(tabName) {
    // Скрываем все
    Object.values(contents).forEach(c => c.style.display = 'none');
    Object.values(tabs).forEach(t => t.classList.remove('active'));

    // Показываем выбранную
    contents[tabName].style.display = 'block';
    tabs[tabName].classList.add('active');
  }

  // Обработчики кликов
  tabs.payments.addEventListener('click', () => showTab('payments'));
  tabs.invoice.addEventListener('click', () => showTab('invoice'));
  tabs.contract.addEventListener('click', () => showTab('contract'));

  // Показываем первую вкладку по умолчанию
  showTab('payments');
});

// Загрузка данных
function fetchPayments() {
  updatedAtEl.textContent = "Обновление...";
  fetch("https://fastapi-myapp-production.up.railway.app/pending")
    .then(res => res.json())
    .then(data => {
      paymentsData = data;
      lastUpdated = new Date();
      filteredPayments = paymentsData;
      renderPayments();
    })
    .catch(err => {
      paymentsList.innerHTML = "<p style='color:red; padding:12px;'>Ошибка загрузки данных</p>";
      totalSumEl.textContent = "Общая сумма: 0";
      updatedAtEl.textContent = "Обновлено: —";
      paymentsCountBadge.textContent = "0";
      showNotification("Ошибка загрузки данных. Проверьте соединение.", "error", 5000);
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

// Рендер платежей
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

    function isMobile() {
  return window.innerWidth <= 1000;
}
    // Формируем класс для статуса
    const statusClass = `status ${row["Статус"]?.toLowerCase().trim() === "ожидает" ? "await" : ""}`;


    div.innerHTML = `
      <div role="cell">${row["№"] ?? idx + 1}</div>
      <div role="cell">${row["Название"] ?? "—"}</div>
      <div role="cell" class="hidden">${row["Тип"] ?? "—"}</div>
      <div role="cell">${formattedDate}</div>
      <div role="cell">${row["Сумма"] ?? "—"}</div>
      <div role="cell" class="${statusClass}">${row["Статус"] ?? "—"}</div>
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

// Открыть диалог
function openDialog(row) {
  selectedPayment = row;
  isEditing = false;

  dialogText.innerHTML = `Провести платёж "<strong>${row["Название"]}</strong>" на сумму <strong>${row["Сумма"]}</strong>?`;

  if (editInput) {
    editInput.remove();
    editInput = null;
  }

  buttons[0].style.display = "inline-block"; // Да
  buttons[1].style.display = "inline-block"; // Изменить
  buttons[2].style.display = "inline-block"; // Нет

  enableButtons(true);

  dialog.style.display = "block";
  dialogOverlay.style.display = "block";
}

// Включить/отключить кнопки диалога
function enableButtons(enabled) {
  for (let btn of buttons) {
    btn.disabled = !enabled;
  }
}

// Начать редактирование суммы
function startEdit() {
  if (isEditing) return;
  isEditing = true;

  dialogText.innerHTML = `Изменить сумму платежа "<strong>${selectedPayment["Название"]}</strong>"? Введите новую сумму:`;

  editInput = document.createElement("input");
  editInput.type = "number";
  editInput.min = "0";
  editInput.value = selectedPayment["Сумма"];
  editInput.style.width = "100%";
  editInput.classList.add("dialog-edit-input");
  editInput.autofocus = true;

  dialogText.appendChild(editInput);

  buttons[1].style.display = "none"; // скрыть "Изменить"
}

// Подтвердить платеж (или изменение суммы)
function confirmPayment() {
  if (!selectedPayment) {
    showNotification("Ошибка: платеж не выбран", "error", 4500);
    console.error("Платёж не выбран");
    return;
  }

  // Сохраняем данные в локальные переменные
  let amountToSend = selectedPayment["Сумма"];
  const invoiceId = selectedPayment["№"];
  const paymentName = selectedPayment["Название"];

  if (isEditing) {
    if (!editInput) {
      alert("Ошибка: поле ввода суммы не найдено.");
      enableButtons(true);
      return;
    }
    const val = parseFloat(editInput.value);
    if (isNaN(val) || val <= 0) {
      alert("Введите корректную сумму больше 0.");
      enableButtons(true);
      return;
    }
    amountToSend = val;
  }

  // Закрываем диалог после сохранения данных
  closeDialog();

  enableButtons(false);

  const payload = {
    invoice_id: invoiceId,
    amount: amountToSend
  };

  showNotification("Отправка платежа...", "status", 1500);

  fetch("https://fastapi-myapp-production.up.railway.app/update_invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      showNotification(`Платёж "${paymentName}" на сумму ${amountToSend} успешно проведён.`, "info", 3000);

      if (isEditing) {
        const idx = paymentsData.findIndex(p => p["№"] === invoiceId);
        if (idx !== -1) paymentsData[idx]["Сумма"] = amountToSend;
      }

      paymentsData = paymentsData.filter(p => p["№"] !== invoiceId);

      filterPayments();
    })
    .catch(error => {
      showNotification(`Ошибка при отправке платежа: ${error.message}`, "error", 5000);
    })
    .finally(() => {
      enableButtons(true);
    });
}


// Закрыть диалог
function closeDialog() {
  dialog.style.display = "none";
  dialogOverlay.style.display = "none";
  selectedPayment = null;
  isEditing = false;

  buttons[1].style.display = "inline-block"; // показать "Изменить", если скрыта

  if (editInput) {
    editInput.remove();
    editInput = null;
  }
}

// Уведомления с затемнением
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

// Назначаем обработчики кнопок (без inline onclick)
buttons[0].addEventListener("click", confirmPayment); // Да
buttons[1].addEventListener("click", startEdit);      // Изменить
buttons[2].addEventListener("click", closeDialog);    // Нет

// Клик по overlay закрывает диалог
dialogOverlay.addEventListener("click", closeDialog);

// События для поиска
searchInput.addEventListener("input", filterPayments);
clearSearchBtn.addEventListener("click", clearSearch);

// Первая загрузка
fetchPayments();
