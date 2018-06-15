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
  osc.frequency.value = 540
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

const cellSize = 6
const cells = {
  width: world.width / cellSize,
  height: world.height / cellSize
}

class Snake {
  constructor (x, y) {
    this.reset()
    this.listenToKeyboard()
  }

  reset () {
    this.data = [
      { x: 10, y: 20 },
      { x: 10, y: 21 },
      { x: 10, y: 22 },
      { x: 10, y: 23 }
    ]
    this.direction = { x: 1, y: 0 }
  }

  listenToKeyboard () {
    document.addEventListener('keydown', e => {
      if (e.key === 'w' || e.key === 'ArrowUp') {
        snake.direction = { x: 0, y: -1 }
      } else if (e.key === 's' || e.key === 'ArrowDown') {
        snake.direction = { x: 0, y: 1 }
      } else if (e.key === 'a' || e.key === 'ArrowLeft') {
        snake.direction = { x: -1, y: 0 }
      } else if (e.key === 'd' || e.key === 'ArrowRight') {
        snake.direction = { x: 1, y: 0 }
      }
    })
  }

  eatItself (head) {
    return this.data.some(({ x, y }) => head.x === x && head.y === y)
  }

  update (food, score) {
    let head = this.data[0]
    let newHead = {
      x: (head.x + this.direction.x + cells.width) % cells.width,
      y: (head.y + this.direction.y + cells.height) % cells.height
    }

    if (this.eatItself(newHead)) {
      restart(this, food, score)
      bop()
      return
    } else if (food.x === newHead.x && food.y === newHead.y) {
      food.reset()
      score.inc()
      beep()
    } else {
      this.data.pop()
    }

    this.data.unshift(newHead)
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw (ctx) {
    ctx.fillStyle = 'black'
    this.data.forEach(({ x, y }) => {
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
    })
  }
}

class Food {
  constructor () {
    this.reset()
  }

  reset () {
    this.x = Math.floor(Math.random() * cells.width)
    this.y = Math.floor(Math.random() * cells.height)
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw (ctx) {
    ctx.fillStyle = 'red'
    ctx.fillRect(this.x * cellSize, this.y * cellSize, cellSize, cellSize)
  }
}

const score = {
  data: 0,
  draw: function (ctx) {
    ctx.fillStyle = 'black'
    ctx.fillText(`${this.data}`, 0, world.height / 2)
  },
  inc: function () {
    this.data++
  },
  reset: function () {
    this.data = 0
  }
}

const snake = new Snake(30, 30)
const food = new Food()
let started = false

function restart (snake, food, score) {
  snake.reset()
  food.reset()
  score.reset()
  started = false
  setTimeout(() => {
    started = true
  }, 1000)
}
restart(snake, food, score)

function loop () {
  setTimeout(() => {
    requestAnimationFrame(loop)
  }, 300)
  ctx.clearRect(0, 0, world.width, world.height)

  started && snake.update(food, score)
  score.draw(ctx)
  snake.draw(ctx)
  food.draw(ctx)
}

requestAnimationFrame(loop)
