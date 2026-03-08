// --- НАСТРОЙКИ ВРЕМЕНИ ---
const RITUAL_DURATION = 12000; // 12 секунд анимации (ритуал)
const PULL_AUDIO_SPEED = 2.0;  // Ускорение звука призыва

// --- ПЕРЕМЕННЫЕ СОСТОЯНИЯ ---
let currentStory = null;    
let currentLineIndex = 0;   
let availableStories = [...storiesData]; // Копия базы данных для текущей сессии

// --- СИСТЕМА СОХРАНЕНИЙ (ГАЛЕРЕЯ) ---
// Загружаем открытые ID из памяти браузера (или создаем пустой массив)
let unlockedStoryIds = JSON.parse(localStorage.getItem('northernClanUnlocks')) || [];
let currentGalleryIndex = 0; // Индекс карточки в галерее
let previousScreen = null;   // Экран, с которого мы зашли в галерею

// --- ЭЛЕМЕНТЫ СО СТРАНИЦЫ (Экраны) ---
const menuScreen = document.getElementById('menu-screen');
const gachaScreen = document.getElementById('gacha-screen');
const storyScreen = document.getElementById('story-screen');
const cardScreen = document.getElementById('card-screen'); 
const endScreen = document.getElementById('end-screen'); 
const galleryScreen = document.getElementById('gallery-screen'); 

// --- ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ---
const globalRays = document.getElementById('global-rays-container'); 
const gachaTitle = document.querySelector('.gacha-title'); 
const gachaArea = document.querySelector('.gacha-area');
const spinBtn = document.getElementById('spin-btn');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const textBox = document.getElementById('text-box');
const cardBtn = document.getElementById('card-btn'); 

const openGalleryBtn = document.getElementById('open-gallery-btn');
const closeGalleryBtn = document.getElementById('close-gallery-btn');
const resetGalleryBtn = document.getElementById('reset-gallery-btn'); 
const prevGalleryBtn = document.getElementById('prev-gallery');
const nextGalleryBtn = document.getElementById('next-gallery');

const gCardImage = document.getElementById('g-card-image');
const gCardTitle = document.getElementById('g-card-title');
const gCardLocked = document.getElementById('g-card-locked');
const galleryCounter = document.getElementById('gallery-counter');

const storyImage = document.getElementById('story-image');
const storyText = document.getElementById('story-text');
const cardImage = document.getElementById('card-image'); 
const cardTitle = document.getElementById('card-title'); 
const flashOverlay = document.getElementById('flash-overlay');

// --- ЭЛЕМЕНТЫ ЛАЙТБОКСА (Фулскрин картинки) ---
const fullscreenModal = document.getElementById('fullscreen-modal');
const fullscreenImage = document.getElementById('fullscreen-image');
const closeFullscreenBtn = document.getElementById('close-fullscreen-btn');

// --- АУДИО ЭЛЕМЕНТЫ ---
const bgm = document.getElementById('bgm');
const sfxPull = document.getElementById('sfx-pull');
const sfxPulse = document.getElementById('sfx-pulse');

// Настройка стартовой громкости
bgm.volume = 0.4;       
sfxPull.volume = 1.0;   
sfxPulse.volume = 1.0; 

// --- НАЗНАЧАЕМ КЛИКИ ПО КНОПКАМ ---
startBtn.addEventListener('click', () => {
    // При первом клике запускаем фоновую музыку
    bgm.play().catch(e => console.log("Автоплей заблокирован браузером", e));
    switchScreen(menuScreen, gachaScreen);
});

spinBtn.addEventListener('click', executeEpicSpin);
textBox.addEventListener('click', nextLine);
cardBtn.addEventListener('click', closeCard);
restartBtn.addEventListener('click', resetGame);

// Клики Галереи
openGalleryBtn.addEventListener('click', openGallery);
closeGalleryBtn.addEventListener('click', closeGallery);
resetGalleryBtn.addEventListener('click', clearGalleryProgress); 
prevGalleryBtn.addEventListener('click', () => slideGallery(-1));
nextGalleryBtn.addEventListener('click', () => slideGallery(1));

// Клики Лайтбокса (Фулскрин)
gCardImage.addEventListener('click', openFullscreen);
closeFullscreenBtn.addEventListener('click', closeFullscreen);
// Закрытие по клику на фон (мимо картинки)
fullscreenModal.addEventListener('click', (e) => {
    if (e.target === fullscreenModal) closeFullscreen();
});

// --- ГЕНЕРАТОР СНЕГА ---
function createSnow() {
    const container = document.getElementById('snow-container');
    const snowflakeCount = 70; 
    const symbols = ['❅', '❆', '❄', '•']; 

    for (let i = 0; i < snowflakeCount; i++) {
        let snow = document.createElement('div');
        snow.classList.add('snowflake');
        snow.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        
        let size = Math.random() * 1.2 + 0.4; 
        let left = Math.random() * 100; 
        let fallDuration = Math.random() * 10 + 10; 
        let swayDuration = Math.random() * 3 + 2; 
        let delay = Math.random() * -20; 
        let opacity = Math.random() * 0.7 + 0.3; 
        let blur = Math.random() < 0.4 ? 'blur(3px)' : 'none'; 
        
        snow.style.fontSize = `${size}rem`;
        snow.style.left = `${left}vw`;
        snow.style.opacity = opacity;
        snow.style.filter = blur;
        snow.style.animation = `fall ${fallDuration}s linear ${delay}s infinite, sway ${swayDuration}s ease-in-out alternate infinite`;
        
        container.appendChild(snow);
    }
}
createSnow();

