document.addEventListener('DOMContentLoaded', () => {
  const contractNumberInput = document.getElementById('contractNumber');
  const contractDateInput = document.getElementById('contractDate');
  const contractForm = document.getElementById('contractForm');

  const orgButtons = document.querySelectorAll('.button-org');
  const tarifButtons = document.querySelectorAll('.button-tarif');

  const orgTypeInput = document.getElementById('orgType');
  const tarifInput = document.getElementById('tarif');

  // Уведомления
  const notification = document.getElementById('notification');
  
  function showNotification(text, type = '', timeout = 2500) {
    if (!notification) return;
    notification.textContent = text;
    notification.className = 'show' + (type === 'error' ? ' error' : '');
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
      notification.className = '';
    }, timeout);
  }

  function generateContractNumber() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}${month}/${year}`;
  }

  
  // Инициализация полей и кнопок
  contractNumberInput.value = generateContractNumber();
  contractDateInput.valueAsDate = new Date();
  
 // Функция переключения для группы org
  orgButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      orgButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      orgTypeInput.value = btn.dataset.value;
    });
  });

  // Функция переключения для группы tarif
  tarifButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tarifButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tarifInput.value = btn.dataset.value;
    });
  });


  // Отправка формы
  contractForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      contractNumber: contractNumberInput.value,
      contractDate: contractDateInput.value,
      orgType: orgTypeInput.value,
      zakazchik: document.getElementById('zakazchik').value.trim(),
      inn: document.getElementById('inn').value.trim(),
      ogrn: document.getElementById('ogrn').value.trim(),
      lico: document.getElementById('lico').value.trim(),
      osnovan: document.getElementById('osnovan').value.trim(),
      rucl: document.getElementById('rucl').value.trim(),
      adress: document.getElementById('adress').value.trim(),
      tel: document.getElementById('tel').value.trim(),
      pochta: document.getElementById('pochta').value.trim(),
      bank: document.getElementById('bank').value.trim(),
      bik: document.getElementById('bik').value.trim(),
      rs: document.getElementById('rs').value.trim(),
      ks: document.getElementById('ks').value.trim(),
      tarif: tarifInput.value,
      who: window.telegramNick
    };

    // Валидация
    if (!data.zakazchik || !data.inn || !data.ogrn || !data.lico || !data.osnovan || !data.rucl || !data.adress || !data.pochta || !data.bank || !data.bik || !data.rs) {
      showNotification('Пожалуйста, заполните все обязательные поля', 'error', 3000);
      return;
    }

    try {
      showNotification('Отправляем...', '', 3000);

      const response = await fetch('https://fastapi-myapp-production.up.railway.app/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showNotification('Договор успешно создан!', '', 3000);
        contractForm.reset();
        contractNumberInput.value = generateContractNumber();
        contractDateInput.valueAsDate = new Date();
        initDefaultButtons();
      } else {
        const errText = await response.text();
        showNotification('Ошибка при создании договора: ' + errText, 'error', 4000);
      }
    } catch (error) {
      showNotification('Ошибка сети: ' + error.message, 'error', 4000);
    }
  });
});
