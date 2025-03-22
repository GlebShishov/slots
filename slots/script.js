const fruits = ['🍎', '🍊', '🍇', '🍋', '🍐'];
const reels = document.querySelectorAll('.reel');
const spinButton = document.getElementById('spin-button');
const scoreElement = document.getElementById('score');
let isSpinning = false;
let score = 0;
let stoppedReels = 0;
let spinningReels = new Set();

const SYMBOL_HEIGHT = 80; // Reduced height to match CSS
const SPIN_DURATION = 3000;
const INITIAL_OFFSET = -120;
const SLOWDOWN_TIME = 1000;

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
    
    // Create multiple sets of shuffled fruits
    for (let i = 0; i < 3; i++) {
        const shuffledFruits = shuffleArray([...fruits]);
        shuffledFruits.forEach((fruit, index) => {
            const item = document.createElement('div');
            item.className = 'reel-item';
            item.dataset.position = index;
            item.textContent = fruit;
            strip.appendChild(item);
        });
    }
    
    // Add one more fruit for smooth transition
    const item = document.createElement('div');
    item.className = 'reel-item';
    item.dataset.position = '0';
    item.textContent = fruits[0];
    strip.appendChild(item);
    
    // Set initial position
    strip.style.transform = `translateY(${INITIAL_OFFSET}px)`;
    
    return strip;
}

// Initialize reels with strips
reels.forEach((reel, index) => {
    reel.innerHTML = '';
    reel.dataset.reelIndex = index;
    reel.appendChild(createReelStrip());
});

function getRandomFruit() {
    return fruits[Math.floor(Math.random() * fruits.length)];
}

function updateScore(points) {
    score += points;
    scoreElement.textContent = score;
}

function getCenterFruit(reel) {
    const items = reel.querySelectorAll('.reel-item');
    const visibleItems = Array.from(items);
    const centerIndex = Math.floor(visibleItems.length / 2);
    return visibleItems[centerIndex]?.textContent || null;
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
    // Get the center fruit from each reel
    const centerFruits = Array.from(reels).map(reel => getCenterFruit(reel));
    const { count, fruit } = countMatchingFruits(centerFruits);
    
    let points = 0;
    let message = '';

    // Determine points based on matching fruits
    if (count === 5) {
        points = 10000;
        message = `Невероятно! 5 одинаковых фруктов! Вы выиграли ${points} очков!\nВыпало: ${fruit}`;
    } else if (count === 3) {
        points = 100;
        message = `Отлично! 3 одинаковых фрукта! Вы выиграли ${points} очков!\nВыпало: ${fruit}`;
    } else if (count === 2) {
        points = 50;
        message = `Неплохо! 2 одинаковых фрукта! Вы выиграли ${points} очков!\nВыпало: ${fruit}`;
    }

    if (points > 0) {
        // Highlight winning fruits
        reels.forEach((reel, index) => {
            if (centerFruits[index] === fruit) {
                const items = reel.querySelectorAll('.reel-item');
                const centerItem = items[Math.floor(items.length / 2)];
                if (centerItem) {
                    centerItem.classList.add('win');
                    setTimeout(() => centerItem.classList.remove('win'), 1500);
                }
            }
        });

        // Update score and show message
        updateScore(points);
        setTimeout(() => {
            alert(message);
        }, 500);
    }
}

function spinReel(reel) {
    return new Promise(resolve => {
        const strip = reel.querySelector('.reel-strip');
        const finalFruit = getRandomFruit();
        
        // Reset to initial position before spinning
        strip.style.transition = 'none';
        strip.style.transform = `translateY(${INITIAL_OFFSET}px)`;
        void strip.offsetHeight;
        strip.style.transition = '';
        
        // Start fast spinning animation
        strip.classList.add('spinning');
        spinningReels.add(reel.dataset.reelIndex);
        
        resolve();
    });
}

function stopReel(reel) {
    const strip = reel.querySelector('.reel-strip');
    const finalFruit = getRandomFruit();
    
    return new Promise(resolve => {
        strip.classList.remove('spinning');
        strip.classList.add('slowing-down');
        
        setTimeout(() => {
            strip.classList.remove('slowing-down');
            
            // Calculate the final position for downward motion
            const fruitIndex = fruits.indexOf(finalFruit);
            const finalPosition = INITIAL_OFFSET + ((fruits.length - fruitIndex) * SYMBOL_HEIGHT);
            
            // Set the final position with easing
            strip.style.transform = `translateY(${finalPosition}px)`;
            
            setTimeout(() => {
                // Reset position without animation if we reached the beginning
                if (fruitIndex === 0) {
                    strip.style.transition = 'none';
                    strip.style.transform = `translateY(${INITIAL_OFFSET}px)`;
                    void strip.offsetHeight;
                    strip.style.transition = '';
                }
                
                spinningReels.delete(reel.dataset.reelIndex);
                stoppedReels++;
                
                // Check if all reels have stopped
                if (stoppedReels === reels.length) {
                    checkWin();
                    isSpinning = false;
                    stoppedReels = 0;
                    spinButton.textContent = 'SPIN';
                    spinButton.classList.remove('stop');
                    spinButton.disabled = false;
                }
                
                resolve();
            }, 500);
        }, SLOWDOWN_TIME);
    });
}

function updateNextReelIndicator() {
    // Remove next-stop class from all reels
    reels.forEach(reel => reel.classList.remove('next-stop'));
    
    // Find the next reel to stop
    const nextReelToStop = Array.from(reels)
        .find(reel => spinningReels.has(reel.dataset.reelIndex));
    
    // Add next-stop class to the next reel
    if (nextReelToStop) {
        nextReelToStop.classList.add('next-stop');
    }
}

function handleButtonClick() {
    if (!isSpinning) {
        // Start spinning all reels
        isSpinning = true;
        spinButton.textContent = 'STOP';
        spinButton.classList.add('stop');
        
        // Start all reels spinning
        reels.forEach(reel => spinReel(reel));
        
        // Show indicator for first reel
        setTimeout(() => updateNextReelIndicator(), 100);
    } else {
        // Find the first spinning reel and stop it
        const nextReelToStop = Array.from(reels)
            .find(reel => spinningReels.has(reel.dataset.reelIndex));
        
        if (nextReelToStop) {
            stopReel(nextReelToStop).then(() => {
                // Update indicator for next reel
                updateNextReelIndicator();
            });
        }
    }
}

// Add click event listener to spin/stop button
spinButton.addEventListener('click', handleButtonClick);

// Add spacebar control
document.addEventListener('keydown', (event) => {
    // Check if the pressed key is spacebar and not in an input field
    if (event.code === 'Space' && event.target === document.body) {
        // Prevent page scroll
        event.preventDefault();
        
        // Trigger button click
        handleButtonClick();
        
        // Add visual feedback
        spinButton.classList.add('active');
        setTimeout(() => spinButton.classList.remove('active'), 100);
    }
});
