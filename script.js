const fruits = ['👑', 'A', 'K', 'Q', 'J', '7', '♦', '♠', '♣', '♥', '🍋', '🍒', '🍇', '🍓']; // Фиксированный порядок символов
const reels = document.querySelectorAll('.reel');
const spinButton = document.getElementById('spin-button');
const scoreElement = document.getElementById('score');
let isSpinning = false;
let score = 0;
let stoppedReels = 0;
let spinningReelIndex = -1; // Индекс текущего вращающегося барабана
let currentReelIndex = 0;

// Константы
const REEL_HEIGHT = 100; // Высота одного символа
const TOTAL_SYMBOLS = 15; // Количество видимых символов в окне
const SPIN_DURATION = 8; // Длительность вращения в секундах
const STOP_DURATION = 1.5; // Длительность остановки в секундах
const SPIN_SPEED = 5; // Скорость вращения (пикселей в секунду)
const MAX_TRANSLATION = 5000; // Максимальное смещение по Y

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createReelStrip() {
    const strip = document.createElement('div');
    strip.className = 'reel-strip';
    
    // Создаем больше копий для плавного вращения
    const totalSets = 10;
    
    for (let i = 0; i < totalSets; i++) {
        const shuffledFruits = [...fruits];
        shuffleArray(shuffledFruits); // Перемешиваем символы для каждого набора
        shuffledFruits.forEach(fruit => {
            const item = document.createElement('div');
            item.className = 'reel-item';
            item.textContent = fruit;
            strip.appendChild(item);
        });
    }
    
    return strip;
}

document.addEventListener('DOMContentLoaded', () => {
    reels.forEach(reel => {
        const strip = createReelStrip();
        reel.appendChild(strip);
    });
});

function getRandomFruit() {
    return fruits[Math.floor(Math.random() * fruits.length)];
}

function updateScore(points) {
    score += points;
    scoreElement.textContent = score;
}

function getCenterFruit(reel) {
    const strip = reel.querySelector('.reel-strip');
    const items = strip.querySelectorAll('.reel-item');
    const reelRect = reel.getBoundingClientRect();
    const reelCenter = reelRect.top + reelRect.height / 2;
    
    // Находим фрукт, ближайший к центру барабана
    let closestItem = null;
    let minDistance = Infinity;
    
    items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(itemCenter - reelCenter);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestItem = item;
        }
    });
    
    return closestItem ? closestItem.textContent : fruits[0];
}

function countMatchingFruits(centerFruits) {
    const fruitCounts = {};
    let maxCount = 0;
    let winningFruit = null;

    // Count occurrences of each fruit
    centerFruits.forEach(fruit => {
        if (fruit) {
            fruitCounts[fruit] = (fruitCounts[fruit] || 0) + 1;
            if (fruitCounts[fruit] > maxCount) {
                maxCount = fruitCounts[fruit];
                winningFruit = fruit;
            }
        }
    });

    return { count: maxCount, fruit: winningFruit };
}

function checkWin() {
    const centerFruits = Array.from(reels).map(reel => getCenterFruit(reel));
    const fruitCounts = {};
    let maxCount = 0;
    let winningFruit = null;

    // Подсчет одинаковых фруктов
    centerFruits.forEach(fruit => {
        if (fruit) {
            fruitCounts[fruit] = (fruitCounts[fruit] || 0) + 1;
            if (fruitCounts[fruit] > maxCount) {
                maxCount = fruitCounts[fruit];
                winningFruit = fruit;
            }
        }
    });

    // Определение выигрыша
    let points = 0;
    let message = '';

    switch(maxCount) {
        case 5:
            points = 10000;
            message = `🎉 ДЖЕКПОТ! 5 одинаковых фруктов! +${points} очков!`;
            break;
        case 4:
            points = 200;
            message = `🎊 Отлично! 4 одинаковых фрукта! +${points} очков!`;
            break;
        case 3:
            points = 150;
            message = `🎈 Хорошо! 3 одинаковых фрукта! +${points} очков!`;
            break;
        case 2:
            points = 50;
            message = `✨ 2 одинаковых фрукта! +${points} очков!`;
            break;
        default:
            message = 'Попробуйте еще раз!';
    }

    if (points > 0) {
        // Подсветка выигрышных фруктов
        reels.forEach((reel, index) => {
            if (centerFruits[index] === winningFruit) {
                const items = reel.querySelectorAll('.reel-item');
                const centerItem = items[Math.floor(items.length / 2)];
                if (centerItem) {
                    centerItem.classList.add('win');
                    setTimeout(() => centerItem.classList.remove('win'), 1500);
                }
            }
        });

        // Особая анимация для джекпота
        if (points === 10000) {
            document.body.classList.add('jackpot');
            setTimeout(() => document.body.classList.remove('jackpot'), 3000);
        }

        updateScore(points);
    }
    
    showWinModal(message, centerFruits);
}

