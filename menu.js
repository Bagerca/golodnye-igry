// --- menu.js ---

// Глобальные переменные
let menuData = [];

// Проверка/создание глобального массива заказа (для взаимодействия со script.js)
if (typeof selectedFoods === 'undefined') {
    var selectedFoods = []; 
}

// Элементы DOM (Модальное окно и меню)
const menuModal = document.getElementById('menu-modal');
const menuContainer = document.getElementById('menu-container');
const categoriesContainer = document.getElementById('categories-container');
const cartDisplayMain = document.getElementById('selected-food-display');
const modalTotalPrice = document.getElementById('modal-total-price');

// Элементы для прокрутки категорий
const scrollLeftBtn = document.getElementById('scroll-left');
const scrollRightBtn = document.getElementById('scroll-right');

// Элементы для просмотра фото
const imageViewer = document.getElementById('image-viewer');
const viewerImg = document.getElementById('viewer-img');

// --- 1. ЗАГРУЗКА И ИНИЦИАЛИЗАЦИЯ ---

async function initMenu() {
    try {
        const response = await fetch('menu.json');
        if (!response.ok) throw new Error('Ошибка сети');
        menuData = await response.json();
        
        renderCategories();
        
        // Открываем первую категорию, если она есть
        if (menuData.length > 0) {
            renderItems(menuData[0].items); 
            updateCategoryActiveState(0);
        }
        
        // Инициализируем проверку стрелок после рендера
        setTimeout(checkScrollArrows, 100);

    } catch (error) {
        console.error("Ошибка:", error);
        menuContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px; color:#a4b0be;">❄️ Меню замело снегом... (Ошибка загрузки menu.json)</div>';
    }
}

// --- 2. УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ ---

function openMenu() {
    // Если меню еще не загружено, грузим
    if (menuData.length === 0) {
        initMenu();
    } else {
        // Если уже загружено, обновляем текущий вид
        const activeBtn = document.querySelector('.cat-btn.active');
        if (activeBtn) activeBtn.click();
        else if (menuData.length > 0) renderItems(menuData[0].items);
    }
    
    menuModal.classList.remove('hidden');
    // Небольшая задержка для запуска CSS transition
    setTimeout(() => {
        menuModal.classList.add('active');
        checkScrollArrows(); // Проверяем стрелки при открытии
    }, 10);
    
    updateModalTotal();
}

function closeMenu() {
    menuModal.classList.remove('active');
    setTimeout(() => menuModal.classList.add('hidden'), 300);
    
    // При закрытии обязательно обновляем корзину на главном экране
    updateMainCartUI(); 
}

// --- 3. ЛОГИКА ПРОКРУТКИ КАТЕГОРИЙ ---

function scrollCategories(direction) {
    if (categoriesContainer) {
        const scrollAmount = 200; // Шаг прокрутки
        categoriesContainer.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    }
}

function checkScrollArrows() {
    if (!categoriesContainer || !scrollLeftBtn || !scrollRightBtn) return;

    // Скрываем левую стрелку, если мы в начале
    if (categoriesContainer.scrollLeft <= 10) {
        scrollLeftBtn.classList.add('hidden');
    } else {
        scrollLeftBtn.classList.remove('hidden');
    }

    // Скрываем правую стрелку, если дошли до конца
    const maxScroll = categoriesContainer.scrollWidth - categoriesContainer.clientWidth;
    
    if (categoriesContainer.scrollLeft >= maxScroll - 10) {
        scrollRightBtn.classList.add('hidden');
    } else {
        scrollRightBtn.classList.remove('hidden');
    }
}

// Слушатели для прокрутки
if (categoriesContainer) {
    categoriesContainer.addEventListener('scroll', checkScrollArrows);
    window.addEventListener('resize', checkScrollArrows);
}

// --- 4. РЕНДЕРИНГ (ОТРИСОВКА) ---

function renderCategories() {
    categoriesContainer.innerHTML = '';
    menuData.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.textContent = cat.category;
        btn.className = 'cat-btn';
        if (index === 0) btn.classList.add('active'); // Первая активна по умолчанию
        
        btn.onclick = () => {
            renderItems(cat.items);
            updateCategoryActiveState(index);
        };
        categoriesContainer.appendChild(btn);
    });
    // После добавления кнопок нужно проверить стрелки
    setTimeout(checkScrollArrows, 50);
}

