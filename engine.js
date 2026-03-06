// --- НАСТРОЙКИ ВРЕМЕНИ ---
const RITUAL_DURATION = 12000; // 12 секунд анимации
const PULL_AUDIO_SPEED = 2.0;  // Ускорение звука призыва

// --- ПЕРЕМЕННЫЕ СОСТОЯНИЯ ---
let currentStory = null;    
let currentLineIndex = 0;   
let availableStories = [...storiesData];

// --- ЭЛЕМЕНТЫ СО СТРАНИЦЫ ---
const menuScreen = document.getElementById('menu-screen');
const gachaScreen = document.getElementById('gacha-screen');
const storyScreen = document.getElementById('story-screen');
const endScreen = document.getElementById('end-screen'); 

const gachaTitle = document.querySelector('.gacha-title'); 
const gachaArea = document.querySelector('.gacha-area');
const spinBtn = document.getElementById('spin-btn');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const textBox = document.getElementById('text-box');

const storyImage = document.getElementById('story-image');
const storyText = document.getElementById('story-text');
const flashOverlay = document.getElementById('flash-overlay');

// --- АУДИО ЭЛЕМЕНТЫ ---
const bgm = document.getElementById('bgm');
const sfxPull = document.getElementById('sfx-pull');
const sfxPulse = document.getElementById('sfx-pulse'); // НОВОЕ

// Настройка громкости
bgm.volume = 0.4;       
sfxPull.volume = 1.0;   
sfxPulse.volume = 1.0; // Громкий удар

// --- НАЗНАЧАЕМ КЛИКИ ПО КНОПКАМ ---
startBtn.addEventListener('click', () => {
    bgm.play().catch(e => console.log("Автоплей заблокирован", e));
    switchScreen(menuScreen, gachaScreen);
});

spinBtn.addEventListener('click', executeEpicSpin);
textBox.addEventListener('click', nextLine);
restartBtn.addEventListener('click', resetGame);

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

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ---
function switchScreen(hideScreen, showScreen) {
    hideScreen.classList.add('hidden');
    setTimeout(() => {
        showScreen.classList.remove('hidden');
    }, 100);
}

// --- ЭПИЧНАЯ АНИМАЦИЯ И ЗВУК ---
function executeEpicSpin() {
    if (availableStories.length === 0) return;

    // 1. ЗАПУСК ЗВУКА ПРИЗЫВА
    sfxPull.currentTime = 0; 
    sfxPull.playbackRate = PULL_AUDIO_SPEED; 
    sfxPull.play();
    
    // Приглушаем фон
    let fadeOut = setInterval(() => {
        if (bgm.volume > 0.1) bgm.volume -= 0.05;
        else clearInterval(fadeOut);
    }, 50);

    spinBtn.disabled = true;
    spinBtn.style.opacity = '0'; 
    gachaTitle.style.opacity = '0'; 
    
    gachaArea.classList.add('summoning');

    const particlesContainer = document.getElementById('particles-container');
    
    // Частицы
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

    // --- ТАЙМЛАЙН ---
    
    // Тряска перед концом
    setTimeout(() => {
        document.querySelector('.game-container').classList.add('shake-hard');
    }, RITUAL_DURATION - 1500);

    // ФИНАЛ: Вспышка + Звук удара
    setTimeout(() => {
        // НОВОЕ: Играем звук удара/пульса
        sfxPulse.currentTime = 0;
        sfxPulse.play();

        flashOverlay.classList.add('flash-active');
        
        // Стоп звук призыва
        sfxPull.pause();
        sfxPull.currentTime = 0;

        // Возврат громкости фона (можно чуть задержать, чтобы слышать удар)
        setTimeout(() => { bgm.volume = 0.4; }, 1000);
        
        clearInterval(particleInterval);
        if(particlesContainer) particlesContainer.innerHTML = ''; 
        
        const randomIndex = Math.floor(Math.random() * availableStories.length);
        currentStory = availableStories[randomIndex];
        availableStories.splice(randomIndex, 1);

        currentLineIndex = 0;
        storyImage.src = currentStory.image;
        updateTextUI();

        setTimeout(() => {
            gachaArea.classList.remove('summoning');
            document.querySelector('.game-container').classList.remove('shake-hard');
            
            spinBtn.style.opacity = '1';
            gachaTitle.style.opacity = '1';
            spinBtn.disabled = false;
            
            switchScreen(gachaScreen, storyScreen);
            flashOverlay.classList.remove('flash-active');
            
        }, 500); 

    }, RITUAL_DURATION); 
}

// --- ЧТЕНИЕ НОВЕЛЛЫ ---
function nextLine() {
    currentLineIndex++; 

    if (currentLineIndex >= currentStory.lines.length) {
        if (availableStories.length === 0) {
            switchScreen(storyScreen, endScreen);
        } else {
            switchScreen(storyScreen, gachaScreen);
        }
    } else {
        updateTextUI();
    }
}

function updateTextUI() {
    storyText.innerText = currentStory.lines[currentLineIndex];
}

function resetGame() {
    availableStories = [...storiesData];
    switchScreen(endScreen, menuScreen);
}