const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// setup canvas size
canvas.width = 1024;
canvas.height = 576;
c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;

const background = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    imageSrc: './img/background.png'
});

// takes too much time to make work with custom animation images ==> scrapped for now
/*
const torch1 = new Sprite({
    position: {
        x: 670,
        y: 175
    },
    imageSrc: './img/torch.png',
    scale: 0.8,
    framesMax: 3
});

const torch2 = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    imageSrc: './img/torches.png',
    scale: 1
});
*/

const player = new Fighter({
    position: {
        x: 0,
        y: 0
    },
    velocity: {
        x: 0,
        y: 0
    },
    offset: {
        x: 0,
        y: 0
    },
    imageSrc: './img/playersprites/Sprites/Idle.png',
    framesMax: 8,
    scale: 2.5,
    offset: {x: 180, y: 160},
    sprites: {
        idle: {
            imageSrc: './img/playersprites/Sprites/Idle.png',
            framesMax: 8
        },
        run: {
            imageSrc: './img/playersprites/Sprites/Run.png',
            framesMax: 8
        },
        jump: {
            imageSrc: './img/playersprites/Sprites/Jump.png',
            framesMax: 2
        },
        fall: {
            imageSrc: './img/playersprites/Sprites/Fall.png',
            framesMax: 2
        },
        attack1: {
            imageSrc: './img/playersprites/Sprites/Attack1.png',
            framesMax: 6
        },
        takeHit: {
            imageSrc: './img/playersprites/Sprites/Take hit - white silhouette.png',
            framesMax: 4
        },
        death: {
            imageSrc: './img/playersprites/Sprites/Death.png',
            framesMax: 6
        }
    },
    attackBox: {
        offset: {
            x: 100,
            y: 50
        },
        width: 160,
        height: 50
    }
});

const enemy = new Fighter({
    position: {
        x: 400,
        y: 100
    },
    velocity: {
        x: 0,
        y: 0
    },
    color: 'blue',
    offset: {
        x: -50,
        y: 0
    },
    imageSrc: './img/enemysprites/Sprites/Idle.png',
    framesMax: 4,
    scale: 2.5,
    offset: {x: 180, y: 175},
    sprites: {
        idle: {
            imageSrc: './img/enemysprites/Sprites/Idle.png',
            framesMax: 4
        },
        run: {
            imageSrc: './img/enemysprites/Sprites/Run.png',
            framesMax: 8
        },
        jump: {
            imageSrc: './img/enemysprites/Sprites/Jump.png',
            framesMax: 2
        },
        fall: {
            imageSrc: './img/enemysprites/Sprites/Fall.png',
            framesMax: 2
        },
        attack1: {
            imageSrc: './img/enemysprites/Sprites/Attack1.png',
            framesMax: 4
        },
        takeHit: {
            imageSrc: './img/enemysprites/Sprites/Take hit1.png',
            framesMax: 4
        },
        death: {
            imageSrc: './img/enemysprites/Sprites/Death.png',
            framesMax: 7
        }
    },
    attackBox: {
        offset: {
            x: -180, // was 140
            y: 50
        },
        width: 140,
        height: 50
    }
});


const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    }
}



decreaseTimer();

// animation loop
function animate() {
    window.requestAnimationFrame(animate);
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);
    background.update();
    //torch1.update();
    //torch2.update();

    // near-transparent overlay
    c.fillStyle = 'rgba(255, 255, 255, 0.15)';
    c.fillRect(0, 0, canvas.width, canvas.height);

    player.update();
    enemy.update();

    // prevent sliding
    player.velocity.x = 0;
    enemy.velocity.x = 0;

    // player movement
    
    if (keys.a.pressed && player.lastKey === 'a') {
        player.velocity.x = -5;
        player.switchSprite('run');
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 5;
        player.switchSprite('run');
    } else {
        player.switchSprite('idle');
    }

    // player jump
    if (player.velocity.y < 0) {
        player.switchSprite('jump');
    } else if (player.velocity.y > 0) {
        player.switchSprite('fall');
    }

    // enemy movement
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
        enemy.velocity.x = -5;
        enemy.switchSprite('run');
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
        enemy.velocity.x = 5;
        enemy.switchSprite('run');
    } else {
        enemy.switchSprite('idle');
    }

    // enemy jump
    if (enemy.velocity.y < 0) {
        enemy.switchSprite('jump');
    } else if (enemy.velocity.y > 0) {
        enemy.switchSprite('fall');
    }

    // Collision detecting and damage
    if (
        rectangularCollision({
            rectangle1: player,
            rectangle2: enemy
        }) &&
        player.isAttacking && player.framesCurrent === 4
    ) {
        enemy.takeHit();
        player.isAttacking = false;

        gsap.to('#enemyHealth', {
            width: enemy.health + '%'
        })
    }

    // if player misses
    if (player.isAttacking && player.framesCurrent === 4) {
        player.isAttacking = false;
    }

    // player gets hit
    if (
        rectangularCollision({
            rectangle1: enemy,
            rectangle2: player
        }) &&
        enemy.isAttacking && enemy.framesCurrent === 2
    ) {
        player.takeHit();
        enemy.isAttacking = false;
        gsap.to('#playerHealth', {
            width: player.health + '%'
        })
    }

    // if enemy misses
    if (enemy.isAttacking && enemy.framesCurrent === 2) {
        enemy.isAttacking = false;
    }

    // game over based on health depletion
    if (enemy.health <= 0 || player.health <= 0 ) {
        determineWinner({ player, enemy, timerId });
    } 
}
animate();

//Key EventListeners

window.addEventListener('keydown', (event) => {
    if (!player.dead) {

        switch (event.key) {
            case 'd':
                keys.d.pressed = true;
                player.lastKey = 'd';
                break;
            case 'a':
                keys.a.pressed = true;
                player.lastKey = 'a';
                break;
            case 'w':
                player.velocity.y = -20;
                break;
            case ' ':
                player.attack();
                break;
        }
    }

    if (!enemy.dead) {
        switch(event.key) {
            case 'ArrowRight':
                keys.ArrowRight.pressed = true;
                enemy.lastKey = 'ArrowRight';
                break;
            case 'ArrowLeft':
                keys.ArrowLeft.pressed = true;
                enemy.lastKey = 'ArrowLeft';
                break;
            case 'ArrowUp':
                enemy.velocity.y = -20;
                break;
            case 'ArrowDown':
                enemy.attack();
                break;
        }
    }
})

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
    }
    // enemy keys
    switch (event.key) {
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
    }

    console.log(event.key);
})