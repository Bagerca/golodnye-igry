// --- ГЛАВНЫЙ СКРИПТ (ВХОД, СТОЛ, СНЕГ) ---

const students = [
    "Алексей И.", "Мария П.", "Дмитрий С.", "Анна К.", "Егор К.", "Учитель",
    "Иван П.", "Ольга М.", "Никита Б.", "София Р.", "Артем Т.", "Полина В.",
    "Ксения Л.", "Максим Д."
];
const totalSeats = 26;

let currentUser = null;
let selectedSeat = null;

// Элементы
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const studentSelect = document.getElementById('student-select');
const greeting = document.getElementById('user-greeting');
const chairsTop = document.getElementById('chairs-top');
const chairsBottom = document.getElementById('chairs-bottom');

// Старт
function initApp() {
    // Имена
    students.sort();
    students.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        studentSelect.appendChild(option);
    });

    // Стулья
    const half = Math.ceil(totalSeats / 2);
    for (let i = 1; i <= totalSeats; i++) {
        const chair = document.createElement('div');
        chair.classList.add('chair');
        chair.textContent = i;
        chair.dataset.id = i;
        chair.onclick = () => selectSeat(i, chair);
        if (i <= half) chairsTop.appendChild(chair);
        else chairsBottom.appendChild(chair);
    }
    createSnow();
}

// Вход
function login() {
    if (!studentSelect.value) return alert("Выбери имя!");
    currentUser = studentSelect.value;
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    greeting.textContent = `Привет, ${currentUser}!`;
}

// Выбор места
function selectSeat(id, element) {
    if (element.classList.contains('taken')) return;
    document.querySelectorAll('.chair.selected').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedSeat = id;
}

// Сохранение (Использует selectedFoods из menu.js)
function saveChoice() {
    if (!selectedSeat) return alert("❌ Выбери место!");
    // selectedFoods берется из menu.js (глобальная переменная)
    if (selectedFoods.length === 0) return alert("❌ Выбери еду!");

    const foodList = selectedFoods.map(f => f.title).join(", ");
    const total = selectedFoods.reduce((sum, item) => sum + item.price, 0);

    const btn = document.getElementById('save-btn');
    btn.textContent = "Готово! 🎉";
    btn.style.background = "#2ed573";
    
    alert(`Записано!\n👤 ${currentUser}\n🪑 Место: ${selectedSeat}\n🍽 Заказ: ${foodList}\n💰 Итого: ${total} ₽`);
}

function createSnow() {
    const container = document.getElementById('snow-container');
    for (let i = 0; i < 50; i++) {
        const flake = document.createElement('div');
        flake.classList.add('snowflake');
        flake.textContent = '❄';
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.animationDuration = Math.random() * 3 + 2 + 's';
        flake.style.opacity = Math.random();
        flake.style.fontSize = Math.random() * 10 + 10 + 'px';
        container.appendChild(flake);
    }
}

initApp();