function updateCategoryActiveState(index) {
    document.querySelectorAll('.cat-btn').forEach((btn, i) => {
        if (i === index) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function renderItems(items) {
    menuContainer.innerHTML = '';
    
    // Анимация появления списка
    menuContainer.style.opacity = '0';
    setTimeout(() => menuContainer.style.opacity = '1', 50);

    if (!items || items.length === 0) {
        menuContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#a4b0be; padding: 40px;">В этой категории пока пусто...</div>';
        return;
    }

    items.forEach(item => {
        // Считаем, сколько таких блюд уже в корзине
        const count = selectedFoods.filter(f => f.id === item.id).length;

        const card = document.createElement('div');
        card.className = 'menu-item fade-in';
        card.dataset.id = item.id;
        
        // --- ИСПРАВЛЕНИЕ: Формируем HTML для КБЖУ только если данные есть ---
        let nutritionHtml = '';
        if (item.nutrition) {
            nutritionHtml = `
                <div class="nutrition-row">
                    <div class="nut-item"><span>Ккал</span><span class="nut-val">${item.nutrition.kcal}</span></div>
                    <div class="nut-item"><span>Белки</span><span class="nut-val">${item.nutrition.prot}</span></div>
                    <div class="nut-item"><span>Жиры</span><span class="nut-val">${item.nutrition.fats}</span></div>
                    <div class="nut-item"><span>Угл.</span><span class="nut-val">${item.nutrition.carb}</span></div>
                </div>
            `;
        } else {
            // Если КБЖУ нет, можно оставить пусто или добавить отступ
            nutritionHtml = `<div style="margin-bottom: 15px;"></div>`; 
        }

        // Вес блюда (если есть)
        const weightHtml = item.weight ? `<div class="weight-badge">${item.weight}</div>` : '';

        card.innerHTML = `
            <div class="img-container">
                <img src="${item.img}" alt="${item.title}" loading="lazy">
                
                <button class="expand-btn" onclick="openImageViewer('${item.img}')" title="Увеличить фото">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                </button>
                
                ${weightHtml}
            </div>
            
            <div class="item-content">
                <div class="item-header">
                    <div class="item-title">${item.title}</div>
                    <div class="item-price">${item.price} ₽</div>
                </div>
                <div class="item-desc">${item.desc}</div>
                
                ${nutritionHtml}

                <div class="item-actions" id="actions-${item.id}">
                    ${getButtonHtml(item.id, count)}
                </div>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}

// --- 5. ЛОГИКА КОРЗИНЫ (ДОБАВЛЕНИЕ/УДАЛЕНИЕ) ---

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

function increaseItem(id) {
    const product = findProduct(id);
    if (product) {
        selectedFoods.push(product); 
        updateCardUI(id);            
        updateModalTotal();          
    }
}

function decreaseItem(id) {
    const index = selectedFoods.findIndex(f => f.id === id);
    if (index !== -1) {
        selectedFoods.splice(index, 1);
        updateCardUI(id);
        updateModalTotal();
    }
}

function updateCardUI(id) {
    const actionContainer = document.getElementById(`actions-${id}`);
    if (actionContainer) {
        const count = selectedFoods.filter(f => f.id === id).length;
        actionContainer.innerHTML = getButtonHtml(id, count);
    }
}

function updateModalTotal() {
    const total = selectedFoods.reduce((sum, item) => sum + item.price, 0);
    if(modalTotalPrice) modalTotalPrice.textContent = total;
}

// --- 6. КОРЗИНА НА ГЛАВНОМ ЭКРАНЕ ---

function updateMainCartUI() {
    if (!cartDisplayMain) return;
    cartDisplayMain.innerHTML = '';
    
    if (selectedFoods.length === 0) {
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
    
    selectedFoods.forEach(item => {
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

function removeOneInstance(id) {
    const index = selectedFoods.findIndex(f => f.id === id);
    if (index !== -1) {
        selectedFoods.splice(index, 1);
        updateMainCartUI();
    }
}

// --- 7. ФУНКЦИИ ПРОСМОТРА ФОТО ---

function openImageViewer(src) {
    event.stopPropagation();
    if (imageViewer && viewerImg) {
        viewerImg.src = src;
        imageViewer.classList.remove('hidden');
        setTimeout(() => imageViewer.style.opacity = '1', 10);
    }
}

function closeImageViewer() {
    if (imageViewer) {
        imageViewer.style.opacity = '0';
        setTimeout(() => {
            imageViewer.classList.add('hidden');
            if (viewerImg) viewerImg.src = '';
        }, 300);
    }
}

// --- 8. ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', () => {
    updateMainCartUI();
    const observer = new MutationObserver(checkScrollArrows);
    if(categoriesContainer) {
        observer.observe(categoriesContainer, { childList: true, subtree: true });
    }
});