class GeometryDash {
    constructor() {
        console.log('🎮 GeometryDash constructor called');
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        window.game = this;
        
        if (!this.canvas) {
            console.error('❌ Canvas not found!');
            return;
        }
        
        this.setupMobile();
        this.setupAudio();
        this.setupCanvas();
        this.initGame();
        
        this.highScore = localStorage.getItem('geometryDashHighScore') || 0;
        if (this.highScoreElement) {
            this.highScoreElement.textContent = `🏆 Рекорд: ${this.highScore}`;
        }
        
        setTimeout(() => {
            this.setupEventListeners();
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }, 100);
        
        console.log('✅ Game initialized for mobile');
    }

    jump() {
        console.log('🎮 JUMP METHOD CALLED, gameState:', this.gameState);
        
        if (this.gameState !== 'playing') {
            console.log('⚠️ Cannot jump: game not playing');
            return;
        }
        
        if (!this.player.isJumping) {
            console.log('✅ Player jumps!');
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.player.rotation = -25;
            this.player.scale = 0.8;
            
            // Эффекты прыжка
            this.createParticleEffect(this.player.x + this.player.width/2, 
                                     this.player.y + this.player.height, 
                                     8, '#FFFFFF');
            this.playSound('jump');
            
            setTimeout(() => {
                this.player.scale = 1;
            }, 100);
        } else {
            console.log('⚠️ Player already jumping');
        }
    }
    setupAudio() {
    this.audioContext = null;
    this.sounds = {
        jump: { freq: 300, type: 'sine', duration: 0.1 },
        score: { freq: 400, type: 'square', duration: 0.05 },
        crash: { freq: 150, type: 'sawtooth', duration: 0.3 },
        powerup: { freq: 600, type: 'triangle', duration: 0.2 }
    };

    this.initAudioOnFirstTouch();
}

initAudioOnFirstTouch() {
    const initAudio = () => {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('# Audio context initialized');
            } catch (e) {
                console.log('X Audio not supported:', e);
            }
        }

        document.removeEventListener('touchstart', initAudio);
        document.removeEventListener('click', initAudio);
    };

    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('click', initAudio, { once: true });
}

playSound(soundName) {
    if (!this.audioContext) return;

    const sound = this.sounds[soundName];
    if (!sound) return;

    try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = sound.freq;
        oscillator.type = sound.type;

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + sound.duration);
    } catch (e) {
        console.log("Audio error:", e);
    }
}

setupMobile() {
    document.addEventListener('touchmove', (e) => {
        if (e.scale != 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });

    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
}
setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.ground.y = this.canvas.height - 120;
        });
    }
    
    initGame() {
    this.gameState = 'menu';
    this.score = 0;
    this.gameSpeed = 8;
    this.gravity = 0.9;
    this.jumpForce = -18;
    this.combo = 0;
    this.multiplier = 1;
    this.screenShake = 0;
    this.time = 0; // Для анимации фона
    
    this.player = {
        x: 100,
        y: this.canvas.height - 180,
        width: 60, // Увеличил размер
        height: 60,
        velocityY: 0,
        isJumping: false,
        rotation: 0,
        scale: 1,
        color: '#FF6B6B',
        trail: [],
        mouthOpen: false,
        blinkTimer: 0,
        eyeScale: 1
    };
    
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.obstacleInterval = 70;
    this.particles = [];
    this.effects = [];
    this.collectibles = [];
    this.backgroundElements = [];
    
    this.ground = {
        y: this.canvas.height - 120,
        height: 120
    };
    
    // Создаем элементы фона
    this.createBackgroundElements();
    
    // Цветовые темы
    this.colorThemes = [
        { 
            primary: '#FF6B6B', 
            secondary: '#4ECDC4', 
            bg1: '#64B5F6', 
            bg2: '#42A5F5',
            ground: '#81C784',
            grass: '#4CAF50'
        },
        { 
            primary: '#FF9E6B', 
            secondary: '#6BFFD3', 
            bg1: '#a18cd1', 
            bg2: '#fbc2eb',
            ground: '#FFB74D',
            grass: '#FF9800'
        },
        { 
            primary: '#6B83FF', 
            secondary: '#FF6BE8', 
            bg1: '#fbc2eb', 
            bg2: '#a6c1ee',
            ground: '#BA68C8',
            grass: '#AB47BC'
        }
    ];
    this.currentTheme = 0;
}

