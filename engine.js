// --- НАСТРОЙКИ ВРЕМЕНИ ---
const RITUAL_DURATION = 12000; // 12 секунд анимации (ритуал)
const PULL_AUDIO_SPEED = 2.0;  // Ускорение звука призыва

// --- ПЕРЕМЕННЫЕ СОСТОЯНИЯ ---
let currentStory = null;    
let currentLineIndex = 0;   
let availableStories = [...storiesData]; 

// --- СИСТЕМА СОХРАНЕНИЙ (ГАЛЕРЕЯ) ---
let unlockedStoryIds = JSON.parse(localStorage.getItem('northernClanUnlocks')) || [];
let currentGalleryIndex = 0; 
let previousScreen = null;   

// --- ЭЛЕМЕНТЫ СО СТРАНИЦЫ ---
const menuScreen = document.getElementById('menu-screen');
const gachaScreen = document.getElementById('gacha-screen');
const storyScreen = document.getElementById('story-screen');
const cardScreen = document.getElementById('card-screen'); 
const endScreen = document.getElementById('end-screen'); 
const galleryScreen = document.getElementById('gallery-screen'); 

// --- ИНТЕРФЕЙС ---
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

// --- ЛАЙТБОКС ---
const fullscreenModal = document.getElementById('fullscreen-modal');
const fullscreenImage = document.getElementById('fullscreen-image');
const closeFullscreenBtn = document.getElementById('close-fullscreen-btn');

// --- АУДИО ---
const bgm = document.getElementById('bgm');
const sfxPull = document.getElementById('sfx-pull');
const sfxPulse = document.getElementById('sfx-pulse');

bgm.volume = 0.4;       
sfxPull.volume = 1.0;   
sfxPulse.volume = 1.0; 

// --- КЛИКИ ---
startBtn.addEventListener('click', () => {
    bgm.play().catch(e => console.log("Автоплей заблокирован браузером", e));
    
    // НОВОЕ: Сброс галереи при начале НОВОЙ игры
    // Если игрок уже что-то открывал, мы это стираем, так как начинается новое расследование
    if (unlockedStoryIds.length > 0) {
        localStorage.removeItem('northernClanUnlocks');
        unlockedStoryIds = [];
        renderGalleryCard(); // Обновляем визуал галереи (закрываем замки)
    }

    switchScreen(menuScreen, gachaScreen);
});

spinBtn.addEventListener('click', executeEpicSpin);
textBox.addEventListener('click', nextLine);
cardBtn.addEventListener('click', closeCard);
restartBtn.addEventListener('click', resetGame); // Просто возвращает в меню

// Галерея
openGalleryBtn.addEventListener('click', openGallery);
closeGalleryBtn.addEventListener('click', closeGallery);
resetGalleryBtn.addEventListener('click', clearGalleryProgress); 
prevGalleryBtn.addEventListener('click', () => slideGallery(-1));
nextGalleryBtn.addEventListener('click', () => slideGallery(1));

// Лайтбокс
gCardImage.addEventListener('click', openFullscreen);
closeFullscreenBtn.addEventListener('click', closeFullscreen);
fullscreenModal.addEventListener('click', (e) => {
    if (e.target === fullscreenModal) closeFullscreen();
});

