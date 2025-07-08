document.addEventListener('DOMContentLoaded', () => {
  const contractNumberInput = document.getElementById('contractNumber');
  const contractDateInput = document.getElementById('contractDate');
  const contractForm = document.getElementById('contractForm');
  const submitButton = contractForm.querySelector('button[type="submit"]'); // Получаем кнопку отправки

  const orgButtons = document.querySelectorAll('.button-org');
  const tarifButtons = document.querySelectorAll('.button-tarif');

  const orgTypeInput = document.getElementById('orgType');
  const tarifInput = document.getElementById('tarif');

  // Уведомления (ПРЕДПОЛАГАЕТСЯ, ЧТО showNotification уже объявлена в другом скрипте)
  // const notification = document.getElementById('notification'); // Убираем, если showNotification не использует этот элемент напрямую
  // function showNotification(text, type = '', timeout = 2500) { ... } // Убираем, так как функция уже есть

  // --- Функции ---

  function generateContractNumber() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}${month}/${year}`;
  }

  // Функция инициализации кнопок по умолчанию
  function initDefaultButtons() {
    // Снимаем активность со всех кнопок
    orgButtons.forEach(b => b.classList.remove('active'));
    tarifButtons.forEach(b => b.classList.remove('active'));

    // Если нужно, активируем первые кнопки по умолчанию
    if (orgButtons[0]) {
      orgButtons[0].classList.add('active');
      orgTypeInput.value = orgButtons[0].dataset.value;
    } else {
      orgTypeInput.value = ''; // Сбрасываем значение, если нет кнопок
    }

    if (tarifButtons[0]) {
      tarifButtons[0].classList.add('active');
      tarifInput.value = tarifButtons[0].dataset.value;
    } else {
      tarifInput.value = ''; // Сбрасываем значение, если нет кнопок
    }
  }


  // --- Инициализация полей и кнопок ---
  contractNumberInput.value = generateContractNumber();
  contractDateInput.valueAsDate = new Date();
  initDefaultButtons(); // Инициализируем кнопки при загрузке страницы


  // --- Обработчики событий ---

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


  // --- Отправка формы ---
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
      who: window.telegramNick || "" // Добавил || "" на случай undefined
    };

    // Валидация
    if (!data.zakazchik || !data.inn || !data.ogrn || !data.lico || !data.osnovan || !data.rucl || !data.adress || !data.pochta || !data.bank || !data.bik || !data.rs) {
      showNotification('Пожалуйста, заполните все обязательные поля', 'error', 5000); // Увеличил таймаут для ошибок
      return;
    }

    // Блокировка кнопки и индикация загрузки
    const originalButtonText = submitButton.textContent; // Сохраняем оригинальный текст кнопки

    try {
      submitButton.disabled = true; // Блокируем кнопку
      submitButton.textContent = 'Отправка...'; // Меняем текст кнопки

      showNotification('Отправляем данные...', 'info', 3000); // Уведомление о начале отправки

      const response = await fetch('https://24sdmahom.ru/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showNotification('Договор успешно создан!', 'success', 3000);
        contractForm.reset(); // Сброс формы
        contractNumberInput.value = generateContractNumber(); // Генерация нового номера
        contractDateInput.valueAsDate = new Date(); // Установка текущей даты
        initDefaultButtons(); // Сброс кнопок выбора организации и тарифа
      } else {
        const errText = await response.text();
        showNotification('Ошибка при создании договора: ' + errText, 'error', 6000); // Увеличил таймаут для ошибок сервера
        console.error('Ошибка сервера:', errText);
      }
    } catch (error) {
      showNotification('Ошибка сети: ' + error.message, 'error', 6000); // Увеличил таймаут для ошибок сети
      console.error('Ошибка сети:', error);
    } finally {
      submitButton.disabled = false; // Разблокируем кнопку в любом случае
      submitButton.textContent = originalButtonText; // Возвращаем оригинальный текст кнопки
    }
  });
});
