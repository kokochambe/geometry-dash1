class GeometryDash {
    constructor() {
        console.log('🎮 GeometryDash constructor called');
        
        // Основные элементы
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        window.game = this;
        
        if (!this.canvas) {
            console.error('❌ Canvas not found!');
            return;
        }
        
        // Настройки
        this.setupMobile();
        this.setupAudio();
        this.setupCanvas();
        this.initGame();
        
        // Рекорд
        this.highScore = parseInt(localStorage.getItem('geometryDashHighScore')) || 0;
        if (this.highScoreElement) {
            this.updateHighScoreDisplay();
        }
        
        // Инициализация
        setTimeout(() => {
            this.setupEventListeners();
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }, 100);
        
        console.log('✅ Game initialized');
    }

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.ground.y = this.canvas.height - 120;
            this.createBackgroundElements();
        });
    }
    
    initGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.gameSpeed = 8;
        this.gravity = 0.9;
        this.jumpForce = -20;
        this.combo = 0;
        this.multiplier = 1;
        this.screenShake = 0;
        this.time = 0;
        this.pulseEffect = 0;
        this.cameraX = 0;
        
        // Игрок
        this.player = {
            x: 150,
            y: 0,
            width: 65,
            height: 65,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            scale: 1,
            color: '#FF6B6B',
            trail: [],
            mouthOpen: false,
            blinkTimer: 0,
            eyeScale: 1,
            glow: 0,
            shadowBlur: 10
        };
        
        // Сброс
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 70;
        this.particles = [];
        this.effects = [];
        this.collectibles = [];
        this.backgroundElements = [];
        this.groundParticles = [];
        
        // Земля
        this.ground = {
            y: this.canvas.height - 120,
            height: 120
        };
        
        // Игрок на земле
        this.player.y = this.ground.y - this.player.height;
        
        // Цветовые темы
        this.colorThemes = [
            { // Дневная
                name: 'day',
                primary: '#FF6B6B',
                secondary: '#4ECDC4',
                accent: '#FFD166',
                bg1: '#64B5F6',
                bg2: '#42A5F5',
                ground: '#81C784',
                grass: '#4CAF50',
                sun: '#FFEB3B'
            },
            { // Закат
                name: 'sunset',
                primary: '#FF9E6B',
                secondary: '#FF6BE8',
                accent: '#FFD166',
                bg1: '#FF9A9E',
                bg2: '#FAD0C4',
                ground: '#FFB74D',
                grass: '#FF9800',
                sun: '#FF7043'
            },
            { // Ночь
                name: 'night',
                primary: '#6B83FF',
                secondary: '#6BFFD3',
                accent: '#FFEB3B',
                bg1: '#0f0c29',
                bg2: '#302b63',
                ground: '#24243e',
                grass: '#4A148C',
                sun: '#E0E0E0'
            }
        ];
        this.currentTheme = 0;
        
        // Создаем фон
        this.createBackgroundElements();
        this.createGroundTexture();
        
        // Обновляем интерфейс
        this.updateScore();
    }
    
    createBackgroundElements() {
        this.backgroundElements = [];
        
        // Облака
        for (let i = 0; i < 10; i++) {
            this.backgroundElements.push({
                type: 'cloud',
                x: Math.random() * this.canvas.width * 3,
                y: Math.random() * 250 + 30,
                speed: Math.random() * 0.8 + 0.2,
                scale: Math.random() * 0.6 + 0.4,
                opacity: Math.random() * 0.3 + 0.5
            });
        }
        
        // Горы
        for (let i = 0; i < 8; i++) {
            this.backgroundElements.push({
                type: 'mountain',
                x: Math.random() * this.canvas.width * 2,
                y: this.ground.y - Math.random() * 150,
                speed: Math.random() * 0.4 + 0.1,
                height: Math.random() * 200 + 100,
                color: `rgba(0,0,0,${Math.random() * 0.2 + 0.05})`
            });
        }
        
        // Звезды
        for (let i = 0; i < 100; i++) {
            this.backgroundElements.push({
                type: 'star',
                x: Math.random() * this.canvas.width * 3,
                y: Math.random() * 400 + 20,
                speed: Math.random() * 0.1 + 0.02,
                size: Math.random() * 3 + 1,
                brightness: Math.random() * 0.7 + 0.3,
                twinkle: Math.random() * 2
            });
        }
        
        // Птицы
        for (let i = 0; i < 5; i++) {
            this.backgroundElements.push({
                type: 'bird',
                x: Math.random() * this.canvas.width * 2,
                y: Math.random() * 200 + 100,
                speed: Math.random() * 1.5 + 0.5,
                flap: 0,
                flapSpeed: Math.random() * 0.1 + 0.05
            });
        }
    }
    
    createGroundTexture() {
        this.groundParticles = [];
        for (let i = 0; i < 50; i++) {
            this.groundParticles.push({
                x: Math.random() * this.canvas.width,
                y: this.ground.y + Math.random() * 20,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.2,
                color: this.colorThemes[this.currentTheme].grass,
                offset: Math.random() * Math.PI * 2
            });
        }
    }
    
    // ==================== УПРАВЛЕНИЕ ====================
    
    jump() {
        if (this.gameState !== 'playing') return;
        
        if (!this.player.isJumping) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.player.rotation = -25;
            this.player.scale = 0.9;
            this.player.glow = 1;
            
            // Эффекты
            this.createParticleEffect(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height,
                15,
                this.colorThemes[this.currentTheme].primary,
                2
            );
            
            // Эффект на земле
            this.createGroundImpact(
                this.player.x + this.player.width/2,
                this.ground.y,
                20
            );
            
            this.playSound('jump');
            
            // Анимация
            setTimeout(() => {
                this.player.scale = 1;
            }, 150);
        }
    }
    
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Кнопки меню
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startGame();
            });
            
            startBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startGame();
            }, { passive: false });
        }
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }
        
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareScore());
        }
        
        // Управление
        this.setupGameControls();
        
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            if (['Space', ' ', 'ArrowUp', 'KeyW'].includes(e.code)) {
                e.preventDefault();
                this.jump();
            }
        });
        
        // Telegram WebApp
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
        
        console.log('✅ Event listeners setup complete');
    }
    
    setupGameControls() {
        const handleAction = (e) => {
            if (e.type === 'touchstart') {
                e.preventDefault();
            }
            
            if (this.gameState === 'playing') {
                this.jump();
                if (this.isMobile) {
                    this.createTapEffect(e);
                }
            } else if (this.gameState === 'menu') {
                this.startGame();
            }
        };
        
        this.canvas.addEventListener('click', handleAction);
        this.canvas.addEventListener('touchstart', handleAction, { passive: false });
    }
    
    createTapEffect(e) {
        let x, y;
        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            left: ${x - 30}px;
            top: ${y - 30}px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: radial-gradient(circle, 
                rgba(255,107,107,0.4) 0%,
                rgba(255,107,107,0.2) 50%,
                transparent 70%);
            border: 2px solid rgba(255,255,255,0.3);
            z-index: 9998;
            pointer-events: none;
            animation: tapEffect 0.6s forwards;
        `;
        
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 600);
    }
    
    // ==================== АУДИО ====================
    
    setupAudio() {
        this.audioContext = null;
        this.sounds = {
            jump: { freq: 350, type: 'sine', duration: 0.15 },
            score: { freq: 500, type: 'square', duration: 0.08 },
            crash: { freq: 120, type: 'sawtooth', duration: 0.4 },
            powerup: { freq: 700, type: 'triangle', duration: 0.25 },
            collect: { freq: 800, type: 'sine', duration: 0.1 }
        };
        this.initAudioOnFirstTouch();
    }
    
    initAudioOnFirstTouch() {
        const initAudio = () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('🔊 Audio context initialized');
                } catch (e) {
                    console.log('🔇 Audio not supported:', e);
                }
            }
            document.removeEventListener('touchstart', initAudio);
            document.removeEventListener('click', initAudio);
        };
        document.addEventListener('touchstart', initAudio, { once: true });
        document.addEventListener('click', initAudio, { once: true });
    }
    
    playSound(soundName) {
        if (!this.audioContext || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName];
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = sound.freq;
            oscillator.type = sound.type;
            
            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + sound.duration);
        } catch (e) {
            console.log("Audio error:", e);
        }
    }
    
    // ==================== ИГРОВОЙ ПРОЦЕСС ====================
    
    startGame() {
        console.log('🚀 START GAME');
        
        this.gameState = 'playing';
        
        // UI
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const menu = document.getElementById('menu');
        const gameContainer = document.getElementById('gameContainer');
        
        if (startScreen) startScreen.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        if (menu) menu.classList.add('hidden');
        if (gameContainer) gameContainer.classList.add('playing');
        
        // Эффекты
        this.createParticleEffect(
            this.player.x + this.player.width/2,
            this.player.y + this.player.height/2,
            30,
            this.colorThemes[this.currentTheme].primary,
            3
        );
        
        this.playSound('powerup');
        this.gameLoop();
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.time += 0.016;
        this.pulseEffect = Math.sin(this.time * 2) * 0.5 + 0.5;
        
        // Физика игрока
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // Вращение
        this.player.rotation += this.player.velocityY * 0.7;
        this.player.rotation = Math.max(-30, Math.min(30, this.player.rotation));
        
        // Свечение
        if (this.player.glow > 0) {
            this.player.glow *= 0.9;
        }
        
        // След
        this.player.trail.push({
            x: this.player.x + this.player.width/2,
            y: this.player.y + this.player.height/2,
            life: 1,
            size: 15
        });
        
        if (this.player.trail.length > 8) {
            this.player.trail.shift();
        }
        
        this.player.trail.forEach(point => {
            point.life -= 0.15;
            point.size -= 0.8;
        });
        this.player.trail = this.player.trail.filter(point => point.life > 0 && point.size > 0);
        
        // Приземление
        if (this.player.y + this.player.height > this.ground.y) {
            this.player.y = this.ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.rotation = 0;
        }
        
        // Камера
        this.cameraX += this.gameSpeed * 0.5;
        
        // Препятствия
        this.obstacleTimer++;
        if (this.obstacleTimer > this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
            this.obstacleInterval = Math.max(45, this.obstacleInterval - 0.15);
        }
        
        // Монетки
        if (Math.random() < 0.015) {
            this.createCollectible();
        }
        
        // Обновление объектов
        this.updateObstacles();
        this.updateCollectibles();
        this.updateParticles();
        this.updateEffects();
        this.updateBackground();
        
        // Скорость игры
        this.gameSpeed += 0.0008;
        
        // Тряска экрана
        if (this.screenShake > 0) {
            this.screenShake *= 0.85;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.gameSpeed;
            
            // Коллизия
            if (this.checkCollision(this.player, obs)) {
                this.gameOver();
                return;
            }
            
            // Удаление
            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10 * this.multiplier;
                this.combo++;
                
                if (this.combo % 5 === 0) {
                    this.multiplier++;
                    this.createTextEffect(
                        `COMBO x${this.multiplier}`,
                        obs.x, obs.y,
                        this.colorThemes[this.currentTheme].accent
                    );
                    this.playSound('powerup');
                }
                
                this.updateScore();
                this.createParticleEffect(obs.x, obs.y, 8, obs.color, 1.5);
            }
        }
    }
    
    updateCollectibles() {
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const coin = this.collectibles[i];
            coin.x -= this.gameSpeed;
            coin.rotation += 0.12;
            coin.floatY = Math.sin(this.time * 3 + i) * 3;
            
            if (this.checkCollision(this.player, coin)) {
                this.collectibles.splice(i, 1);
                this.score += 50;
                this.createTextEffect('+50', coin.x, coin.y, '#FFD700');
                this.createParticleEffect(coin.x, coin.y, 20, '#FFEB3B', 2);
                this.playSound('collect');
                this.updateScore();
            } else if (coin.x + coin.width < 0) {
                this.collectibles.splice(i, 1);
            }
        }
    }
    
    updateBackground() {
        this.backgroundElements.forEach(element => {
            element.x -= element.speed;
            
            if (element.x < -300) {
                element.x = this.canvas.width + Math.random() * 300;
                
                if (element.type === 'bird') {
                    element.y = Math.random() * 200 + 100;
                }
            }
            
            if (element.type === 'bird') {
                element.flap += element.flapSpeed;
            }
            
            if (element.type === 'star') {
                element.brightness = 0.3 + 0.4 * Math.sin(this.time * element.twinkle);
            }
        });
        
        // Частицы земли
        this.groundParticles.forEach(p => {
            p.x -= p.speed;
            if (p.x < -10) {
                p.x = this.canvas.width + 10;
            }
        });
    }
    
    createObstacle() {
        const theme = this.colorThemes[this.currentTheme];
        const types = [
            { width: 40, height: 70, type: 'spike' },
            { width: 40, height: 100, type: 'spike' },
            { width: 100, height: 50, type: 'platform' },
            { width: 60, height: 60, type: 'cube' }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        const y = type.type === 'platform' ? 
            this.ground.y - type.height : 
            this.ground.y - type.height;
        
        this.obstacles.push({
            x: this.canvas.width,
            y: y,
            width: type.width,
            height: type.height,
            color: theme.secondary,
            type: type.type,
            rotation: 0
        });
    }
    
    createCollectible() {
        this.collectibles.push({
            x: this.canvas.width,
            y: this.ground.y - 90 + Math.random() * 40,
            width: 25,
            height: 25,
            color: '#FFD700',
            rotation: 0,
            floatY: 0,
            glow: 1
        });
    }
    
    checkCollision(player, object) {
        const margin = 5;
        return player.x + margin < object.x + object.width - margin &&
               player.x + player.width - margin > object.x + margin &&
               player.y + margin < object.y + object.height - margin &&
               player.y + player.height - margin > object.y + margin;
    }
    
    // ==================== ГРАФИКА ====================
    
    draw() {
        // Тряска камеры
        const shakeX = this.screenShake * (Math.random() - 0.5) * 15;
        const shakeY = this.screenShake * (Math.random() - 0.5) * 15;
        
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        
        const theme = this.colorThemes[this.currentTheme];
        
        // ФОН
        this.drawBackground(theme);
        
        // ПРЕПЯТСТВИЯ
        this.obstacles.forEach(obs => this.drawObstacle(obs, theme));
        
        // МОНЕТКИ
        this.collectibles.forEach(coin => this.drawCollectible(coin));
        
        // СЛЕД ИГРОКА
        this.drawPlayerTrail(theme);
        
        // ИГРОК
        this.drawPlayer();
        
        // ЧАСТИЦЫ И ЭФФЕКТЫ
        this.drawParticles();
        this.drawEffects();
        
        this.ctx.restore();
    }
    
    drawBackground(theme) {
        // Градиентный фон
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, theme.bg1);
        gradient.addColorStop(0.7, theme.bg2);
        gradient.addColorStop(1, this.darkenColor(theme.bg2, 20));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Солнце/Луна
        this.drawSun(theme);
        
        // Фоновые элементы
        this.backgroundElements.forEach(element => {
            switch(element.type) {
                case 'cloud':
                    this.drawCloud(element);
                    break;
                case 'mountain':
                    this.drawMountain(element);
                    break;
                case 'star':
                    if (theme.name === 'night') this.drawStar(element);
                    break;
                case 'bird':
                    this.drawBird(element);
                    break;
            }
        });
        
        // Земля
        this.drawGround(theme);
    }
    
    drawSun(theme) {
        const sunX = this.canvas.width - 100;
        const sunY = 100;
        const size = theme.name === 'night' ? 30 : 45;
        
        this.ctx.save();
        
        if (theme.name === 'night') {
            // Луна
            this.ctx.fillStyle = theme.sun;
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Кратеры
            this.ctx.fillStyle = this.darkenColor(theme.sun, 20);
            this.ctx.beginPath();
            this.ctx.arc(sunX - 15, sunY - 10, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(sunX + 10, sunY + 15, 6, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Солнце с лучами
            this.ctx.fillStyle = theme.sun;
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Свечение
            this.ctx.shadowColor = theme.sun;
            this.ctx.shadowBlur = 30;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // Лучи
            this.ctx.strokeStyle = theme.sun;
            this.ctx.lineWidth = 4;
            for (let i = 0; i < 16; i++) {
                const angle = (i * Math.PI) / 8 + this.time;
                const length = 25 + Math.sin(this.time * 2 + i) * 5;
                const x1 = sunX + Math.cos(angle) * size;
                const y1 = sunY + Math.sin(angle) * size;
                const x2 = sunX + Math.cos(angle) * (size + length);
                const y2 = sunY + Math.sin(angle) * (size + length);
                
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
    
    drawCloud(cloud) {
        this.ctx.save();
        this.ctx.translate(cloud.x, cloud.y);
        this.ctx.scale(cloud.scale, cloud.scale);
        this.ctx.globalAlpha = cloud.opacity;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
        this.ctx.arc(30, -15, 30, 0, Math.PI * 2);
        this.ctx.arc(-30, -15, 30, 0, Math.PI * 2);
        this.ctx.arc(20, 20, 28, 0, Math.PI * 2);
        this.ctx.arc(-25, 20, 28, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawMountain(mountain) {
        this.ctx.fillStyle = mountain.color;
        this.ctx.beginPath();
        this.ctx.moveTo(mountain.x, this.ground.y);
        this.ctx.lineTo(mountain.x + 200, this.ground.y - mountain.height);
        this.ctx.lineTo(mountain.x + 400, this.ground.y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Снег
        if (mountain.height > 180) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.moveTo(mountain.x + 180, this.ground.y - mountain.height + 30);
            this.ctx.lineTo(mountain.x + 220, this.ground.y - mountain.height + 80);
            this.ctx.lineTo(mountain.x + 100, this.ground.y - mountain.height + 50);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawStar(star) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Мерцание
        if (star.size > 2) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x - 3, star.y - 3, star.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawBird(bird) {
        this.ctx.save();
        this.ctx.translate(bird.x, bird.y);
        
        const wingY = Math.sin(bird.flap) * 5;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        
        // Тело
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Крылья
        this.ctx.beginPath();
        this.ctx.ellipse(-5, wingY, 10, 5, Math.PI/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(-5, -wingY, 10, 5, -Math.PI/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawGround(theme) {
        // Основная земля
        this.ctx.fillStyle = theme.ground;
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        // Текстура земли
        this.groundParticles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y + Math.sin(this.time * 2 + p.offset) * 2, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Трава
        const grassGradient = this.ctx.createLinearGradient(
            0, this.ground.y - 15,
            0, this.ground.y
        );
        grassGradient.addColorStop(0, theme.grass);
        grassGradient.addColorStop(1, this.darkenColor(theme.grass, 30));
        
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(0, this.ground.y - 15, this.canvas.width, 15);
        
        // Травинки
        this.ctx.strokeStyle = this.darkenColor(theme.grass, 20);
        this.ctx.lineWidth = 1.5;
        for (let i = 0; i < 30; i++) {
            const x = (i * 50 + this.cameraX * 0.2) % (this.canvas.width + 50);
            if (x < this.canvas.width) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, this.ground.y - 15);
                const curve = Math.sin(this.time + i) * 8;
                this.ctx.quadraticCurveTo(x + curve, this.ground.y - 40, x, this.ground.y - 35);
                this.ctx.stroke();
            }
        }
    }
    
    drawObstacle(obs, theme) {
        this.ctx.save();
        this.ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
        
        if (obs.type === 'cube') {
            this.ctx.rotate(obs.rotation);
            obs.rotation += 0.05;
        }
        
        // Градиент
        const gradient = this.ctx.createLinearGradient(
            -obs.width/2, -obs.height/2,
            obs.width/2, obs.height/2
        );
        gradient.addColorStop(0, obs.color);
        gradient.addColorStop(1, this.darkenColor(obs.color, 30));
        
        this.ctx.fillStyle = gradient;
        
        if (obs.type === 'spike') {
            // Шип
            this.ctx.beginPath();
            this.ctx.moveTo(-obs.width/2, obs.height/2);
            this.ctx.lineTo(0, -obs.height/2);
            this.ctx.lineTo(obs.width/2, obs.height/2);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Контур
            this.ctx.strokeStyle = this.darkenColor(obs.color, 40);
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        } else {
            // Платформа/куб
            this.ctx.fillRect(-obs.width/2, -obs.height/2, obs.width, obs.height);
            
            // Тень
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(-obs.width/2 + 3, -obs.height/2 + 3, obs.width, obs.height);
            
            // Блик
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(-obs.width/2 + 2, -obs.height/2 + 2, obs.width * 0.3, obs.height * 0.3);
        }
        
        this.ctx.restore();
    }
    
    drawCollectible(coin) {
        this.ctx.save();
        this.ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2 + coin.floatY);
        this.ctx.rotate(coin.rotation);
        
        // Свечение
        if (coin.glow > 0) {
            this.ctx.shadowColor = '#FFEB3B';
            this.ctx.shadowBlur = 20 * coin.glow;
            coin.glow *= 0.95;
        }
        
        // Монетка
        this.ctx.fillStyle = coin.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coin.width/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Детали
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.arc(-3, -3, coin.width/3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#FFA000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    drawPlayerTrail(theme) {
        this.player.trail.forEach((point, i) => {
            this.ctx.globalAlpha = point.life * 0.3;
            this.ctx.fillStyle = theme.primary;
            
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawPlayer() {
        const theme = this.colorThemes[this.currentTheme];
        
        // Свечение
        if (this.player.glow > 0) {
            this.ctx.shadowColor = theme.primary;
            this.ctx.shadowBlur = 30 * this.player.glow;
        }
        
        this.ctx.save();
        this.ctx.translate(
            this.player.x + this.player.width/2,
            this.player.y + this.player.height/2
        );
        this.ctx.rotate(this.player.rotation * Math.PI / 180);
        this.ctx.scale(this.player.scale, this.player.scale);
        
        // ТЕЛО С ГРАДИЕНТОМ
        const bodyGradient = this.ctx.createLinearGradient(
            -this.player.width/2, -this.player.height/2,
            this.player.width/2, this.player.height/2
        );
        bodyGradient.addColorStop(0, theme.primary);
        bodyGradient.addColorStop(0.7, theme.primary);
        bodyGradient.addColorStop(1, this.darkenColor(theme.primary, 25));
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(-this.player.width/2, -this.player.height/2, this.player.width, this.player.height);
        
        // Скругленные углы
        this.ctx.strokeStyle = this.darkenColor(theme.primary, 35);
        this.ctx.lineWidth = 4;
        this.ctx.lineJoin = 'round';
        this.ctx.strokeRect(-this.player.width/2, -this.player.height/2, this.player.width, this.player.height);
        
        // Блик
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        this.ctx.fillRect(-this.player.width/2 + 6, -this.player.height/2 + 6, this.player.width * 0.4, this.player.height * 0.4);
        
        // ГЛАЗА
        this.drawEyes();
        
        // РОТ
        this.drawMouth();
        
        // ЩЕЧКИ
        this.ctx.fillStyle = '#FF8A8A';
        this.ctx.beginPath();
        this.ctx.arc(-this.player.width/3, this.player.height/8, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(this.player.width/3 - 12, this.player.height/8, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }
    
    drawEyes() {
        this.player.blinkTimer += 0.03;
        const blink = Math.sin(this.player.blinkTimer * 5) > 0 ? 1 : 0.1;
        
        // Левый глаз
        this.ctx.save();
        this.ctx.translate(-this.player.width/4, -this.player.height/4);
        this.ctx.scale(1, blink);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(3, 3, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Правый глаз
        this.ctx.save();
        this.ctx.translate(this.player.width/4 - 12, -this.player.height/4);
        this.ctx.scale(1, blink);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(3, 3, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawMouth() {
        if (this.player.mouthOpen) {
            // Улыбка при прыжке
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(0, this.player.height/6, 10, 0, Math.PI, false);
            this.ctx.fill();
            
            // Язык
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.beginPath();
            this.ctx.arc(0, this.player.height/6 + 6, 5, 0, Math.PI, true);
            this.ctx.fill();
        } else {
            // Нейтральный рот
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, this.player.height/6, 8, 0.2 * Math.PI, 0.8 * Math.PI);
            this.ctx.stroke();
        }
    }
    
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            
            if (p.sparkle) {
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 10;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawEffects() {
        this.effects.forEach(effect => {
            this.ctx.globalAlpha = effect.life;
            this.ctx.fillStyle = effect.color;
            this.ctx.font = `bold ${24 * effect.life}px 'Segoe UI', Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Тень текста
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.fillText(effect.text, effect.x, effect.y);
            
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        });
        this.ctx.globalAlpha = 1;
    }
    
    // ==================== ЭФФЕКТЫ ====================
    
    createParticleEffect(x, y, count, color, speed = 1) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 4 * speed + 1;
            
            this.particles.push({
                x: x,
                y: y,
                size: Math.random() * 5 + 2,
                speedX: Math.cos(angle) * velocity,
                speedY: Math.sin(angle) * velocity,
                color: color,
                life: 1,
                decay: Math.random() * 0.03 + 0.02,
                sparkle: Math.random() > 0.7
            });
        }
    }
    
    createGroundImpact(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.groundParticles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + Math.random() * 10,
                size: Math.random() * 4 + 1,
                speed: Math.random() * 0.8 + 0.3,
                color: this.colorThemes[this.currentTheme].grass,
                offset: Math.random() * Math.PI * 2
            });
        }
    }
    
    createTextEffect(text, x, y, color) {
        this.effects.push({
            text: text,
            x: x,
            y: y,
            color: color,
            life: 1
        });
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += 0.1;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.life -= 0.02;
            effect.y -= 2.5;
            
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    // ==================== ИНТЕРФЕЙС ====================
    
    updateScore() {
        if (this.scoreElement) {
            const scoreElement = this.scoreElement;
            scoreElement.innerHTML = `Очки: <span>${this.score}</span>`;
            
            // Эффект
            scoreElement.classList.add('score-pop');
            setTimeout(() => scoreElement.classList.remove('score-pop'), 300);
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScoreDisplay();
            localStorage.setItem('geometryDashHighScore', this.highScore);
        }
    }
    
    updateHighScoreDisplay() {
        if (this.highScoreElement) {
            const element = this.highScoreElement;
            element.innerHTML = `Рекорд: <span>${this.highScore}</span>`;
            
            element.classList.add('new-record', 'high-score-glow');
            this.playSound('score');
            
            setTimeout(() => {
                element.classList.remove('new-record');
            }, 2000);
        }
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        // UI
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScore = document.getElementById('finalScore');
        const menu = document.getElementById('menu');
        const gameContainer = document.getElementById('gameContainer');
        
        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
        if (finalScore) {
            finalScore.innerHTML = `🎯 Очки: <span style="color: #FFD700; font-size: 32px;">${this.score}</span>`;
        }
        if (menu) menu.classList.remove('hidden');
        if (gameContainer) gameContainer.classList.remove('playing');
        
        // Эффекты
        this.screenShake = 3;
        this.createParticleEffect(
            this.player.x + this.player.width/2,
            this.player.y + this.player.height/2,
            50,
            '#FF0000',
            2.5
        );
        
        this.playSound('crash');
        this.sendScoreToBot();
    }
    
    restartGame() {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) gameContainer.classList.add('playing');
        
        const menu = document.getElementById('menu');
        if (menu) menu.classList.add('hidden');
        
        // Смена темы
        this.currentTheme = (this.currentTheme + 1) % this.colorThemes.length;
        this.initGame();
        this.startGame();
    }
    
    shareScore() {
        const shareText = `🎮 Набрал ${this.score} очков в Geometry Dash Ultimate!`;
        if (navigator.share) {
            navigator.share({
                title: 'Geometry Dash Ultimate',
                text: shareText,
                url: window.location.href
            });
        } else {
            alert(shareText + '\n\nСсылка на игру: ' + window.location.href);
        }
    }
    
    sendScoreToBot() {
        try {
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.sendData(JSON.stringify({
                    action: 'game_score',
                    score: this.score,
                    highScore: this.highScore,
                    theme: this.colorThemes[this.currentTheme].name
                }));
            }
        } catch (e) {
            console.log('Cannot send data to bot:', e);
        }
    }
    
    // ==================== УТИЛИТЫ ====================
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameState === 'playing') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// ==================== ЗАПУСК ====================

function initializeGame() {
    console.log('🎮 INITIALIZING GAME...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.game = new GeometryDash();
        });
    } else {
        window.game = new GeometryDash();
    }
}

console.log('🎮 Geometry Dash Ultimate - Loading...');
initializeGame();