// --- ГЕНЕРАТОРЫ ---
function createSnow() {
    const container = document.getElementById('snow-container');
    const snowflakeCount = 70; const symbols = ['❅', '❆', '❄', '•']; 
    for (let i = 0; i < snowflakeCount; i++) {
        let snow = document.createElement('div'); snow.classList.add('snowflake');
        snow.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        let size = Math.random() * 1.2 + 0.4; let left = Math.random() * 100; 
        let fallDuration = Math.random() * 10 + 10; let swayDuration = Math.random() * 3 + 2; 
        let delay = Math.random() * -20; let opacity = Math.random() * 0.7 + 0.3; 
        let blur = Math.random() < 0.4 ? 'blur(3px)' : 'none'; 
        snow.style.fontSize = `${size}rem`; snow.style.left = `${left}vw`;
        snow.style.opacity = opacity; snow.style.filter = blur;
        snow.style.animation = `fall ${fallDuration}s linear ${delay}s infinite, sway ${swayDuration}s ease-in-out alternate infinite`;
        container.appendChild(snow);
    }
}
function generateRunes() {
    const runeContainer = document.getElementById('rune-circle');
    const runes = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ"; const radius = 150; const totalRunes = 24; 
    runeContainer.innerHTML = ''; 
    for (let i = 0; i < totalRunes; i++) {
        const char = runes[i % runes.length]; const runeEl = document.createElement('div');
        runeEl.classList.add('rune-char'); runeEl.innerText = char;
        const angle = (i / totalRunes) * (2 * Math.PI); const x = Math.cos(angle) * radius; const y = Math.sin(angle) * radius;
        runeEl.style.transform = `translate(${x}px, ${y}px) rotate(${angle * (180/Math.PI) + 90}deg)`;
        runeContainer.appendChild(runeEl);
    }
}
createSnow(); generateRunes();

// --- ПЕРЕХОД ЭКРАНОВ ---
function switchScreen(hideScreen, showScreen) {
    hideScreen.classList.add('hidden');
    setTimeout(() => { showScreen.classList.remove('hidden'); }, 100);
}

// --- ЭПИЧНАЯ АНИМАЦИЯ ---
function executeEpicSpin() {
    if (availableStories.length === 0) return;

    sfxPull.currentTime = 0; sfxPull.playbackRate = PULL_AUDIO_SPEED; sfxPull.play();
    let fadeOut = setInterval(() => {
        if (bgm.volume > 0.1) bgm.volume -= 0.05; else clearInterval(fadeOut);
    }, 50);

    spinBtn.disabled = true; spinBtn.style.opacity = '0'; gachaTitle.style.opacity = '0'; 
    openGalleryBtn.classList.add('hide-ui'); 
    
    gachaArea.classList.add('summoning'); globalRays.classList.add('active'); 

    const particlesContainer = document.getElementById('particles-container');
    const particleInterval = setInterval(() => {
        const p = document.createElement('div'); p.classList.add('energy-particle');
        const angle = Math.random() * Math.PI * 2; const distance = 160; 
        const x = Math.cos(angle) * distance; const y = Math.sin(angle) * distance;
        p.style.left = `50%`; p.style.top = `50%`; p.style.marginLeft = `${x}px`; p.style.marginTop = `${y}px`;
        p.style.setProperty('--tx', `${-x}px`); p.style.setProperty('--ty', `${-y}px`);
        p.style.animation = `particle-in 0.5s ease-in forwards`;
        if(particlesContainer) particlesContainer.appendChild(p);
        setTimeout(() => p.remove(), 500);
    }, 40); 

    setTimeout(() => { document.querySelector('.game-container').classList.add('shake-hard'); }, RITUAL_DURATION - 1500);

    setTimeout(() => {
        sfxPulse.currentTime = 0; sfxPulse.play();
        flashOverlay.classList.add('flash-active');
        sfxPull.pause(); sfxPull.currentTime = 0;
        setTimeout(() => { bgm.volume = 0.4; }, 1000);
        
        clearInterval(particleInterval); if(particlesContainer) particlesContainer.innerHTML = ''; 
        
        const randomIndex = Math.floor(Math.random() * availableStories.length);
        currentStory = availableStories[randomIndex];
        availableStories.splice(randomIndex, 1);

        // Сохраняем в галерею
        if (!unlockedStoryIds.includes(currentStory.id)) {
            unlockedStoryIds.push(currentStory.id);
            localStorage.setItem('northernClanUnlocks', JSON.stringify(unlockedStoryIds));
        }

        currentLineIndex = 0;
        storyImage.src = currentStory.image;
        updateTextUI();

        setTimeout(() => {
            gachaArea.classList.remove('summoning'); globalRays.classList.remove('active'); 
            document.querySelector('.game-container').classList.remove('shake-hard');
            switchScreen(gachaScreen, storyScreen);
            flashOverlay.classList.remove('flash-active');
        }, 500); 

    }, RITUAL_DURATION); 
}

