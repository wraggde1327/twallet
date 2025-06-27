document.addEventListener('DOMContentLoaded', () => {
  // Инициализация элементов
  const contractNumberInput = document.getElementById('contractNumber');
  const contractDateInput = document.getElementById('contractDate');
  const orgTypeButtons = document.querySelectorAll('.payment-type-group:nth-of-type(1) .payment-type-btn');
  const orgTypeInput = document.getElementById('orgType');

  const tarifButtons = document.querySelectorAll('.payment-type-group:nth-of-type(2) .payment-type-btn');
  const tarifInput = document.getElementById('tarif');

  const contractForm = document.getElementById('contractForm');

  // Генерация номера договора формата "2706/2025"
  function generateContractNumber() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}${month}/${year}`;
  }

  // Устанавливаем номер договора и дату по умолчанию
  contractNumberInput.value = generateContractNumber();
  contractDateInput.valueAsDate = new Date();

  // Обработчик выбора ИП или ООО
  orgTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      orgTypeButtons.forEach(b => b.classList.remove('active', 'blue', 'green'));
      btn.classList.add('active');
      if (btn.dataset.value === 'ИП') btn.classList.add('blue');
      else if (btn.dataset.value === 'ООО') btn.classList.add('green');
      orgTypeInput.value = btn.dataset.value;
    });
  });

  // Обработчик выбора тарифа
  tarifButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tarifButtons.forEach(b => b.classList.remove('active', 'yellow', 'green'));
      btn.classList.add('active');
      if (btn.dataset.value === 'Стандарт') btn.classList.add('yellow');
      else if (btn.dataset.value === 'Пробный') btn.classList.add('green');
      tarifInput.value = btn.dataset.value;
    });
  });

  // Отправка формы
  contractForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Собираем данные из формы
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
    };

    // Валидация (пример простая, можно расширить)
    if (!data.zakazchik || !data.inn || !data.ogrn || !data.lico || !data.osnovan || !data.rucl || !data.adress || !data.pochta || !data.bank || !data.bik || !data.rs) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      const response = await fetch('https://fastapi-myapp-production.up.railway.app/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Договор успешно создан!');
        contractForm.reset();
        // Обновим номер и дату после сброса
        contractNumberInput.value = generateContractNumber();
        contractDateInput.valueAsDate = new Date();

        // Сбросим выбор кнопок
        orgTypeButtons.forEach(b => b.classList.remove('active', 'blue', 'green'));
        orgTypeButtons[0].classList.add('active', 'blue');
        orgTypeInput.value = 'ИП';

        tarifButtons.forEach(b => b.classList.remove('active', 'yellow', 'green'));
        tarifButtons[0].classList.add('active', 'yellow');
        tarifInput.value = 'Стандарт';
      } else {
        const errText = await response.text();
        alert('Ошибка при создании договора: ' + errText);
      }
    } catch (error) {
      alert('Ошибка сети: ' + error.message);
    }
  });
});
