// --- Переменные ---
let clientsLoaded = false;
let allClients = [];
const clientSelect = document.getElementById('clientSelect');
const invoiceForm = document.getElementById('invoiceForm');
const clientSearchInput = document.getElementById('clientSearchInput');
const paymentTypeInput = document.getElementById('paymentTypeInput');

// --- Функция загрузки клиентов ---
async function loadClients() {
  clientSelect.innerHTML = '<option value="">Загрузка...</option>';
  try {
    const response = await fetch('https://fastapi-myapp-production.up.railway.app/clients');
    if (!response.ok) throw new Error('Ошибка загрузки клиентов');
    const clients = await response.json();

    allClients = clients; // Сохраняем для поиска

    // Очищаем и добавляем опции
    clientSelect.innerHTML = '';
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

// --- Поиск по клиентам ---
clientSearchInput.addEventListener('input', function() {
  const val = this.value.trim().toLowerCase();
  clientSelect.innerHTML = '';
  allClients
    .filter(cl => cl.name.toLowerCase().includes(val))
    .forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      clientSelect.appendChild(option);
    });
});

// --- Загрузка клиентов при первом открытии вкладки ---
document.getElementById('invoiceTab').addEventListener('click', () => {
  if (!clientsLoaded) loadClients();
});

// --- Кнопки выбора типа платежа ---
document.querySelectorAll('.payment-type-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.payment-type-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    paymentTypeInput.value = this.dataset.type;
  });
});

// --- Обработка отправки формы ---
invoiceForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const clientId = clientSelect.value;
  const paymentType = paymentTypeInput.value;
  const amount = invoiceForm.querySelector('#amountInput').value.trim();

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
    who: who
  };

  try {
    const response = await fetch('https://fastapi-myapp-production.up.railway.app/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      showNotification('Счет успешно создан!');
      invoiceForm.reset();
      // Вернем кнопки в исходное состояние
      document.querySelectorAll('.payment-type-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.payment-type-btn.blue').classList.add('active');
      paymentTypeInput.value = 'Счет';
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
