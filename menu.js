// --- menu.js ---

// Глобальные переменные
let menuData = [];

// Проверка/создание глобального массива заказа
// Используем var или window, чтобы переменная была доступна везде
if (typeof window.selectedFoods === 'undefined') {
    window.selectedFoods = []; 
}

const menuModal = document.getElementById('menu-modal');
const menuContainer = document.getElementById('menu-container');
const categoriesContainer = document.getElementById('categories-container');
const cartDisplayMain = document.getElementById('selected-food-display');
const modalTotalPrice = document.getElementById('modal-total-price');

const scrollLeftBtn = document.getElementById('scroll-left');
const scrollRightBtn = document.getElementById('scroll-right');
const imageViewer = document.getElementById('image-viewer');
const viewerImg = document.getElementById('viewer-img');

// --- 1. ЗАГРУЗКА И ИНИЦИАЛИЗАЦИЯ ---

async function initMenu() {
    // Если уже загружено, не грузим снова
    if (menuData.length > 0) return;

    try {
        const response = await fetch('menu.json');
        if (!response.ok) throw new Error('Ошибка сети');
        menuData = await response.json();
        
        renderCategories();
        // Не рендерим товары сразу, чтобы не сбивать вид, если меню закрыто
        // Но подгружаем первую категорию для готовности
        setTimeout(checkScrollArrows, 100);

    } catch (error) {
        console.error("Ошибка:", error);
    }
}

// --- НОВАЯ ФУНКЦИЯ: ВОССТАНОВЛЕНИЕ КОРЗИНЫ ---
window.restoreCartFromFirebase = async function(savedItems) {
    // 1. Убеждаемся, что меню загружено (чтобы найти картинки по названиям)
    if (menuData.length === 0) {
        await initMenu();
    }

    // 2. Очищаем текущую корзину
    window.selectedFoods = [];

    // 3. Сопоставляем сохраненные названия с полными данными из меню
    savedItems.forEach(savedItem => {
        // Ищем товар во всех категориях
        let foundProduct = null;
        
        for (const category of menuData) {
            const match = category.items.find(i => i.title === savedItem.title);
            if (match) {
                foundProduct = match;
                break;
            }
        }

        // Если нашли — добавляем в корзину. 
        // Если блюдо удалили из меню, но оно было в заказе — игнорируем или создаем заглушку.
        if (foundProduct) {
            window.selectedFoods.push(foundProduct);
        }
    });

    // 4. Обновляем интерфейс
    updateMainCartUI();
    console.log("Корзина восстановлена:", window.selectedFoods.length, "позиций");
};
// ---------------------------------------------

// --- 2. УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ ---

function openMenu() {
    if (menuData.length === 0) {
        initMenu().then(() => {
             // После загрузки рендерим первую категорию
             if (menuData.length > 0) {
                 renderItems(menuData[0].items);
                 updateCategoryActiveState(0);
             }
        });
    } else {
        // Если уже открывали, обновляем счетчики
        const activeBtnIndex = Array.from(document.querySelectorAll('.cat-btn')).findIndex(b => b.classList.contains('active'));
        if (activeBtnIndex >= 0) {
             renderItems(menuData[activeBtnIndex].items);
        } else if (menuData.length > 0) {
             renderItems(menuData[0].items);
        }
    }
    
    menuModal.classList.remove('hidden');
    setTimeout(() => {
        menuModal.classList.add('active');
        checkScrollArrows();
    }, 10);
    
    updateModalTotal();
}

function closeMenu() {
    menuModal.classList.remove('active');
    setTimeout(() => menuModal.classList.add('hidden'), 300);
    updateMainCartUI(); 
}

// --- 3. ЛОГИКА ПРОКРУТКИ КАТЕГОРИЙ ---

function scrollCategories(direction) {
    if (categoriesContainer) {
        categoriesContainer.scrollBy({ left: direction * 200, behavior: 'smooth' });
    }
}

function checkScrollArrows() {
    if (!categoriesContainer || !scrollLeftBtn || !scrollRightBtn) return;
    if (categoriesContainer.scrollLeft <= 10) scrollLeftBtn.classList.add('hidden');
    else scrollLeftBtn.classList.remove('hidden');
    
    const maxScroll = categoriesContainer.scrollWidth - categoriesContainer.clientWidth;
    if (categoriesContainer.scrollLeft >= maxScroll - 10) scrollRightBtn.classList.add('hidden');
    else scrollRightBtn.classList.remove('hidden');
}

if (categoriesContainer) {
    categoriesContainer.addEventListener('scroll', checkScrollArrows);
    window.addEventListener('resize', checkScrollArrows);
}

// --- 4. РЕНДЕРИНГ ---

function renderCategories() {
    categoriesContainer.innerHTML = '';
    menuData.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.textContent = cat.category;
        btn.className = 'cat-btn';
        if (index === 0) btn.classList.add('active');
        btn.onclick = () => {
            renderItems(cat.items);
            updateCategoryActiveState(index);
        };
        categoriesContainer.appendChild(btn);
    });
}

