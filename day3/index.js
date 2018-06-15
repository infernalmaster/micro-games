const canvas = document.getElementById('app')

const world = {
  width: 300,
  height: 300
}
canvas.width = world.width
canvas.height = world.height
canvas.style.width = '150px'
canvas.style.height = '150px'

/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext('2d')
ctx.font = '40px Arial'

const soundCtx = new (window.AudioContext || window.webkitAudioContext)()
function piu () {
  const osc = soundCtx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 540
  osc.connect(soundCtx.destination)
  osc.start()
  osc.stop(soundCtx.currentTime + 0.3)
}
function bah () {
  const osc = soundCtx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 240
  osc.connect(soundCtx.destination)
  osc.start()
  osc.stop(soundCtx.currentTime + 0.1)
}

const score = {
  data: 0,
  draw: function () {
    ctx.fillStyle = 'black'
    ctx.fillText(`${this.data}`, grid.maxX + 10, grid.maxY - 10)
  },
  inc: function () {
    this.data++
  },
  reset: function () {
    this.data = 0
  }
}

const figureTemplates = [
  [[1, 1], [1, 1]],
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
  [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
  [[0, 0, 0], [1, 1, 0], [0, 1, 1]]
]

function drawData (data) {
  data.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === 1 || cell === 2) {
        let x = columnIndex * grid.cellSize
        let y = rowIndex * grid.cellSize
        ctx.fillStyle = cell === 1 ? 'black' : 'red'
        ctx.fillRect(x, y, grid.cellSize, grid.cellSize)
      }
    })
  })
}

function createGrid (cols, rows) {
  const cellSize = world.height / rows
  const maxX = cellSize * cols
  const maxY = cellSize * rows

  const data = new Array(rows).fill(0).map(() => new Array(cols).fill(0))

  return {
    data,
    cols,
    rows,
    cellSize,
    maxX,
    maxY,
    draw: function () {
      ctx.beginPath()
      for (let i = 0; i <= this.cols; i++) {
        const x = i * this.cellSize
        ctx.moveTo(x, 0)
        ctx.lineTo(x, this.maxY)
      }
      for (let i = 0; i <= this.rows; i++) {
        const y = i * this.cellSize
        ctx.moveTo(0, y)
        ctx.lineTo(this.maxX, y)
      }
      ctx.stroke()

      drawData(this.data)
    },
    update: function () {
      for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
        const row = this.data[rowIndex]
        if (row.every(c => c === 1)) {
          score.inc()
          piu()

          let index = rowIndex
          while (index > 0) {
            this.data[index] = this.data[index - 1]
            index--
          }

          this.data[0] = row.map(() => 0)
        }
      }
    },
    copyFigure: function (figure) {
      const size = figure.data.length
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (figure.data[i][j] === 1) {
            const cellX = j + figure.x
            const cellY = i + figure.y

            this.data[cellY][cellX] = 1
          }
        }
      }
    }
  }
}

const grid = createGrid(10, 20)

function rotate (data) {
  let rotated = clone(data)

  const size = data.length
  for (let i = 0; i < size; ++i) {
    for (let j = 0; j < size; ++j) {
      rotated[i][j] = data[size - j - 1][i]
    }
  }

  return rotated
}

function mirror (data) {
  return data.map(row => row.reverse())
}

function rnd (max) {
  return Math.round(Math.random() * max)
}
function clone (data) {
  return JSON.parse(JSON.stringify(data))
}

function createFigure () {
  let moveDownTime = new Date()
  let template = clone(figureTemplates[rnd(4)])

  for (let i = 0; i < rnd(4); i++) {
    template = rotate(template)
  }
  if (Math.random() > 0.5) {
    template = mirror(template)
  }

  return {
    data: template,
    x: 3,
    y: 0,
    draw: function () {
      ctx.save()
      ctx.translate(this.x * grid.cellSize, this.y * grid.cellSize)
      drawData(this.data)
      ctx.restore()
    },
    drawAsNext: function () {
      ctx.save()
      ctx.translate(grid.maxX, grid.cellSize * 5)
      this.draw()
      ctx.restore()
    },
    left: function () {
      const newX = this.x - 1
      if (this.canMoveToNewPosition(newX, this.y, this.data)) {
        this.x = newX
      }
    },
    right: function () {
      const newX = this.x + 1
      if (this.canMoveToNewPosition(newX, this.y, this.data)) {
        this.x = newX
      }
    },
    down: function () {
      const newY = this.y + 1
      if (this.canMoveToNewPosition(this.x, newY, this.data)) {
        this.y = newY
      }
    },
    rotate: function () {
      let rotated = rotate(this.data)

      if (this.canMoveToNewPosition(this.x, this.y, rotated)) {
        this.data = rotated
      }
    },

    update: function (done) {
      const current = new Date()

      if (current - moveDownTime > 400) {
        moveDownTime = current
        const newY = this.y + 1
        if (this.canMoveToNewPosition(this.x, newY, this.data)) {
          this.y = newY
        } else {
          done()
        }
      }
    },
    canMoveToNewPosition: function (x, y, data) {
      const size = data.length
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const cell = data[i][j]
          if (cell === 1) {
            const cellX = j + x
            const cellY = i + y

            if (cellX < 0 || cellX >= grid.cols) {
              return false
            }
            if (cellY === grid.rows) {
              return false
            }

            if (grid.data[cellY][cellX] === 1) {
              return false
            }
          }
        }
      }

      return true
    }
  }
}

let figure = createFigure()
let nextFigure = createFigure()
function listenToKeyboard () {
  document.addEventListener('keydown', e => {
    bah()
    if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') {
      figure.rotate()
    } else if (e.key === 's' || e.key === 'ArrowDown') {
      figure.down()
    } else if (e.key === 'a' || e.key === 'ArrowLeft') {
      figure.left()
    } else if (e.key === 'd' || e.key === 'ArrowRight') {
      figure.right()
    }
  })
}
listenToKeyboard()

let gameOver = false

function loop () {
  requestAnimationFrame(loop)

  ctx.clearRect(0, 0, world.width, world.height)

  grid.update()
  figure.update(() => {
    grid.copyFigure(figure)
    figure = nextFigure
    nextFigure = createFigure()

    if (!figure.canMoveToNewPosition(figure.x, figure.y, figure.data)) {
      figure.draw()
      gameOver = true
    }
  })

  if (gameOver) {
    ctx.fillText('Game', grid.maxX + 10, 190)
    ctx.fillText('Over', grid.maxX + 10, 230)
  }

  grid.draw()
  figure.draw()
  nextFigure.drawAsNext()
  score.draw()
}

requestAnimationFrame(loop)
