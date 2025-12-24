// --- script.js ---

// 1. ИМПОРТИРУЕМ БАЗУ И ФУНКЦИИ (Версия 12.7.0)
import { db } from './firebase-init.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Генератор случайных чисел
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function transliterate(word) {
    const converter = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ы': 'y', 'ъ': '', 'э': 'e', 'ю': 'yu',
        'я': 'ya', ' ': '_'
    };
    return word.toLowerCase().split('').map(c => converter[c] || c).join('');
}

function getAvatarGenerator(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true&length=2&font-size=0.4`;
}

// БАЗА ПОЛЬЗОВАТЕЛЕЙ
const usersDB = [
    { name: "Айрапетянц София", pass: "S0F1A2B3" },
    { name: "Бебия Баграт", pass: "B1A2G3R4" },
    { name: "Беляев Дмитрий", pass: "D8M9T0R1" },
    { name: "Божеский Артём", pass: "A2R3T4M5" },
    { name: "Бунковская Вероника", pass: "V6E7R8O9" },
    { name: "Валеева Ульяна", pass: "U1L2Y3A4" },
    { name: "Воробель Елизавета", pass: "E5L6I7Z8" },
    { name: "Гатикоева Карина", pass: "K9A0R1I2" },
    { name: "Герасимова Полина", pass: "P3O4L5I6" },
    { name: "Горлов Максим", pass: "M7A8X9I0" },
    { name: "Демидович Вероника", pass: "V1E2R3O4" },
    { name: "Дрыбалов Андрей", pass: "A5N6D7R8" },
    { name: "Елсукова Кира", pass: "K9I0R1A2" },
    { name: "Ермуханов Жанахмед", pass: "Z3H4A5N6" },
    { name: "Калинина Лиана", pass: "L7I8A9N0" },
    { name: "Кочмар Евгения", pass: "E1V2G3E4" },
    { name: "Леонтьева Елизавета", pass: "L1E2O3N4" },
    { name: "Надьярная Елизавета", pass: "E9L0I1Z2" },
    { name: "Очакова Ксения", pass: "K3S4E5N6" },
    { name: "Пяжиева Алина", pass: "A7L8I9N0" },
    { name: "Радивилов Кирилл", pass: "K1I2R3I4" },
    { name: "Рыбак Григорий", pass: "G5R6I7G8" },
    { name: "Шарин Кирилл", pass: "K9I0R1I2" },
    { name: "Шилова Екатерина", pass: "E3K4A5T6" },
    { name: "Янцевич Полина", pass: "P7O8L9I0" },
    { name: "Албаева Лариса Кадыровна", pass: "A9L8K7D6" }
];

const seed = 2025; 
const rand = mulberry32(seed);
for (let i = usersDB.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [usersDB[i], usersDB[j]] = [usersDB[j], usersDB[i]];
}

usersDB.forEach((user, index) => {
    user.seatId = index + 1;
});

const totalSeats = 26; 
let currentUserObj = null; 

// Элементы DOM
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const passwordInput = document.getElementById('password-input');
const greeting = document.getElementById('user-greeting');
const chairsTop = document.getElementById('chairs-top');
const chairsBottom = document.getElementById('chairs-bottom');
const saveBtn = document.getElementById('save-btn');
const adminBtn = document.getElementById('admin-btn'); 

// Экспорт для HTML
window.login = login;
window.saveChoice = saveChoice;

function initApp() {
    const half = Math.ceil(totalSeats / 2);
    for (let i = 1; i <= totalSeats; i++) {
        const chair = document.createElement('div');
        chair.classList.add('chair');
        chair.textContent = i; 
        chair.dataset.id = i;
        
        if (i <= half) chairsTop.appendChild(chair);
        else chairsBottom.appendChild(chair);
    }
    createSnow();
}

function login() {
    const enteredPass = passwordInput.value.trim();
    if (!enteredPass) return alert("🔑 Введи код!");

    const user = usersDB.find(u => u.pass === enteredPass);

    if (user) {
        currentUserObj = user;
        
        // --- ЛОГИКА АДМИНА ---
        if (user.name === "Бебия Баграт") {
            if(adminBtn) adminBtn.classList.remove('hidden');
        }

        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
            mainApp.classList.add('fade-in'); 
            
            fillTableWithGuests();
            
            // Проверяем, был ли заказ в базе, и восстанавливаем его
            checkAndRestoreOrder(user.name);

        }, 500);

        loadUserPhoto(user, (url) => {
             const firstName = user.name.split(' ')[1] || user.name.split(' ')[0];
             greeting.innerHTML = `Привет, ${firstName}! <img src="${url}" style="width:28px; height:28px; border-radius:50%; vertical-align: middle; margin-left:8px; border:1px solid #fff; object-fit:cover;">`;
        });

    } else {
        alert("⛔️ Неверный код!");
        passwordInput.value = '';
    }
}

// ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ ЗАКАЗА ПРИ ВХОДЕ
async function checkAndRestoreOrder(username) {
    try {
        const docRef = doc(db, "orders", username);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Проверяем, есть ли товары (даже если 0, считаем что загрузилось, просто корзина пуста)
            if (data.items) {
                console.log("Найден старый заказ, восстанавливаем...");
                
                // Вызываем функцию из menu.js, чтобы восстановить UI
                if (window.restoreCartFromFirebase) {
                    await window.restoreCartFromFirebase(data.items);
                    
                    if (data.items.length > 0) {
                        saveBtn.textContent = "Ваш заказ загружен ✅";
                        saveBtn.style.background = "#2ed573";
                    } else {
                        // Если заказ пустой (был очищен)
                        saveBtn.textContent = "Заказ пуст"; 
                    }

                    setTimeout(() => {
                        saveBtn.textContent = "🎄 Обновить выбор 🎄";
                        saveBtn.style.background = "";
                    }, 4000);
                }
            }
        }
    } catch (error) {
        console.error("Ошибка при восстановлении заказа:", error);
    }
}

function fillTableWithGuests() {
    usersDB.forEach(guest => {
        const chair = document.querySelector(`.chair[data-id="${guest.seatId}"]`);
        if (chair) {
            loadUserPhoto(guest, (url) => {
                chair.textContent = '';
                chair.style.backgroundImage = `url('${url}')`;
                chair.style.backgroundColor = 'transparent'; 
                chair.setAttribute('data-tooltip', guest.name);
            });

            if (guest.pass === currentUserObj.pass) {
                chair.classList.add('selected');
                setTimeout(() => {
                    chair.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }, 800);
            } else {
                chair.classList.add('guest-seated');
            }
        }
    });
}

function loadUserPhoto(user, callback) {
    const defaultAvatar = getAvatarGenerator(user.name);
    const fileName = transliterate(user.name) + ".jpg";
    const filePath = `avatars/${fileName}`;
    const img = new Image();
    img.src = filePath;
    img.onload = () => callback(filePath);
    img.onerror = () => callback(defaultAvatar);
}

// --- СОХРАНЕНИЕ В FIREBASE (ИСПРАВЛЕННАЯ ВЕРСИЯ) ---
async function saveChoice() {
    // Получаем текущую корзину (или пустой массив)
    const currentFood = window.selectedFoods || [];

    saveBtn.textContent = "Сохраняю... ⏳";
    saveBtn.disabled = true;

    try {
        const total = currentFood.reduce((sum, item) => sum + item.price, 0);
        
        const orderItems = currentFood.map(item => ({
            title: item.title,
            price: item.price
        }));

        // Сохраняем в Firebase (перезаписываем документ)
        await setDoc(doc(db, "orders", currentUserObj.name), {
            userName: currentUserObj.name,
            items: orderItems, // Может быть пустым
            totalPrice: total,
            timestamp: new Date().toISOString()
        });

        // Уведомления в зависимости от ситуации
        if (orderItems.length === 0) {
            saveBtn.textContent = "Очищено 🗑️";
            saveBtn.style.background = "#a4b0be"; // Серый цвет
            alert("Ваш заказ удален (список пуст). 🗑️");
        } else {
            saveBtn.textContent = "Готово! 🎉";
            saveBtn.style.background = "#2ed573"; // Зеленый цвет
            alert("Твой заказ успешно сохранен! ✅");
        }
        
        // Возвращаем кнопку в исходное состояние
        setTimeout(() => {
             saveBtn.disabled = false;
             saveBtn.textContent = "🎄 Обновить выбор 🎄";
             saveBtn.style.background = ""; 
        }, 3000);

    } catch (error) {
        console.error("Ошибка Firebase:", error);
        saveBtn.textContent = "Ошибка";
        saveBtn.style.background = "#ff4757";
        alert("Ошибка при сохранении. Проверь интернет.");
        saveBtn.disabled = false;
    }
}

function createSnow() {
    const container = document.getElementById('snow-container');
    if(!container) return;
    container.innerHTML = ''; 
    for (let i = 0; i < 50; i++) {
        const flake = document.createElement('div');
        flake.classList.add('snowflake');
        flake.textContent = '❄'; 
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.fontSize = Math.random() * 15 + 10 + 'px';
        flake.style.opacity = Math.random() * 0.7 + 0.3;
        const duration = Math.random() * 5 + 5; 
        flake.style.animationDuration = duration + 's';
        flake.style.animationDelay = -Math.random() * duration + 's';
        container.appendChild(flake);
    }
}

initApp();