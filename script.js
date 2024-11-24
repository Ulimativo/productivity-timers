class ProductivityTimer {
    constructor() {
        // Timer settings
        this.workTime = 25;
        this.breakTime = 5;
        this.twoMinuteTime = 2;
        this.timeLeft = this.workTime * 60;
        this.isRunning = false;
        this.isBreak = false;
        this.sessions = 0;
        this.timer = null;
        this.isPomodoroMode = true;
        
        // Fullscreen settings
        this.isFullscreen = false;
        this.isDarkMode = false;
        this.fullscreenType = 'countdown';
        this.customTime = 30;
        this.cursorTimeout = null;

        this.initializeElements();
        this.setupEventListeners();
        this.loadThemePreference();
    }

    initializeElements() {
        // Basic timer elements
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.startButton = document.getElementById('start');
        this.pauseButton = document.getElementById('pause');
        this.resetButton = document.getElementById('reset');
        this.workTimeInput = document.getElementById('workTime');
        this.breakTimeInput = document.getElementById('breakTime');
        this.sessionsDisplay = document.getElementById('sessions');

        // Mode and theme elements
        this.modeSelect = document.getElementById('modeSelect');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        
        // Fullscreen elements
        this.fullscreenContainer = document.getElementById('fullscreenContainer');
        this.fullscreenTime = document.getElementById('fullscreenTime');
        this.fullscreenType = document.getElementById('fullscreenType');
        this.customTimeInput = document.getElementById('customTime');
        this.fullscreenSettings = document.getElementById('fullscreenSettings');
        this.container = document.querySelector('.container');
        this.enterFullscreenBtn = document.getElementById('enterFullscreen');
    }

    setupEventListeners() {
        // Basic timer controls
        this.startButton.addEventListener('click', () => this.start());
        this.pauseButton.addEventListener('click', () => this.pause());
        this.resetButton.addEventListener('click', () => this.reset());
        this.workTimeInput.addEventListener('change', () => this.updateWorkTime());
        this.breakTimeInput.addEventListener('change', () => this.updateBreakTime());

        // Mode and theme controls
        this.modeSelect.addEventListener('change', () => this.handleModeChange());
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Fullscreen controls
        document.getElementById('fullscreenStart').addEventListener('click', () => this.startFullscreenTimer());
        document.getElementById('fullscreenReset').addEventListener('click', () => this.resetFullscreenTimer());
        document.getElementById('exitFullscreen').addEventListener('click', () => this.exitFullscreen());
        this.fullscreenType.addEventListener('change', () => this.updateFullscreenSettings());
        this.fullscreenContainer.addEventListener('mousemove', () => this.handleMouseMove());
        this.enterFullscreenBtn.addEventListener('click', () => this.showFullscreenMode());
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        this.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.timer = setInterval(() => this.tick(), 1000);
        }
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timer);
    }

    reset() {
        this.pause();
        if (this.isPomodoroMode) {
            this.timeLeft = this.workTime * 60;
            this.isBreak = false;
        } else {
            this.timeLeft = this.twoMinuteTime * 60;
        }
        this.updateDisplay();
    }

    tick() {
        this.timeLeft--;
        this.updateDisplay();

        if (this.timeLeft <= 0) {
            this.switchMode();
        }
    }

    switchMode() {
        if (this.isPomodoroMode) {
            this.isBreak = !this.isBreak;
            if (this.isBreak) {
                this.timeLeft = this.breakTime * 60;
                this.notify("Time for a break!");
            } else {
                this.timeLeft = this.workTime * 60;
                this.sessions++;
                this.sessionsDisplay.textContent = this.sessions;
                this.notify("Back to work!");
            }
        } else {
            // For Two-Minute Rule
            this.timeLeft = this.twoMinuteTime * 60;
            this.sessions++;
            this.sessionsDisplay.textContent = this.sessions;
            this.notify("Two minutes completed! Start another task or take a break.");
            this.pause();
        }
    }

    handleModeChange() {
        const mode = this.modeSelect.value;
        this.hideAllModes();
        
        switch(mode) {
            case 'pomodoro':
                this.showPomodoroMode();
                break;
            case 'twoMinute':
                this.showTwoMinuteMode();
                break;
            case 'fullscreen':
                this.showFullscreenSettings();
                break;
        }
    }

    hideAllModes() {
        this.fullscreenSettings.style.display = 'none';
        this.workTimeInput.parentElement.style.display = 'none';
        this.breakTimeInput.parentElement.style.display = 'none';
    }

    showPomodoroMode() {
        this.isPomodoroMode = true;
        this.workTimeInput.parentElement.style.display = 'block';
        this.breakTimeInput.parentElement.style.display = 'block';
        this.timeLeft = this.workTime * 60;
        this.updateDisplay();
    }

    showTwoMinuteMode() {
        this.isPomodoroMode = false;
        this.timeLeft = this.twoMinuteTime * 60;
        this.updateDisplay();
    }

    showFullscreenSettings() {
        this.fullscreenSettings.style.display = 'block';
        this.workTimeInput.parentElement.style.display = 'none';
        this.breakTimeInput.parentElement.style.display = 'none';
    }

    showFullscreenMode() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().then(() => {
                this.container.style.display = 'none';
                this.fullscreenContainer.style.display = 'flex';
                this.isFullscreen = true;
            }).catch((err) => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        }
    }

    exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        this.fullscreenContainer.style.display = 'none';
        this.container.style.display = 'block';
        this.isFullscreen = false;
    }

    handleMouseMove() {
        this.fullscreenContainer.classList.remove('cursor-hidden');
        clearTimeout(this.cursorTimeout);
        
        this.cursorTimeout = setTimeout(() => {
            if (this.isFullscreen) {
                this.fullscreenContainer.classList.add('cursor-hidden');
            }
        }, 2000);
    }

    startFullscreenTimer() {
        if (this.fullscreenType.value === 'countdown') {
            this.startCountdown();
        } else {
            this.startStopwatch();
        }
    }

    startCountdown() {
        const minutes = parseInt(this.customTimeInput.value);
        let totalSeconds = minutes * 60;
        
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(this.timer);
                this.notify("Time's up!");
                return;
            }
            
            totalSeconds--;
            this.updateFullscreenDisplay(totalSeconds);
        }, 1000);
    }

    startStopwatch() {
        let seconds = 0;
        clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            seconds++;
            this.updateFullscreenDisplay(seconds);
        }, 1000);
    }

    updateFullscreenDisplay(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        this.fullscreenTime.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    resetFullscreenTimer() {
        clearInterval(this.timer);
        this.fullscreenTime.textContent = '00:00:00';
    }

    updateFullscreenSettings() {
        const isCountdown = this.fullscreenType.value === 'countdown';
        document.getElementById('countdownSettings').style.display = 
            isCountdown ? 'block' : 'none';
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        this.darkModeToggle.textContent = this.isDarkMode ? '☀️' : '🌙';
        localStorage.setItem('darkMode', this.isDarkMode);
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme !== null) {
            this.isDarkMode = savedTheme === 'true';
            document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
            this.darkModeToggle.textContent = this.isDarkMode ? '☀️' : '🌙';
        }
    }

    notify(message) {
        if (Notification.permission === "granted") {
            new Notification(message);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(message);
                }
            });
        }
        alert(message);
    }

    updateWorkTime() {
        this.workTime = parseInt(this.workTimeInput.value);
        if (!this.isBreak) {
            this.reset();
        }
    }

    updateBreakTime() {
        this.breakTime = parseInt(this.breakTimeInput.value);
        if (this.isBreak) {
            this.reset();
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const productivityTimer = new ProductivityTimer();
});