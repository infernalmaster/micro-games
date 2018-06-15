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
function beep () {
  const osc = soundCtx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 440
  osc.connect(soundCtx.destination)
  osc.start()
  osc.stop(soundCtx.currentTime + 0.1)
}
function bop () {
  const osc = soundCtx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 140
  osc.connect(soundCtx.destination)
  osc.start()
  osc.stop(soundCtx.currentTime + 0.1)
}

/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext('2d')
ctx.font = '40px Arial'

class Vec {
  constructor (x, y) {
    this.x = x
    this.y = y
  }

  addVector (vector) {
    this.x += vector.x
    this.y += vector.y
  }
}

const keys = new Set()
document.addEventListener('keydown', e => {
  keys.add(e.key)
})
document.addEventListener('keyup', e => {
  keys.delete(e.key)
})

class Ball {
  /**
   * @param {Vec} position
   * @param {Vec} speed
   */
  constructor (size) {
    this.width = size
    this.height = size
    this.restart()
  }

  restart () {
    this.position = new Vec(world.width / 2, world.height / 2)
    this.speed = new Vec(
      Math.round(Math.random() * 4) - 2,
      Math.random() > 0.5 ? 2 : -2
    )
  }

  update () {
    this.position.addVector(this.speed)

    if (this.position.x + this.width > world.width || this.position.x < 0) {
      this.speed.x *= -1
      beep()
    }
  }
}

class Paddle {
  /**
   * @param {Vec} position
   * @param {Vec} speed
   */
  constructor (position, speed, width, height) {
    this.position = position
    this.width = width
    this.height = height
    this.speed = speed
  }

  update () {
    this.position.addVector(this.speed)

    if (this.position.x + this.width > world.width) {
      this.position.x = world.width - this.width
    } else if (this.position.x < 0) {
      this.position.x = 0
    }
  }
}

function isCollideBoxes (entity1, entity2) {
  return (
    ((entity1.position.x < entity2.position.x &&
      entity1.position.x + entity1.width > entity2.position.x) ||
      (entity1.position.x > entity2.position.x &&
        entity1.position.x < entity2.position.x + entity2.width)) &&
    ((entity1.position.y < entity2.position.y &&
      entity1.position.y + entity1.height > entity2.position.y) ||
      (entity1.position.y > entity2.position.y &&
        entity1.position.y < entity2.position.y + entity2.height))
  )
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function draw (ctx, box) {
  ctx.fillRect(box.position.x, box.position.y, box.width, box.height)
}

const ball = new Ball(10, 10)

const maxPaddleSpeed = 5
const paddle1 = new Paddle(new Vec(0, 0), new Vec(0, 0), 50, 5)
paddle1.control = function () {
  if (ball.position.x + ball.width / 2 > this.position.x + this.width / 2) {
    this.speed.x = maxPaddleSpeed
  } else {
    this.speed.x = -maxPaddleSpeed
  }
}

const paddle2 = new Paddle(new Vec(0, 0), new Vec(0, 0), 50, 5)
paddle2.control = function () {
  this.speed = new Vec(0, 0)

  if (keys.has('a') || keys.has('ArrowLeft')) {
    this.speed.x = -maxPaddleSpeed
  }

  if (keys.has('d') || keys.has('ArrowRight')) {
    this.speed.x = maxPaddleSpeed
  }
}

const score = { paddle1: 0, paddle2: 0 }

let entities = [ball, paddle1, paddle2]

let started = false
function restart () {
  started = false
  paddle1.position = new Vec(120, 15)
  paddle2.position = new Vec(120, 280)
  ball.restart()
  setTimeout(() => {
    started = true
  }, 1000)
}
restart()

function loop () {
  requestAnimationFrame(loop)

  ctx.clearRect(0, 0, world.width, world.height)

  paddle1.control()
  paddle2.control()

  started && entities.forEach(e => e.update())

  if (isCollideBoxes(ball, paddle1)) {
    ball.speed.y = Math.abs(ball.speed.y) * 1.1
    ball.speed.x += paddle1.speed.x / 5
    beep()
  }

  if (isCollideBoxes(ball, paddle2)) {
    ball.speed.y = -Math.abs(ball.speed.y) * 1.1
    ball.speed.x += paddle2.speed.x / 5
    beep()
  }

  if (ball.position.y < 0) {
    score.paddle1 += 1
    restart()
    bop()
  } else if (ball.position.y > world.height) {
    score.paddle2 += 1
    restart()
    bop()
  }

  ctx.fillText(`${score.paddle1}`, 0, world.height / 2 - 30)
  ctx.fillText(`${score.paddle2}`, 0, world.height / 2 + 30)

  entities.forEach(e => draw(ctx, e))
}

requestAnimationFrame(loop)