// --- ГЕНЕРАТОР РУН ---
function generateRunes() {
    const runeContainer = document.getElementById('rune-circle');
    const runes = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ";
    const radius = 150; 
    const totalRunes = 24; 
    
    runeContainer.innerHTML = ''; 

    for (let i = 0; i < totalRunes; i++) {
        const char = runes[i % runes.length];
        const runeEl = document.createElement('div');
        runeEl.classList.add('rune-char');
        runeEl.innerText = char;
        
        const angle = (i / totalRunes) * (2 * Math.PI); 
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        runeEl.style.transform = `translate(${x}px, ${y}px) rotate(${angle * (180/Math.PI) + 90}deg)`;
        runeContainer.appendChild(runeEl);
    }
}
generateRunes();

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ (Плавный переход экранов) ---
function switchScreen(hideScreen, showScreen) {
    hideScreen.classList.add('hidden');
    setTimeout(() => {
        showScreen.classList.remove('hidden');
    }, 100);
}

// --- ЭПИЧНАЯ АНИМАЦИЯ (ГАЧА) ---
function executeEpicSpin() {
    if (availableStories.length === 0) return;

    // 1. НАСТРОЙКА ЗВУКА
    sfxPull.currentTime = 0; 
    sfxPull.playbackRate = PULL_AUDIO_SPEED; 
    sfxPull.play();
    
    // Плавно приглушаем фоновую музыку (Ducking)
    let fadeOut = setInterval(() => {
        if (bgm.volume > 0.1) bgm.volume -= 0.05;
        else clearInterval(fadeOut);
    }, 50);

    // 2. ПОДГОТОВКА ИНТЕРФЕЙСА
    spinBtn.disabled = true;
    spinBtn.style.opacity = '0'; 
    gachaTitle.style.opacity = '0'; 
    openGalleryBtn.classList.add('hide-ui'); // Прячем кнопку галереи во время ритуала
    
    // Включаем эффекты (руны, свечение, глобальные лучи)
    gachaArea.classList.add('summoning');
    globalRays.classList.add('active'); 

    const particlesContainer = document.getElementById('particles-container');
    
    // 3. ГЕНЕРАЦИЯ ЧАСТИЦ МАГИИ
    const particleInterval = setInterval(() => {
        const p = document.createElement('div');
        p.classList.add('energy-particle');
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 160; 
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        p.style.left = `50%`; 
        p.style.top = `50%`;
        p.style.marginLeft = `${x}px`;
        p.style.marginTop = `${y}px`;
        p.style.setProperty('--tx', `${-x}px`);
        p.style.setProperty('--ty', `${-y}px`);
        p.style.animation = `particle-in 0.5s ease-in forwards`;
        
        if(particlesContainer) particlesContainer.appendChild(p);
        setTimeout(() => p.remove(), 500);
    }, 40); 

    // --- ТАЙМЛАЙН СОБЫТИЙ РИТУАЛА ---
    
    // Этап 1: Начало ТРЯСКИ (за 1.5 секунды до конца ритуала)
    setTimeout(() => {
        document.querySelector('.game-container').classList.add('shake-hard');
    }, RITUAL_DURATION - 1500);

    // Этап 2: ВСПЫШКА И КОНЕЦ (в момент окончания RITUAL_DURATION)
    setTimeout(() => {
        // Играем звук удара (пульса)
        sfxPulse.currentTime = 0;
        sfxPulse.play();

        // Запускаем белую вспышку
        flashOverlay.classList.add('flash-active');
        
        // Останавливаем звук призыва
        sfxPull.pause();
        sfxPull.currentTime = 0;

        // Возвращаем громкость фона
        setTimeout(() => { bgm.volume = 0.4; }, 1000);
        
        // Очищаем эффекты частиц
        clearInterval(particleInterval);
        if(particlesContainer) particlesContainer.innerHTML = ''; 
        
        // ВЫБОР ИСТОРИИ ИЗ ДОСТУПНЫХ
        const randomIndex = Math.floor(Math.random() * availableStories.length);
        currentStory = availableStories[randomIndex];
        availableStories.splice(randomIndex, 1);

        // --- СОХРАНЕНИЕ В ГАЛЕРЕЮ ---
        // Если этой истории еще нет в сохранениях - добавляем её
        if (!unlockedStoryIds.includes(currentStory.id)) {
            unlockedStoryIds.push(currentStory.id);
            // Сохраняем массив в память браузера (localStorage работает только со строками)
            localStorage.setItem('northernClanUnlocks', JSON.stringify(unlockedStoryIds));
        }

        // Подготавливаем текст и картинку
        currentLineIndex = 0;
        storyImage.src = currentStory.image;
        updateTextUI();

        // Отключаем эффекты и переходим на экран чтения
        setTimeout(() => {
            gachaArea.classList.remove('summoning');
            globalRays.classList.remove('active'); 
            document.querySelector('.game-container').classList.remove('shake-hard');
            
            switchScreen(gachaScreen, storyScreen);
            flashOverlay.classList.remove('flash-active');
            
        }, 500); // Вспышка держится 0.5 сек

    }, RITUAL_DURATION); 
}

