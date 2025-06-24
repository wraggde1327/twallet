let paymentsData = [];
let lastUpdated = null;
let selectedPayment = null;

const paymentsList = document.getElementById("paymentsList");
const totalSumEl = document.getElementById("totalSum");
const updatedAtEl = document.getElementById("updatedAt");
const dialog = document.getElementById("dialog");
const dialogText = document.getElementById("dialogText");
const paymentsCountBadge = document.getElementById("paymentsCountBadge");

function fetchPayments() {
  updatedAtEl.textContent = "Обновление...";
  fetch("https://fastapi-myapp-production.up.railway.app/pending")
    .then(res => res.json())
    .then(data => {
      paymentsData = data;
      lastUpdated = new Date();
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

function renderPayments() {
  if (!paymentsData.length) {
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

  paymentsData.forEach((row, idx) => {
    const div = document.createElement("div");
    div.className = "payment-row";
    div.tabIndex = 0;
    div.setAttribute("role", "row");
    div.setAttribute(
      "aria-label",
      `Платёж ${row["Название"]} №${row["№"]}, сумма ${row["Сумма"]}, статус ${row["Статус"]}`
    );

    div.innerHTML = `
      <div role="cell">${row["№"] ?? idx + 1}</div>
      <div role="cell">${row["Название"] ?? "—"}</div>
      <div role="cell">—</div>
      <div role="cell">—</div>
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
  paymentsCountBadge.textContent = paymentsData.length.toString();
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

function confirmPayment() {
  alert(`Платёж "${selectedPayment["Название"]}" на ${selectedPayment["Сумма"]} проведён.`);
  paymentsData = paymentsData.filter(p => p !== selectedPayment);
  renderPayments();
  closeDialog();
}

// Автообновление каждые 30 секунд (если нужно, раскомментируй)
// setInterval(fetchPayments, 30000);

// Первая загрузка
fetchPayments();
