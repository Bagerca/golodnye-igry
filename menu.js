let fullMenuData = [];

document.addEventListener("DOMContentLoaded", () => {
    initMenu();
});

async function initMenu() {
    try {
        const response = await fetch('menu.json');
        if (!response.ok) throw new Error("Файл не найден");
        fullMenuData = await response.json();
    } catch (error) {
        console.error("Ошибка:", error);
    }
}

function openMenu() {
    document.getElementById('menu-modal').classList.remove('hidden');
    renderCategories();
    const firstIndex = fullMenuData.findIndex(c => c.items.length > 0);
    renderItems(firstIndex !== -1 ? firstIndex : 0);
}

function closeMenu() {
    document.getElementById('menu-modal').classList.add('hidden');
    if (typeof updateCartUI === "function") updateCartUI();
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';
    
    fullMenuData.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.classList.add('cat-btn');
        btn.textContent = cat.category;
        btn.onclick = () => renderItems(index);
        container.appendChild(btn);
    });
}

function renderItems(categoryIndex) {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    document.querySelectorAll('.cat-btn').forEach((btn, idx) => {
        if (idx === categoryIndex) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const items = fullMenuData[categoryIndex]?.items || [];

    if (items.length === 0) {
        container.innerHTML = '<p style="color:#aaa; width:100%; text-align:center;">Пусто...</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('menu-item');
        
        if (typeof selectedFoods !== 'undefined' && selectedFoods.some(f => f.id === item.id)) {
            card.classList.add('active');
        }

        card.onclick = () => toggleFood(item, card);

        // --- ГЕНЕРАЦИЯ HTML ДЛЯ CSS-СЛОЕВ ---
        card.innerHTML = `
            <img src="${item.img}" class="menu-bg-img" alt="${item.title}" loading="lazy">
            <div class="item-gradient"></div>
            <div class="price-badge">${item.price} ₽</div>

            <div class="item-info">
                <div class="item-title">${item.title}</div>
                <div class="item-desc">${item.desc}</div>
                
                <div class="nut-badges">
                    <div class="nut-badge">${item.nutrition.kcal} Ккал</div>
                    <div class="nut-badge">${item.nutrition.prot} Б</div>
                    <div class="nut-badge">${item.nutrition.fats} Ж</div>
                    <div class="nut-badge">${item.nutrition.carb} У</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function toggleFood(item, card) {
    if (typeof selectedFoods === 'undefined') return;
    const idx = selectedFoods.findIndex(f => f.id === item.id);
    if (idx > -1) {
        selectedFoods.splice(idx, 1);
        card.classList.remove('active');
    } else {
        selectedFoods.push(item);
        card.classList.add('active');
    }
}