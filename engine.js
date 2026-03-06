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

// --- НАЗНАЧАЕМ КЛИКИ ПО КНОПКАМ ---
startBtn.addEventListener('click', () => switchScreen(menuScreen, gachaScreen));
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
        
        snow.style.animation = `
            fall ${fallDuration}s linear ${delay}s infinite,
            sway ${swayDuration}s ease-in-out alternate infinite
        `;
        
        container.appendChild(snow);
    }
}
createSnow();

// --- ГЕНЕРАТОР РУН (НОВОЕ) ---
function generateRunes() {
    const runeContainer = document.getElementById('rune-circle');
    // Скандинавские руны (Футарк)
    const runes = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ";
    const radius = 150; // Радиус круга в пикселях
    const totalRunes = 24; // Сколько рун отрисовать
    
    runeContainer.innerHTML = ''; // Очищаем, если что-то было

    for (let i = 0; i < totalRunes; i++) {
        const char = runes[i % runes.length];
        const runeEl = document.createElement('div');
        runeEl.classList.add('rune-char');
        runeEl.innerText = char;
        
        // Математика круга
        const angle = (i / totalRunes) * (2 * Math.PI); // Угол в радианах
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Поворачиваем каждую букву, чтобы она "смотрела" из центра или стояла ровно
        // translate сдвигает от центра, rotate поворачивает саму букву
        runeEl.style.transform = `translate(${x}px, ${y}px) rotate(${angle * (180/Math.PI) + 90}deg)`;
        
        runeContainer.appendChild(runeEl);
    }
}
// Генерируем руны при загрузке
generateRunes();

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ---
function switchScreen(hideScreen, showScreen) {
    hideScreen.classList.add('hidden');
    setTimeout(() => {
        showScreen.classList.remove('hidden');
    }, 100);
}

// --- ЭПИЧНАЯ АНИМАЦИЯ ---
function executeEpicSpin() {
    if (availableStories.length === 0) return;

    spinBtn.disabled = true;
    spinBtn.style.opacity = '0'; 
    gachaTitle.style.opacity = '0'; 
    
    // Включаем руны, волны и свечение
    gachaArea.classList.add('summoning');

    const particlesContainer = document.getElementById('particles-container');
    
    // Генерация летящих частиц
    const particleInterval = setInterval(() => {
        const p = document.createElement('div');
        p.classList.add('energy-particle');
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 160; // Чуть дальше рун
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
    }, 30); 

    // ЭТАПЫ РИТУАЛА
    
    // 2.5 сек - Пик напряжения (тряска)
    setTimeout(() => {
        document.querySelector('.game-container').classList.add('shake-hard');
    }, 2500);

    // 3.0 сек - Вспышка и результат
    setTimeout(() => {
        flashOverlay.classList.add('flash-active');
        
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
            
        }, 300); 

    }, 3000); 
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