createBackgroundElements() {
    this.backgroundElements = [];
    
    // Облака
    for (let i = 0; i < 8; i++) {
        this.backgroundElements.push({
            type: 'cloud',
            x: Math.random() * this.canvas.width * 2,
            y: Math.random() * 200 + 50,
            speed: Math.random() * 0.5 + 0.3,
            scale: Math.random() * 0.5 + 0.5
        });
    }
    
    // Горы
    for (let i = 0; i < 5; i++) {
        this.backgroundElements.push({
            type: 'mountain',
            x: Math.random() * this.canvas.width * 2,
            y: this.ground.y - Math.random() * 100,
            speed: Math.random() * 0.3 + 0.1,
            height: Math.random() * 150 + 50
        });
    }
    
    // Звезды (для ночной темы)
    for (let i = 0; i < 30; i++) {
        this.backgroundElements.push({
            type: 'star',
            x: Math.random() * this.canvas.width * 2,
            y: Math.random() * 300 + 50,
            speed: Math.random() * 0.2 + 0.05,
            size: Math.random() * 2 + 1,
            brightness: Math.random() * 0.5 + 0.5
        });
    }
}

draw() {
    this.time += 0.01;
    
    const shakeX = this.screenShake * (Math.random() - 0.5) * 10;
    const shakeY = this.screenShake * (Math.random() - 0.5) * 10;
    
    this.ctx.save();
    this.ctx.translate(shakeX, shakeY);
    
    const theme = this.colorThemes[this.currentTheme];
    
    // КРАСИВЫЙ ГРАДИЕНТНЫЙ ФОН С АНИМАЦИЕЙ
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, theme.bg1);
    gradient.addColorStop(1, theme.bg2);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // АНИМИРОВАННОЕ СОЛНЦЕ/ЛУНА
    this.ctx.save();
    const sunX = this.canvas.width - 80;
    const sunY = 80;
    
    if (this.currentTheme === 2) { // Ночная тема - луна
        this.ctx.fillStyle = '#E0E0E0';
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, 35, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Кратеры на луне
        this.ctx.fillStyle = '#BDBDBD';
        this.ctx.beginPath();
        this.ctx.arc(sunX - 10, sunY - 10, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(sunX + 15, sunY + 10, 6, 0, Math.PI * 2);
        this.ctx.fill();
    } else { // Дневная тема - солнце
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Лучи солнца
        this.ctx.strokeStyle = '#FFEB3B';
        this.ctx.lineWidth = 4;
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6 + this.time;
            const x1 = sunX + Math.cos(angle) * 45;
            const y1 = sunY + Math.sin(angle) * 45;
            const x2 = sunX + Math.cos(angle) * 60;
            const y2 = sunY + Math.sin(angle) * 60;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }
    this.ctx.restore();
    
    // ОБЛАКА
    this.backgroundElements.forEach(element => {
        if (element.type === 'cloud') {
            element.x -= element.speed;
            if (element.x < -200) {
                element.x = this.canvas.width + 200;
            }
            
            this.ctx.save();
            this.ctx.translate(element.x, element.y);
            this.ctx.scale(element.scale, element.scale);
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            // Рисуем пушистое облако
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
            this.ctx.arc(25, -10, 25, 0, Math.PI * 2);
            this.ctx.arc(-25, -10, 25, 0, Math.PI * 2);
            this.ctx.arc(15, 15, 22, 0, Math.PI * 2);
            this.ctx.arc(-20, 15, 22, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    });
    
    // ГОРЫ
    this.backgroundElements.forEach(element => {
        if (element.type === 'mountain') {
            element.x -= element.speed;
            if (element.x < -300) {
                element.x = this.canvas.width + 300;
            }
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.beginPath();
            this.ctx.moveTo(element.x, this.ground.y);
            this.ctx.lineTo(element.x + 150, this.ground.y - element.height);
            this.ctx.lineTo(element.x + 300, this.ground.y);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.beginPath();
            this.ctx.moveTo(element.x + 75, this.ground.y - element.height + 20);
            this.ctx.lineTo(element.x + 130, this.ground.y - element.height + 60);
            this.ctx.lineTo(element.x + 100, this.ground.y - element.height + 40);
            this.ctx.closePath();
            this.ctx.fill();
        }
    });
    
    // ЗВЕЗДЫ (только для ночной темы)
    if (this.currentTheme === 2) {
        this.backgroundElements.forEach(element => {
            if (element.type === 'star') {
                element.x -= element.speed;
                if (element.x < -10) {
                    element.x = this.canvas.width + 10;
                }
                
                this.ctx.fillStyle = `rgba(255, 255, 255, ${element.brightness * (0.3 + 0.2 * Math.sin(this.time * 2))})`;
                this.ctx.beginPath();
                this.ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    // ЗЕМЛЯ С ТЕКСТУРОЙ
    this.ctx.fillStyle = theme.ground;
    this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
    
    // ТРАВА С ГРАДИЕНТОМ
    const grassGradient = this.ctx.createLinearGradient(0, this.ground.y - 10, 0, this.ground.y);
    grassGradient.addColorStop(0, theme.grass);
    grassGradient.addColorStop(1, this.darkenColor(theme.grass, 20));
    this.ctx.fillStyle = grassGradient;
    this.ctx.fillRect(0, this.ground.y - 10, this.canvas.width, 10);
    
    // ТЕКСТУРА ТРАВЫ (травинки)
    this.ctx.strokeStyle = this.darkenColor(theme.grass, 30);
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 50; i++) {
        const x = (i * 40 + this.time * 100) % (this.canvas.width + 40);
        if (x < this.canvas.width) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.ground.y - 10);
            this.ctx.lineTo(x + Math.sin(this.time + i) * 5, this.ground.y - 25);
            this.ctx.stroke();
        }
    }
    
    // МОНЕТКИ С БЛЕСКОМ
    this.collectibles.forEach(collectible => {
        this.ctx.save();
        this.ctx.translate(collectible.x + collectible.width/2, collectible.y + collectible.height/2);
        this.ctx.rotate(collectible.rotation);
        
        // Основная часть монетки
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, collectible.width/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Блеск
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.arc(-5, -5, collectible.width/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ободок
        this.ctx.strokeStyle = '#FFA000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    });
    
    // ПРЕПЯТСТВИЯ
    this.obstacles.forEach(obstacle => {
        this.ctx.fillStyle = obstacle.color;
        
        if (obstacle.type === 'spike') {
            // Шипы с градиентом
            const spikeGradient = this.ctx.createLinearGradient(
                obstacle.x, obstacle.y,
                obstacle.x, obstacle.y + obstacle.height
            );
            spikeGradient.addColorStop(0, obstacle.color);
            spikeGradient.addColorStop(1, this.darkenColor(obstacle.color, 30));
            
            this.ctx.fillStyle = spikeGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
            this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Контур шипа
            this.ctx.strokeStyle = this.darkenColor(obstacle.color, 40);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else {
            // Платформа с тенью
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Тень под платформой
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width, obstacle.height);
        }
    });
    
    // СЛЕД ИГРОКА
    this.ctx.strokeStyle = theme.primary;
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = 0.6;
    this.ctx.beginPath();
    this.player.trail.forEach((point, index) => {
        if (index === 0) {
            this.ctx.moveTo(point.x, point.y);
        } else {
            this.ctx.lineTo(point.x, point.y);
        }
    });
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
    
    // РИСУЕМ ИГРОКА (КУБИКА)
    this.drawPlayer();
    
    // ЧАСТИЦЫ
    this.particles.forEach(p => {
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
    
    // ТЕКСТОВЫЕ ЭФФЕКТЫ
    this.effects.forEach(effect => {
        this.ctx.globalAlpha = effect.life;
        this.ctx.fillStyle = effect.color;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        
        // Тень текста
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.fillText(effect.text, effect.x, effect.y);
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        this.ctx.globalAlpha = 1;
    });
    this.ctx.globalAlpha = 1;
    
    this.ctx.restore();
}

drawPlayer() {
    this.player.blinkTimer += 0.05;
    if (this.player.blinkTimer > Math.PI * 2) {
        this.player.blinkTimer = 0;
    }
    
    this.player.eyeScale = 0.8 + 0.2 * Math.sin(this.player.blinkTimer * 10);
    
    // Моргание - открывание рта при прыжке
    this.player.mouthOpen = this.player.isJumping;
    
    this.ctx.save();
    this.ctx.translate(
        this.player.x + this.player.width/2, 
        this.player.y + this.player.height/2
    );
    this.ctx.rotate(this.player.rotation * Math.PI / 180);
    this.ctx.scale(this.player.scale, this.player.scale);
    
    // ТЕЛО КУБИКА С ГРАДИЕНТОМ
    const bodyGradient = this.ctx.createLinearGradient(
        -this.player.width/2, -this.player.height/2,
        this.player.width/2, this.player.height/2
    );
    const theme = this.colorThemes[this.currentTheme];
    bodyGradient.addColorStop(0, theme.primary);
    bodyGradient.addColorStop(0.5, theme.primary);
    bodyGradient.addColorStop(1, this.darkenColor(theme.primary, 20));
    
    // Основное тело
    this.ctx.fillStyle = bodyGradient;
    this.ctx.fillRect(-this.player.width/2, -this.player.height/2, 
                      this.player.width, this.player.height);
    
    // Скругленные углы (имитация)
    this.ctx.strokeStyle = this.darkenColor(theme.primary, 30);
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(-this.player.width/2, -this.player.height/2, 
                       this.player.width, this.player.height);
    
    // Блики на кубике
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(-this.player.width/2 + 5, -this.player.height/2 + 5, 
                      this.player.width * 0.3, this.player.height * 0.3);
    
    // ГЛАЗА (большие и выразительные)
    this.ctx.save();
    
    // Левый глаз
    this.ctx.translate(-this.player.width/4, -this.player.height/4);
    this.ctx.scale(1, this.player.eyeScale);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Зрачок левого глаза
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(2, 2, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Блик в глазу
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(-1, -1, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
    
    // Правый глаз
    this.ctx.save();
    this.ctx.translate(this.player.width/4 - 10, -this.player.height/4);
    this.ctx.scale(1, this.player.eyeScale);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Зрачок правого глаза
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(2, 2, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Блик в глазу
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(-1, -1, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
    
    // РОТ (меняется при прыжке)
    this.ctx.fillStyle = '#000000';
    if (this.player.mouthOpen) {
        // Открытый рот (улыбка при прыжке)
        this.ctx.beginPath();
        this.ctx.arc(0, this.player.height/6, 8, 0, Math.PI, false);
        this.ctx.fill();
        
        // Язычок
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.arc(0, this.player.height/6 + 5, 4, 0, Math.PI, true);
        this.ctx.fill();
    } else {
        // Закрытый рот (линия)
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.player.width/6, this.player.height/6);
        this.ctx.lineTo(this.player.width/6, this.player.height/6);
        this.ctx.stroke();
    }
    
    // РУМЯНЦЫ (милые щечки)
    this.ctx.fillStyle = '#FF8A8A';
    this.ctx.beginPath();
    this.ctx.arc(-this.player.width/3, this.player.height/8, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(this.player.width/3 - 10, this.player.height/8, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
}