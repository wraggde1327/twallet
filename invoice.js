// --- Переменные ---
let allClients = [];
let selectedClientId = null;

const clientSearchInput = document.getElementById('clientSearchInput');
const clientDropdown = document.getElementById('clientDropdown');
const invoiceForm = document.getElementById('invoiceForm');
const paymentTypeInput = document.getElementById('paymentTypeInput');

// --- Загрузка клиентов ---
async function loadClients() {
  try {
    const response = await fetch('https://fastapi-myapp-production.up.railway.app/clients');
    if (!response.ok) throw new Error('Ошибка загрузки клиентов');
    allClients = await response.json();
  } catch (e) {
    allClients = [];
    showNotification('Ошибка загрузки клиентов', 'error');
  }
}

// --- Показать выпадающий список ---
function showDropdown(filter = '') {
  clientDropdown.innerHTML = '';
  const filtered = allClients.filter(cl => cl.name.toLowerCase().includes(filter.toLowerCase()));
  if (filtered.length === 0) {
    clientDropdown.innerHTML = '<div class="autocomplete-option" style="color:#888;">Нет совпадений</div>';
  } else {
    filtered.forEach(client => {
      const div = document.createElement('div');
      div.className = 'autocomplete-option';
      div.textContent = client.name;
      div.dataset.id = client.id;
      div.addEventListener('mousedown', function(e) {
        clientSearchInput.value = client.name;
        selectedClientId = client.id;
        clientDropdown.style.display = 'none';
      });
      clientDropdown.appendChild(div);
    });
  }
  clientDropdown.style.display = 'block';
}

// --- Скрыть dropdown ---
function hideDropdown() {
  setTimeout(() => { clientDropdown.style.display = 'none'; }, 120);
}

// --- События для автокомплита ---
clientSearchInput.addEventListener('focus', function() {
  showDropdown('');
});
clientSearchInput.addEventListener('input', function() {
  selectedClientId = null;
  showDropdown(this.value);
});
clientSearchInput.addEventListener('blur', hideDropdown);

// --- При клике вне автокомплита — скрыть ---
document.addEventListener('mousedown', function(e) {
  if (!clientSearchInput.contains(e.target) && !clientDropdown.contains(e.target)) {
    clientDropdown.style.display = 'none';
  }
});

// --- Кнопки выбора типа платежа ---
document.querySelectorAll('.payment-type-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.payment-type-btn').forEach(b => b.classList.remove('active', 'blue', 'green', 'yellow'));
    this.classList.add('active');
    if (this.dataset.type === "Счет") this.classList.add('blue');
    if (this.dataset.type === "Наличные") this.classList.add('green');
    if (this.dataset.type === "Пополнить") this.classList.add('yellow');
    paymentTypeInput.value = this.dataset.type;
  });
});

// --- Загрузи клиентов при первом открытии вкладки ---
document.getElementById('invoiceTab').addEventListener('click', () => {
  if (allClients.length === 0) loadClients();
});

// --- Обработка отправки формы ---
invoiceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const clientName = clientSearchInput.value.trim();
  const paymentType = paymentTypeInput.value;
  const amount = invoiceForm.querySelector('#amountInput').value.trim();

  // Найти id клиента по имени, если не выбран через dropdown
  let clientId = selectedClientId;
  if (!clientId) {
    const found = allClients.find(cl => cl.name.toLowerCase() === clientName.toLowerCase());
    clientId = found ? found.id : null;
  }

  if (!clientId) {
    showNotification('Пожалуйста, выберите клиента из списка', 'error');
    return;
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    showNotification('Введите корректную сумму', 'error');
    return;
  }

  /*const tgUserId = window.tgUserId || null;*/
  const who = window.tgUserId ? `tg_user_${window.tgUserId}` : 'unknown';


  const payload = {
    id: clientId,
    type: paymentType,
    sum: parseFloat(amount),
    who: who 
  };
console.log('payload:', payload);

  try {
    const response = await fetch('https://fastapi-myapp-production.up.railway.app/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      showNotification('Счет успешно создан!');
      invoiceForm.reset();
      clientSearchInput.value = '';
      selectedClientId = null;
      // Вернуть кнопки в исходное состояние
      document.querySelectorAll('.payment-type-btn').forEach(b => b.classList.remove('active', 'blue', 'green', 'yellow'));
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
