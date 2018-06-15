const canvas = document.getElementById('app')

const world = {
  width: 300,
  height: 300
}
canvas.width = world.width
canvas.height = world.height
canvas.style.width = '150px'
canvas.style.height = '150px'

const soundCtx = new (window.AudioContext || window.webkitAudioContext)()
function piu () {
  const osc = soundCtx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 540
  osc.connect(soundCtx.destination)
  osc.start()
  osc.stop(soundCtx.currentTime + 0.1)
}
function bah () {
  const osc = soundCtx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 240
  osc.connect(soundCtx.destination)
  osc.start()
  osc.stop(soundCtx.currentTime + 0.1)
}

/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext('2d')
ctx.font = '40px Arial'

const invaders = {
  x: 0,
  y: 0,
  vx: 0.6,
  vy: 0.3,
  update: function () {
    this.x += this.vx
    this.y += this.vy
    if (this.x < 0 || this.x > 20) {
      this.vx *= -1
    }
  },
  data: new Array(5).fill(true).map(() => new Array(10).fill(true)),
  draw: function () {
    ctx.fillStyle = 'black'
    this.iterate((x, y, w, h) => {
      ctx.fillRect(x, y, w, h)
    })
  },
  iterate: function (withEach) {
    this.data.forEach((row, rowIndex) => {
      row.forEach((el, colIndex) => {
        if (el) {
          withEach(
            colIndex * 30 + this.x,
            rowIndex * 20 + this.y,
            10,
            10,
            rowIndex,
            colIndex
          )
        }
      })
    })
  }
}

const keys = new Set()
document.addEventListener('keydown', e => {
  keys.add(e.key)
})
document.addEventListener('keyup', e => {
  keys.delete(e.key)
})

const bullets = {
  data: [],
  lastBulletTime: new Date(),
  create (x, y, vx, speedY) {
    const currentTime = new Date()
    if (currentTime - this.lastBulletTime > 150) {
      this.data.push({ x, y, vx, speedY })
      this.lastBulletTime = currentTime
      piu()
    }
  },
  update: function () {
    this.data.filter(({ y }) => y > 0)
    this.data.forEach(b => {
      b.x += b.vx
      b.y += b.speedY
    })
  },
  draw: function () {
    ctx.fillStyle = 'red'
    this.data.forEach(({ x, y }) => {
      ctx.fillRect(x, y, 2, 4)
    })
  }
}

const player = {
  x: world.width / 2,
  y: world.height - 20,
  vx: 0,
  size: 10,
  maxSpeed: 2,
  draw: function () {
    ctx.fillStyle = 'black'
    ctx.fillRect(this.x, this.y, this.size, this.size)
  },
  update: function () {
    this.x += this.vx
    if (this.x < 0) {
      this.x = 0
    } else if (this.x + this.size > world.width) {
      this.x = world.width - this.size
    }
  },
  control: function () {
    this.vx = 0

    if (keys.has('a') || keys.has('ArrowLeft')) {
      this.vx = -this.maxSpeed
    }

    if (keys.has('d') || keys.has('ArrowRight')) {
      this.vx = this.maxSpeed
    }

    if (keys.has('w') || keys.has('ArrowUp') || keys.has(' ')) {
      bullets.create(this.x + this.size / 2 - 1, this.y, 0, -2)
    }
  }
}

function collideInvadersWithBullets (invaders, bullets, score) {
  invaders.iterate((x, y, w, h, rowIndex, colIndex) => {
    bullets.data.forEach((bullet, bulletIndex) => {
      if (
        bullet.x >= x &&
        bullet.x < x + w &&
        bullet.y >= y &&
        bullet.y < y + h
      ) {
        invaders.data[rowIndex][colIndex] = false
        bullets.data.splice(bulletIndex, 1)
        score.inc()
        bah()
      }
    })
  })
}

const score = {
  data: 0,
  draw: function () {
    ctx.fillStyle = 'black'
    ctx.fillText(`${this.data}`, 0, world.height - 2)
  },
  inc: function () {
    this.data++
  },
  reset: function () {
    this.data = 0
  }
}

function loop () {
  requestAnimationFrame(loop)
  ctx.clearRect(0, 0, world.width, world.height)

  collideInvadersWithBullets(invaders, bullets, score)

  player.control()
  player.update()
  bullets.update()
  invaders.update()
  score.draw()
  invaders.draw()
  player.draw()
  bullets.draw()
}

requestAnimationFrame(loop)