function spinReel(reel) {
    const strip = reel.querySelector('.reel-strip');
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';
    void strip.offsetHeight;
    strip.classList.add('spinning');
    console.log(`Барабан [${reel.dataset.index}] начал вращение`);
}

function stopNextReel() {
    if (currentReelIndex < reels.length) {
        const reel = reels[currentReelIndex];
        const strip = reel.querySelector('.reel-strip');
        
        if (!strip) return;
        
        strip.classList.remove('spinning');
        
        const fruitSetHeight = REEL_HEIGHT * fruits.length;
        const rotations = Math.floor(Math.random() * 2) + 2;
        const symbolIndex = Math.floor(Math.random() * fruits.length);
        const finalPosition = -(rotations * fruitSetHeight) - (symbolIndex * REEL_HEIGHT);
        
        strip.style.transition = `transform ${STOP_DURATION}s cubic-bezier(0.5, 0, 0.5, 1)`;
        strip.style.transform = `translateY(${finalPosition}px)`;
        
        setTimeout(() => {
            const centerFruit = getCenterFruit(reel);
            console.log(`Барабан [${reel.dataset.index}] остановился - выпало [${centerFruit}]`);
            
            currentReelIndex++;
            if (currentReelIndex === reels.length) {
                isSpinning = false;
                spinButton.textContent = 'SPIN';
                spinningReelIndex = -1;
                const finalFruits = Array.from(reels).map(reel => getCenterFruit(reel));
                console.log('Игра окончена! Ваши слоты:', finalFruits.join(', '));
                checkWin();
            }
        }, STOP_DURATION * 1000);
    }
}

function updateResults(message, fruits = []) {
    const resultMessage = document.querySelector('.result-message');
    const resultFruits = document.querySelector('.result-fruits');
    
    resultMessage.textContent = message;
    if (fruits.length > 0) {
        resultFruits.innerHTML = fruits.map(fruit => `<span>${fruit}</span>`).join('');
    }
}

function showWinModal(message, fruits) {
    updateResults(message, fruits);
    resetReelPositions();
}

function handleButtonClick() {
    if (!isSpinning) {
        console.log('=== НОВАЯ ИГРА ===');
        isSpinning = true;
        currentReelIndex = 0;
        spinningReelIndex = -1;
        spinButton.textContent = 'STOP';
        
        // Останавливаем фейерверк при новой игре
        fireworks.stop();
        
        // Обновляем сообщение
        updateResults('Крутим барабаны...');
        
        // Сначала сбрасываем позиции
        resetReelPositions();
        
        // Небольшая задержка перед началом новой игры
        setTimeout(() => {
            // Очищаем все барабаны перед новой игрой
            reels.forEach(reel => {
                const strips = reel.querySelectorAll('.reel-strip');
                strips.forEach(strip => strip.remove());
                
                // Создаем новый барабан
                const newStrip = createReelStrip();
                reel.appendChild(newStrip);
                
                // Запускаем вращение
                void newStrip.offsetHeight; // Форсируем перерисовку
                newStrip.classList.add('spinning');
                console.log(`Барабан [${reel.dataset.index}] начал вращение`);
            });
        }, 100);
    } else {
        stopNextReel();
    }
}

function resetReelPositions() {
    reels.forEach((reel, index) => {
        // Удаляем все существующие полоски
        const oldStrips = reel.querySelectorAll('.reel-strip');
        oldStrips.forEach(strip => strip.remove());
        
        // Создаем новую полоску с начальным фруктом
        const newStrip = createReelStrip();
        reel.appendChild(newStrip);
        
        // Сбрасываем все стили и классы
        newStrip.style.transform = 'translateY(0)';
        newStrip.classList.remove('spinning');
        
        // Устанавливаем индикатор в STOP
        const indicator = reel.querySelector('.reel-indicator');
        if (indicator) {
            indicator.textContent = 'STOP';
        }
        
        console.log(`Барабан [${index}] сброшен в начальное положение`);
    });
}