// --- ЧТЕНИЕ ---
function nextLine() {
    currentLineIndex++; 
    if (currentLineIndex >= currentStory.lines.length) {
        showCardScreen(); 
    } else {
        updateTextUI(); 
    }
}
function updateTextUI() { storyText.innerText = currentStory.lines[currentLineIndex]; }

function showCardScreen() {
    cardImage.src = currentStory.image;
    cardTitle.innerText = currentStory.meetName || "Неизвестным"; 
    switchScreen(storyScreen, cardScreen);
}

function closeCard() {
    spinBtn.style.opacity = '1'; gachaTitle.style.opacity = '1'; spinBtn.disabled = false;
    openGalleryBtn.classList.remove('hide-ui'); 

    if (availableStories.length === 0) {
        switchScreen(cardScreen, endScreen); 
    } else {
        switchScreen(cardScreen, gachaScreen); 
    }
}

// --- ГАЛЕРЕЯ ---
function openGallery() {
    const activeScreen = document.querySelector('.screen:not(.hidden)');
    if (activeScreen && activeScreen.id !== 'gallery-screen') {
        previousScreen = activeScreen;
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    openGalleryBtn.classList.add('hide-ui'); 
    galleryScreen.classList.remove('hidden');
    currentGalleryIndex = 0;
    renderGalleryCard();
}

function closeGallery() {
    galleryScreen.classList.add('hidden');
    openGalleryBtn.classList.remove('hide-ui');
    if (previousScreen) { previousScreen.classList.remove('hidden'); } 
    else { menuScreen.classList.remove('hidden'); }
}

function slideGallery(direction) {
    currentGalleryIndex += direction;
    if (currentGalleryIndex < 0) currentGalleryIndex = storiesData.length - 1;
    if (currentGalleryIndex >= storiesData.length) currentGalleryIndex = 0;
    renderGalleryCard();
}

function renderGalleryCard() {
    const storyData = storiesData[currentGalleryIndex];
    const isUnlocked = unlockedStoryIds.includes(storyData.id);
    galleryCounter.innerText = `${currentGalleryIndex + 1} / ${storiesData.length}`;
    gCardImage.src = storyData.image; 

    if (isUnlocked) {
        gCardTitle.innerText = storyData.meetName;
        gCardLocked.classList.add('hidden'); 
        gCardImage.style.cursor = "zoom-in";
    } else {
        gCardTitle.innerText = "???";
        gCardLocked.classList.remove('hidden'); 
        gCardImage.style.cursor = "default";
    }
}

function clearGalleryProgress() {
    if (confirm("Вы уверены, что хотите удалить все открытые воспоминания?")) {
        localStorage.removeItem('northernClanUnlocks');
        unlockedStoryIds = [];
        renderGalleryCard();
    }
}

// --- ЛАЙТБОКС ---
function openFullscreen() {
    if (!gCardLocked.classList.contains('hidden')) return; 
    fullscreenImage.src = gCardImage.src;
    fullscreenModal.classList.remove('hidden');
}
function closeFullscreen() { fullscreenModal.classList.add('hidden'); }

// --- ВОЗВРАТ В МЕНЮ ---
function resetGame() {
    // Просто переключаем экран и восстанавливаем пул историй для следующей игры
    // Галерея НЕ стирается здесь, она сотрется только по нажатию кнопки Старт
    availableStories = [...storiesData];
    switchScreen(endScreen, menuScreen);
}