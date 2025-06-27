document.addEventListener('DOMContentLoaded', () => {
  // --- Переменные ---
  let selectedClientId = null;

  const clientSearchInput = document.getElementById('clientSearchInput');
  const clientDropdown = document.getElementById('clientDropdown');
  const invoiceForm = document.getElementById('invoiceForm');
  const paymentTypeInput = document.getElementById('paymentTypeInput');
  const clientsLoadIndicator = document.getElementById('clientsLoadIndicator');

  window.allClients = window.allClients || [];

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

  // --- Загрузка клиентов ---
  async function loadClients() {
    try {
      clientsLoadIndicator.style.backgroundColor = 'gray'; // загрузка началась

      const response = await fetch('https://fastapi-myapp-production.up.railway.app/clients');
      if (!response.ok) throw new Error('Ошибка загрузки клиентов');
      window.allClients = await response.json();

      clientsLoadIndicator.style.backgroundColor = 'green'; // загрузка успешна
    //  showDropdown(clientSearchInput.value);
    } catch (e) {
      window.allClients = [];
      clientsLoadIndicator.style.backgroundColor = 'red'; // ошибка загрузки
      showNotification('Ошибка загрузки клиентов', 'error');
      console.error(e);
    }
  }

  // --- Показать выпадающий список ---
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
      else if (this.dataset.type === "Наличные") this.classList.add('green');
      else if (this.dataset.type === "Пополнить") this.classList.add('yellow');
      paymentTypeInput.value = this.dataset.type;
    });
  });

  // --- Инициализация индикатора серым цветом ---
  clientsLoadIndicator.style.backgroundColor = 'gray';

  // --- Загрузка клиентов при первом открытии вкладки ---
  const invoiceTabBtn = document.getElementById('invoiceTab');
  if (invoiceTabBtn) {
    invoiceTabBtn.addEventListener('click', () => {
      if (window.allClients.length === 0) loadClients();
    });
  }

  // --- Обработка отправки формы ---
  invoiceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clientName = clientSearchInput.value.trim();
    const paymentType = paymentTypeInput.value;
    const amountStr = invoiceForm.querySelector('#amountInput').value.trim();
    const amount = parseFloat(amountStr);

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
});
