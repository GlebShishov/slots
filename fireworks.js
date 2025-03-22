class Fireworks {
    constructor() {
        this.pyroElement = document.querySelector('.pyro');
    }

    start() {
        if (this.pyroElement) {
            this.pyroElement.classList.add('active');
        }
    }

    stop() {
        if (this.pyroElement) {
            this.pyroElement.classList.remove('active');
        }
    }
}

// Создаем глобальный экземпляр для использования в основном скрипте
window.fireworks = new Fireworks();