function startNewGame() {
    console.log('=== НОВАЯ ИГРА ===');
    
    // Сначала сбрасываем все барабаны
    resetReelPositions();
    
    // Устанавливаем начальные значения
    isSpinning = true;
    currentReelIndex = 0;
    spinningReelIndex = -1;
    spinButton.textContent = 'STOP';
    
    // Останавливаем фейерверк при новой игре
    fireworks.stop();
    
    // Обновляем сообщение
    updateResults('Крутим барабаны...', [], false);
    
    // Небольшая задержка перед началом вращения
    setTimeout(() => {
        reels.forEach(reel => {
            const strip = reel.querySelector('.reel-strip');
            if (strip) {
                strip.classList.add('spinning');
                console.log(`Барабан [${reel.dataset.index}] начал вращение`);
            }
        });
    }, 100);
}

function finishGame() {
    isSpinning = false;
    spinButton.textContent = 'SPIN';
    
    const symbols = Array.from(reels).map(reel => {
        const symbol = reel.querySelector('.reel-item');
        return symbol ? symbol.textContent : '';
    });
    
    // Считаем количество каждого символа
    const symbolCounts = {};
    symbols.forEach(symbol => {
        symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });
    
    // Проверяем комбинации
    let points = 0;
    let message = '';
    
    // Проверяем корону
    if (symbolCounts['👑'] >= 3) {
        points = 200;
        message = 'Джекпот! Три короны!';
    }
    // Проверяем комбинации карт
    else if (hasCardCombination(symbols, 'A', 3)) {
        points = 150;
        message = 'Три туза!';
    }
    else if (hasCardCombination(symbols, 'K', 3)) {
        points = 100;
        message = 'Три короля!';
    }
    else if (hasCardCombination(symbols, 'Q', 3)) {
        points = 75;
        message = 'Три дамы!';
    }
    else if (hasCardCombination(symbols, 'J', 3)) {
        points = 50;
        message = 'Три валета!';
    }
    else if (hasCardCombination(symbols, '7', 3)) {
        points = 40;
        message = 'Три семерки!';
    }
    // Проверяем фрукты
    else if (symbolCounts['🍒'] >= 3) {
        points = 30;
        message = 'Три вишни!';
    }
    else if (symbolCounts['🍇'] >= 3) {
        points = 25;
        message = 'Три винограда!';
    }
    else if (symbolCounts['🍓'] >= 3) {
        points = 20;
        message = 'Три клубники!';
    }
    else if (symbolCounts['🍋'] >= 3) {
        points = 15;
        message = 'Три лимона!';
    }
    // Проверяем масти
    else if (symbolCounts['♥'] >= 3) {
        points = 10;
        message = 'Три червы!';
    }
    else if (symbolCounts['♦'] >= 3) {
        points = 8;
        message = 'Три бубны!';
    }
    else if (symbolCounts['♠'] >= 3) {
        points = 5;
        message = 'Три пики!';
    }
    else if (symbolCounts['♣'] >= 3) {
        points = 5;
        message = 'Три трефы!';
    }
    
    // Обновляем счет если есть выигрыш
    if (points > 0) {
        score += points;
        document.getElementById('score').textContent = score;
        showWinModal(message, symbols);
        fireworks.start();
    } else {
        updateResults('Попробуйте еще раз!', symbols, false);
        fireworks.stop();
    }
}

// Функция для проверки карточных комбинаций
function hasCardCombination(symbols, cardValue, count) {
    return symbols.filter(s => s === cardValue).length >= count;
}

function startFireworks() {
    const pyro = document.querySelector('.pyro');
    pyro.classList.add('active');
}

function stopFireworks() {
    const pyro = document.querySelector('.pyro');
    pyro.classList.remove('active');
}

// Обработчик закрытия модального окна
document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
        const modal = document.querySelector('.modal');
        if (modal.classList.contains('show')) {
            modal.classList.remove('show');
            resetReelPositions();
        }
    }
});

// Обновляем обработчик клика для модального окна
document.querySelector('.modal').addEventListener('click', function(e) {
    // Клик только по самой панели (не по контенту) закрывает её
    if (e.target === this) {
        this.classList.remove('show');
        resetReelPositions();
    }
});

// Обработчики событий
spinButton.addEventListener('click', handleButtonClick);
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        const modal = document.querySelector('.modal');
        if (modal.classList.contains('show')) {
            modal.classList.remove('show');
            resetReelPositions();
        } else if (isSpinning) {
            stopNextReel();
        } else {
            handleButtonClick();
        }
    }
});