function updateCategoryActiveState(index) {
    document.querySelectorAll('.cat-btn').forEach((btn, i) => {
        if (i === index) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function renderItems(items) {
    menuContainer.innerHTML = '';
    menuContainer.style.opacity = '0';
    setTimeout(() => menuContainer.style.opacity = '1', 50);

    if (!items || items.length === 0) {
        menuContainer.innerHTML = '<div style="color:#a4b0be; padding: 40px;">В этой категории пока пусто...</div>';
        return;
    }

    items.forEach(item => {
        const count = window.selectedFoods.filter(f => f.id === item.id).length;
        const card = document.createElement('div');
        card.className = 'menu-item fade-in';
        card.innerHTML = `
            <div class="img-container">
                <img src="${item.img}" alt="${item.title}" loading="lazy">
                <button class="expand-btn" onclick="openImageViewer('${item.img}')">🔍</button>
                ${item.weight ? `<div class="weight-badge">${item.weight}</div>` : ''}
            </div>
            <div class="item-content">
                <div class="item-header">
                    <div class="item-title">${item.title}</div>
                    <div class="item-price">${item.price} ₽</div>
                </div>
                <div class="item-desc">${item.desc}</div>
                <div class="item-actions" id="actions-${item.id}">
                    ${getButtonHtml(item.id, count)}
                </div>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}

// --- 5. ЛОГИКА КОРЗИНЫ ---

function getButtonHtml(id, count) {
    if (count > 0) {
        return `
            <div class="qty-control">
                <button class="qty-btn minus" onclick="decreaseItem(${id})">−</button>
                <span class="qty-val">${count}</span>
                <button class="qty-btn plus" onclick="increaseItem(${id})">+</button>
            </div>
        `;
    } else {
        return `<button class="add-btn" onclick="increaseItem(${id})">Добавить</button>`;
    }
}

function findProduct(id) {
    for (const cat of menuData) {
        const found = cat.items.find(i => i.id === id);
        if (found) return found;
    }
    return null;
}

// Делаем функции глобальными для onclick в HTML
window.increaseItem = function(id) {
    const product = findProduct(id);
    if (product) {
        window.selectedFoods.push(product); 
        updateCardUI(id);            
        updateModalTotal();          
    }
}

window.decreaseItem = function(id) {
    const index = window.selectedFoods.findIndex(f => f.id === id);
    if (index !== -1) {
        window.selectedFoods.splice(index, 1);
        updateCardUI(id);
        updateModalTotal();
    }
}

function updateCardUI(id) {
    const actionContainer = document.getElementById(`actions-${id}`);
    if (actionContainer) {
        const count = window.selectedFoods.filter(f => f.id === id).length;
        actionContainer.innerHTML = getButtonHtml(id, count);
    }
}

function updateModalTotal() {
    const total = window.selectedFoods.reduce((sum, item) => sum + item.price, 0);
    if(modalTotalPrice) modalTotalPrice.textContent = total;
}

// --- 6. КОРЗИНА НА ГЛАВНОМ ЭКРАНЕ ---

function updateMainCartUI() {
    if (!cartDisplayMain) return;
    cartDisplayMain.innerHTML = '';
    
    if (window.selectedFoods.length === 0) {
        cartDisplayMain.innerHTML = `
            <div class="empty-cart-placeholder" onclick="openMenu()">
                <span style="font-size: 2rem; margin-bottom:10px;">🍽</span>
                <span>Меню не выбрано</span>
                <small style="color:var(--gold); margin-top:5px;">Нажми, чтобы открыть меню</small>
            </div>`;
        return;
    }

    const grouped = {};
    let total = 0;
    
    window.selectedFoods.forEach(item => {
        total += item.price;
        if (!grouped[item.id]) {
            grouped[item.id] = { ...item, count: 0 };
        }
        grouped[item.id].count++;
    });

    const list = document.createElement('div');
    list.className = 'selected-list';

    Object.values(grouped).forEach(gItem => {
        const row = document.createElement('div');
        row.className = 'selected-item';
        row.innerHTML = `
            <div style="position:relative;">
                <img src="${gItem.img}" class="sel-img">
                <span style="position:absolute; top:-5px; right:35px; background:#fbc531; color:#000; font-weight:bold; border-radius:50%; width:20px; height:20px; font-size:12px; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                    ${gItem.count}
                </span>
            </div>
            <div class="sel-info">
                <div class="sel-title">${gItem.title}</div>
                <div class="sel-price">${gItem.price * gItem.count} ₽</div>
            </div>
            <button class="sel-remove" onclick="removeOneInstance(${gItem.id})" title="Убрать одну порцию">➖</button>
        `;
        list.appendChild(row);
    });

    const totalRow = document.createElement('div');
    totalRow.className = 'cart-total';
    totalRow.innerHTML = `<span class="total-label">Итого:</span><span class="total-sum">${total} ₽</span>`;

    cartDisplayMain.appendChild(list);
    cartDisplayMain.appendChild(totalRow);
}

window.removeOneInstance = function(id) {
    const index = window.selectedFoods.findIndex(f => f.id === id);
    if (index !== -1) {
        window.selectedFoods.splice(index, 1);
        updateMainCartUI();
    }
}

// --- 7. ПРОСМОТР ФОТО ---

window.openImageViewer = function(src) {
    if (window.event) window.event.stopPropagation();
    if (imageViewer && viewerImg) {
        viewerImg.src = src;
        imageViewer.classList.remove('hidden');
        setTimeout(() => imageViewer.style.opacity = '1', 10);
    }
}

window.closeImageViewer = function() {
    if (imageViewer) {
        imageViewer.style.opacity = '0';
        setTimeout(() => {
            imageViewer.classList.add('hidden');
            if (viewerImg) viewerImg.src = '';
        }, 300);
    }
}

// Глобальные вызовы для HTML
window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.scrollCategories = scrollCategories;

document.addEventListener('DOMContentLoaded', () => {
    updateMainCartUI(); // Если корзина пуста при старте
});