let score = 0;
let timeLeft = 15;
let gameOver = false;
let highScore = localStorage.getItem("highScore") || 0;
let combo = 0;
let gameStarted = false;

let scoreText, timerText, comboText, highScoreText;
let circle, particles, tapSound;
let startBtn;

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container', // مهم جدًا
    scene: { preload, create, update },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};

new Phaser.Game(config);

function preload() {
    this.load.audio('tap', 'https://actions.google.com/sounds/v1/cartoon/pop.ogg');
    // لا تحميل أي صورة، لتجنب توقف اللعبة
}

function create() {
    let scene = this;

    // Facebook Init (FBInstant)
    if (typeof FBInstant !== "undefined") {
        FBInstant.initializeAsync().then(() => FBInstant.startGameAsync());
    }

    // 🌈 Background
    let bg = scene.add.graphics();
    bg.fillGradientStyle(0x1a2a6c, 0xb21f1f, 0xfdbb2d, 0x000000, 1);
    bg.fillRect(0, 0, 400, 600);

    // 💾 UI
    scoreText = scene.add.text(130, 20, 'Score: 0', { fontSize: '26px', color: '#fff' });
    timerText = scene.add.text(130, 60, 'Time: 15', { fontSize: '24px', color: '#0ff' });
    comboText = scene.add.text(140, 100, 'Combo: 0', { fontSize: '22px', color: '#ff0' });
    highScoreText = scene.add.text(110, 140, 'Best: ' + highScore, { fontSize: '20px', color: '#0f0' });

    // ⭕ Circle
    circle = scene.add.circle(200, 350, 80, 0x00ffcc).setInteractive();
    scene.tweens.add({ targets: circle, scale: 1.1, duration: 700, yoyo: true, repeat: -1 });

    // 💥 Particles
    particles = scene.add.particles(0, 0, null, { speed: { min:-150,max:150 }, scale:{start:0.6,end:0}, lifespan:400, quantity:8 });

    // 🔊 Sound
    tapSound = scene.sound.add('tap');

    // 🎮 START Button
    if (!gameStarted) {
        startBtn = scene.add.text(config.width/2, config.height-150, 'START', {
            fontSize: '32px', color:'#00ffff', backgroundColor:'#000', padding:{x:20,y:10}
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerdown', () => {
            gameStarted = true;

            // Resume AudioContext
            if(scene.sound.context.state === 'suspended') scene.sound.context.resume();

            scene.scene.restart();
        });
        return;
    }

    // ⏱ Reset gameplay variables
    score = 0; timeLeft=15; combo=0; gameOver=false;

    // Tap Event
    circle.on('pointerdown', () => {
        if(!gameOver){
            score++; combo++; timeLeft+=0.4;
            scoreText.setText('Score: '+score);
            comboText.setText('Combo: '+combo);
            circle.setFillStyle(Phaser.Display.Color.RandomRGB().color);
            particles.emitParticleAt(circle.x,circle.y);
            tapSound.play();
            if(navigator.vibrate) navigator.vibrate(30);

            scene.tweens.add({ targets:circle, scale:1.25, duration:80, yoyo:true });

            if(combo%10===0){ timeLeft+=2; showText(scene,"🔥 BONUS +2s"); }
        }
    });

    // ⏱ Timer
    scene.time.addEvent({
        delay:1000, loop:true,
        callback:()=>{ 
            if(!gameOver){ 
                timeLeft--; combo=0; comboText.setText('Combo: 0'); timerText.setText('Time: '+Math.floor(timeLeft)); 
                if(timeLeft<=0) endGame(scene); 
            }
        }
    });
}

function update(){}

function endGame(scene){
    gameOver=true;
    showText(scene,"GAME OVER",200);

    if(score>highScore){
        highScore=score;
        localStorage.setItem("highScore",score);
        showText(scene,"🏆 NEW RECORD!",250);
    }

    showText(scene,"Score: "+score,300);

    // 🔁 Restart Button
    let restart = scene.add.text(130,360,'PLAY AGAIN',{
        fontSize:'26px', color:'#00ffff', backgroundColor:'#000', padding:{x:20,y:10}
    }).setInteractive();
    restart.on('pointerdown',()=>scene.scene.restart());

    // 🏆 Facebook Leaderboard
    if(typeof FBInstant!=="undefined"){
        FBInstant.getLeaderboardAsync('highscores').then(lb=>lb.setScoreAsync(score));
    }
}

// ✨ Floating Text
function showText(scene,msg,y=220){
    let txt = scene.add.text(100,y,msg,{ fontSize:'24px', color:'#fff' });
    scene.tweens.add({ targets:txt, y:y-50, alpha:0, duration:800, onComplete:()=>txt.destroy() });
}