// --- ЧТЕНИЕ НОВЕЛЛЫ ---
function nextLine() {
    currentLineIndex++; 

    // Если строчки текста закончились
    if (currentLineIndex >= currentStory.lines.length) {
        showCardScreen(); // Показываем Карточку Встречи
    } else {
        updateTextUI(); // Иначе показываем следующую строчку
    }
}

function updateTextUI() {
    storyText.innerText = currentStory.lines[currentLineIndex];
}

// --- ЛОГИКА КАРТОЧКИ ---
function showCardScreen() {
    cardImage.src = currentStory.image;
    cardTitle.innerText = currentStory.meetName || "Неизвестным"; 
    switchScreen(storyScreen, cardScreen);
}

function closeCard() {
    // Возвращаем интерфейс гачи
    spinBtn.style.opacity = '1';
    gachaTitle.style.opacity = '1';
    spinBtn.disabled = false;
    openGalleryBtn.classList.remove('hide-ui'); 

    // Проверяем, остались ли еще истории для прохождения в этой сессии
    if (availableStories.length === 0) {
        switchScreen(cardScreen, endScreen); 
    } else {
        switchScreen(cardScreen, gachaScreen); 
    }
}

// --- УМНАЯ СИСТЕМА ГАЛЕРЕИ ---

function openGallery() {
    // Находим экран, который открыт сейчас, и запоминаем его (чтобы потом вернуться)
    const activeScreen = document.querySelector('.screen:not(.hidden)');
    if (activeScreen && activeScreen.id !== 'gallery-screen') {
        previousScreen = activeScreen;
    }

    // Скрываем все экраны и кнопку галереи
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    openGalleryBtn.classList.add('hide-ui'); 
    
    // Показываем галерею
    galleryScreen.classList.remove('hidden');
    currentGalleryIndex = 0;
    renderGalleryCard();
}

function closeGallery() {
    galleryScreen.classList.add('hidden');
    openGalleryBtn.classList.remove('hide-ui');
    
    // Возвращаем игрока туда, где он был
    if (previousScreen) {
        previousScreen.classList.remove('hidden');
    } else {
        menuScreen.classList.remove('hidden'); // Запасной вариант
    }
}

function slideGallery(direction) {
    currentGalleryIndex += direction;
    
    // Зацикливаем слайдер
    if (currentGalleryIndex < 0) currentGalleryIndex = storiesData.length - 1;
    if (currentGalleryIndex >= storiesData.length) currentGalleryIndex = 0;
    
    renderGalleryCard();
}

function renderGalleryCard() {
    const storyData = storiesData[currentGalleryIndex];
    // Проверяем, есть ли ID текущей истории в массиве сохраненных
    const isUnlocked = unlockedStoryIds.includes(storyData.id);
    
    galleryCounter.innerText = `${currentGalleryIndex + 1} / ${storiesData.length}`;

    gCardImage.src = storyData.image; 

    if (isUnlocked) {
        gCardTitle.innerText = storyData.meetName;
        gCardLocked.classList.add('hidden'); // Прячем замок
        gCardImage.style.cursor = "zoom-in"; // Показываем курсор-лупу
    } else {
        gCardTitle.innerText = "???";
        gCardLocked.classList.remove('hidden'); // Показываем замок (он размоет картинку)
        gCardImage.style.cursor = "default"; // Обычный курсор
    }
}

// --- СБРОС ПРОГРЕССА В ГАЛЕРЕЕ ---
function clearGalleryProgress() {
    if (confirm("Вы уверены, что хотите удалить все открытые воспоминания? Это действие нельзя отменить.")) {
        localStorage.removeItem('northernClanUnlocks');
        unlockedStoryIds = [];
        renderGalleryCard(); // Перерисовываем карточку, чтобы она мгновенно "закрылась"
    }
}

// --- ПОЛНОЭКРАННЫЙ ПРОСМОТР (LIGHTBOX) ---
function openFullscreen() {
    // Если картинка заблокирована (виден замок), ничего не делаем
    if (!gCardLocked.classList.contains('hidden')) {
        return; 
    }

    fullscreenImage.src = gCardImage.src;
    fullscreenModal.classList.remove('hidden');
}

function closeFullscreen() {
    fullscreenModal.classList.add('hidden');
}

// --- ПЕРЕЗАПУСК ИГРОВОЙ СЕССИИ (Рулетки) ---
function resetGame() {
    // Восстанавливаем пул историй из базы данных
    availableStories = [...storiesData];
    switchScreen(endScreen, menuScreen);
}