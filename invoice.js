// --- Переменные ---
let clientsLoaded = false;
const clientSelect = document.getElementById('clientSelect');
const invoiceForm = document.getElementById('invoiceForm');

// --- Функция загрузки клиентов ---
async function loadClients() {
  clientSelect.innerHTML = '<option value="">Загрузка...</option>';
  try {
    const response = await fetch('https://fastapi-myapp-production.up.railway.app/clients'); // Заменить на реальный URL
    if (!response.ok) throw new Error('Ошибка загрузки клиентов');
    const clients = await response.json();

    // Очищаем и добавляем опции
    clientSelect.innerHTML = '<option value="">Выберите клиента</option>';
    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      clientSelect.appendChild(option);
    });
    clientsLoaded = true;
  } catch (error) {
    clientSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
    showNotification('Ошибка загрузки клиентов', 'error', 4000);
    console.error(error);
  }
}

// --- Загрузка клиентов при первом открытии вкладки ---
document.getElementById('invoiceTab').addEventListener('click', () => {
  if (!clientsLoaded) loadClients();
});

// --- Обработка отправки формы ---
invoiceForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const clientId = clientSelect.value;
  const paymentType = invoiceForm.querySelector('input[name="paymentType"]:checked').value;
  const amount = invoiceForm.querySelector('#amountInput').value.trim();
  const immediate = invoiceForm.querySelector('#immediateCheckbox').checked;

  if (!clientId) {
    showNotification('Пожалуйста, выберите клиента', 'error');
    return;
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    showNotification('Введите корректную сумму', 'error');
    return;
  }

  // Получаем Telegram user id из глобальной переменной (из script.js)
  const tgUserId = window.tgUserId || null;
  const who = tgUserId ? `tg_user_${tgUserId}` : 'unknown';

  const payload = {
    id: clientId,
    type: paymentType,
    sum: parseFloat(amount),
    checkbox: immediate,
    who: who
  };

  try {
    const response = await fetch('https://fastapi-myapp-production.up.railway.app/invoices', { // Заменить на реальный URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      showNotification('Счет успешно создан!');
      invoiceForm.reset();
    } else {
      showNotification('Ошибка при создании счета', 'error');
    }
  } catch (error) {
    showNotification('Ошибка сети', 'error');
    console.error(error);
  }
});

// --- Функция уведомлений ---
function showNotification(text, type = '', timeout = 2500) {
  const notif = document.getElementById('notification');
  notif.textContent = text;
  notif.className = 'show' + (type === 'error' ? ' error' : '');
  setTimeout(() => {
    notif.className = '';
  }, timeout);
}
