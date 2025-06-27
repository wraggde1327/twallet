// Объявляем глобальную переменную allClients, чтобы она была доступна везде
window.allClients = window.allClients || [];

document.addEventListener('DOMContentLoaded', () => {
  let selectedClientId = null;

  // Получаем элементы из DOM
  const clientSearchInput = document.getElementById('clientSearchInput');
  const clientDropdown = document.getElementById('clientDropdown');
  const invoiceForm = document.getElementById('invoiceForm');
  const paymentTypeInput = document.getElementById('paymentTypeInput');
  const invoiceTabBtn = document.getElementById('invoiceTab');
  const paymentsTabBtn = document.getElementById('paymentsTab');

  // --- Функция загрузки клиентов ---
  async function loadClients() {
    try {
      const response = await fetch('https://fastapi-myapp-production.up.railway.app/clients');
      if (!response.ok) throw new Error('Ошибка загрузки клиентов');
      window.allClients = await response.json();
      console.log('Клиенты загружены:', window.allClients);
    } catch (e) {
      window.allClients = [];
      showNotification('Ошибка загрузки клиентов', 'error');
      console.error(e);
    }
  }

  // --- Показать выпадающий список клиентов ---
  function showDropdown(filter = '') {
    clientDropdown.innerHTML = '';
    const filtered = window.allClients.filter(cl => cl.name.toLowerCase().includes(filter.toLowerCase()));
    if (filtered.length === 0) {
      clientDropdown.innerHTML = '<div class="autocomplete-option" style="color:#888;">Нет совпадений</div>';
    } else {
      filtered.forEach(client => {
        const div = document.createElement('div');
        div.className = 'autocomplete-option';
        div.textContent = client.name;
        div.dataset.id = client.id;
        div.addEventListener('mousedown', () => {
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
  clientSearchInput.addEventListener('focus', () => showDropdown(''));
  clientSearchInput.addEventListener('input', function() {
    selectedClientId = null;
    showDropdown(this.value);
  });
  clientSearchInput.addEventListener('blur', hideDropdown);

  // --- Скрыть dropdown при клике вне ---
  document.addEventListener('mousedown', (e) => {
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
      else if (this.dataset.type === "Наличные") this.classList.add('green');
      else if (this.dataset.type === "Пополнить") this.classList.add('yellow');
      paymentTypeInput.value = this.dataset.type;
    });
  });

  // --- Переключение вкладок ---
  if (paymentsTabBtn && invoiceTabBtn) {
    paymentsTabBtn.addEventListener('click', () => {
      document.getElementById('paymentsContent').style.display = 'block';
      document.getElementById('invoiceContent').style.display = 'none';
      paymentsTabBtn.classList.add('active');
      invoiceTabBtn.classList.remove('active');
    });

    invoiceTabBtn.addEventListener('click', () => {
      document.getElementById('paymentsContent').style.display = 'none';
      document.getElementById('invoiceContent').style.display = 'block';
      invoiceTabBtn.classList.add('active');
      paymentsTabBtn.classList.remove('active');

      // Загружаем клиентов при первом открытии вкладки "Создать счет"
      if (window.allClients.length === 0) {
        loadClients();
      }
    });
  }

  // --- Обработка отправки формы ---
  invoiceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clientName = clientSearchInput.value.trim();
    const paymentType = paymentTypeInput.value;
    const amountStr = invoiceForm.querySelector('#amountInput').value.trim();
    const amount = parseFloat(amountStr);

    // Найти id клиента по имени, если не выбран через dropdown
    let clientId = selectedClientId;
    if (!clientId) {
      const found = window.allClients.find(cl => cl.name.toLowerCase() === clientName.toLowerCase());
      clientId = found ? found.id : null;
    }

    if (!clientId) {
      showNotification('Пожалуйста, выберите клиента из списка', 'error');
      return;
    }
    if (!amountStr || isNaN(amount) || amount <= 0) {
      showNotification('Введите корректную сумму', 'error');
      return;
    }

    // Получаем tgUserId из глобальной переменной, если она есть
    const who = window.tgUserId ? `tg_user_${window.tgUserId}` : 'unknown';

    const payload = {
      id: String(clientId),
      type: paymentType,
      sum: amount,
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

        // Сброс кнопок выбора типа платежа
        document.querySelectorAll('.payment-type-btn').forEach(b => b.classList.remove('active', 'blue', 'green', 'yellow'));
        const blueBtn = document.querySelector('.payment-type-btn.blue');
        if (blueBtn) blueBtn.classList.add('active');
        paymentTypeInput.value = 'Счет';
      } else {
        const errorText = await response.text();
        showNotification(`Ошибка при создании счета: ${errorText}`, 'error');
        console.error('Ошибка сервера:', errorText);
      }
    } catch (error) {
      showNotification('Ошибка сети', 'error');
      console.error(error);
    }
  });

  // --- Функция уведомлений ---
  function showNotification(text, type = '', timeout = 2500) {
    const notif = document.getElementById('notification');
    if (!notif) return;
    notif.textContent = text;
    notif.className = 'show' + (type === 'error' ? ' error' : '');
    setTimeout(() => {
      notif.className = '';
    }, timeout);
  }
});
