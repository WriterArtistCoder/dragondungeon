import { Countdown, GameState, CoinJar, Player, Wall } from '../common'
import CoreRoom from './CoreRoom'
import { v4 } from 'uuid'
import { Client } from 'colyseus'
import { calculateAngle } from '../common/maths'

let botNames = require('./botnames.json')

export class SurvivalRoom extends CoreRoom {
  constructor() {
    let state = new GameState()
    state.gamemode = 'LDS'
    super(state)
  }

  async onJoin(
    client: Client,
    options: { token: string },
    _2: any,
  ): Promise<void> {
    super.broadcast('music', '/assets/music/swinging.mp3')
    super.onJoin(client, options, _2)
  }

  tick(): void {
    super.tick()

    let dragonsStanding = []
    this.state.players.forEach((player) => {
      if (player.isGhost == false) {
        dragonsStanding.push(player.onlineName)
      }
    })

    if (dragonsStanding.length == 1 && this.state.players.size > 1) {
      super.gameOver(`${dragonsStanding[0]} was the last dragon standing!`)
    }
  }
}

export class ArenaRoom extends CoreRoom {
  constructor() {
    let state = new GameState()
    state.countdown = new Countdown(4, 0)
    state.coinJars.set(v4(), new CoinJar(1500, 1500, 0))

    let botPlayerA = new Player('mud', 0, 0)
    botPlayerA.onlineName =
      botNames[Math.floor(Math.random() * botNames.length)]
    botPlayerA.isBot = true
    state.players.set(v4(), botPlayerA)

    let botPlayerB = new Player('poison', 0, 0)
    botPlayerB.onlineName =
      botNames[Math.floor(Math.random() * botNames.length)]
    botPlayerB.isBot = true

    state.players.set(v4(), botPlayerB)

    state.walls.set(
      v4(),
      new Wall(3000 / 2 + 350, 3000 / 2 + 350, 700, 50, true, 2, 'coingrab', 0),
    )

    state.walls.set(
      v4(),
      new Wall(
        3000 / 2 + 350,
        3000 / 2 + 350,
        700,
        50,
        false,
        2,
        'coingrab',
        0,
      ),
    )
    //bottom left
    state.walls.set(
      v4(),
      new Wall(3000 / 2 - 350, 3000 / 2 + 350, 700, 50, true, 2, 'coingrab', 0),
    )
    state.walls.set(
      v4(),
      new Wall(
        3000 / 2 - 350 - 700,
        3000 / 2 + 350,
        700,
        50,
        false,
        2,
        'coingrab',
        0,
      ),
    )
    //top left
    state.walls.set(
      v4(),
      new Wall(
        3000 / 2 - 350,
        3000 / 2 - 350 - 700,
        700,
        50,
        true,
        2,
        'coingrab',
        0,
      ),
    )
    state.walls.set(
      v4(),
      new Wall(
        3000 / 2 - 350 - 700,
        3000 / 2 - 350,
        700,
        50,
        false,
        2,
        'coingrab',
        0,
      ),
    )
    //top right
    state.walls.set(
      v4(),
      new Wall(
        3000 / 2 + 400,
        3000 / 2 - 350 - 700,
        700,
        50,
        true,
        2,
        'coingrab',
        0,
      ),
    )
    state.walls.set(
      v4(),
      new Wall(
        3000 / 2 + 350,
        3000 / 2 - 350,
        700,
        50,
        false,
        2,
        'coingrab',
        0,
      ),
    )

    super(state)
  }

  async onJoin(
    client: Client,
    options: { token: string },
    _2: any,
  ): Promise<void> {
    super.broadcast('music', '/assets/music/voice.mp3')
    super.onJoin(client, options, _2)
  }

  tick(): void {
    super.tick()
    for (
      let i = super.getState().coins.size;
      i < super.getState().players.size * 20;
      i++
    ) {
      super.spawnCoin()
    }

    this.moveBots()
  }
}

export class CaptureRoom extends CoreRoom {
  constructor() {
    let state = new GameState()
    state.gamemode = 'CTC'
    state.countdown.minutes = 4
    state.coinJars.set(v4(), new CoinJar(200, 1500, 1))
    state.coinJars.set(v4(), new CoinJar(2800, 1500, 2))
    let setWallTeam = (i: number, isRedTeam: boolean) => {
      if (i == 0 || i == 3) {
        return 0
      } else {
        if (isRedTeam) {
          return 1
        } else {
          return 2
        }
      }
    }

    for (let i = 0; i < 4; i++) {
      state.walls.set(
        v4(),
        new Wall(
          i * (3000 / 3 / 4),
          3000 / 3,
          3000 / 3 / 4,
          30,
          false,
          10,
          'CTC',
          setWallTeam(i, true),
        ),
      )
    }

    for (let i = 0; i < 4; i++) {
      state.walls.set(
        v4(),
        new Wall(
          3000 / 3,
          i * (3000 / 3 / 4) + 3000 / 3,
          3000 / 3 / 4,
          30,
          true,
          10,
          'CTC',
          setWallTeam(i, true),
        ),
      )
    }
    for (let i = 0; i < 4; i++) {
      state.walls.set(
        v4(),
        new Wall(
          i * (3000 / 3 / 4),
          (3000 / 3) * 2,
          3000 / 3 / 4,
          30,
          false,
          10,
          'CTC',
          setWallTeam(i, true),
        ),
      )
    }
    //RIGHT SIDE
    for (let i = 0; i < 4; i++) {
      state.walls.set(
        v4(),
        new Wall(
          i * (3000 / 3 / 4) + 3000 / 1.5,
          3000 / 3,
          3000 / 3 / 4,
          30,
          false,
          10,
          'CTC',
          setWallTeam(i, false),
        ),
      )
    }
    for (let i = 0; i < 4; i++) {
      state.walls.set(
        v4(),
        new Wall(
          3000 / 3 + 3000 / 3,
          i * (3000 / 3 / 4) + 3000 / 3,
          3000 / 3 / 4,
          30,
          true,
          10,
          'CTC',
          setWallTeam(i, false),
        ),
      )
    }
    for (let i = 0; i < 4; i++) {
      state.walls.set(
        v4(),
        new Wall(
          i * (3000 / 3 / 4) + 3000 / 1.5,
          (3000 / 3) * 2,
          3000 / 3 / 4,
          30,
          false,
          10,
          'CTC',
          setWallTeam(i, false),
        ),
      )
    }

    super(state)
  }

  async onJoin(
    client: Client,
    options: { token: string },
    _2: any,
  ): Promise<void> {
    super.broadcast('music', '/assets/music/brawl.mp3')
    super.onJoin(client, options, _2)
  }
  tick(): void {
    super.tick()
    if (super.getState().coins.size < 100) {
      super.spawnCoin()
    }
  }
}

export class ZonesRoom extends CoreRoom {
  constructor() {
    let state = new GameState()
    state.gamemode = 'Zones'
    state.countdown.minutes = 4
    state.coinJars.set(v4(), new CoinJar(600, 700, 0))
    state.coinJars.set(v4(), new CoinJar(1000, 2800, 0))
    state.coinJars.set(v4(), new CoinJar(1400, 2540, 0))
    state.coinJars.set(v4(), new CoinJar(1800, 1230, 0))

    const botPlayerA = new Player('ice', 0, 0)
    botPlayerA.onlineName =
      botNames[Math.floor(Math.random() * botNames.length)]
    botPlayerA.isBot = true
    botPlayerA.team = 1
    state.players.set(v4(), botPlayerA)

    // const botPlayerB = new Player('poison', 0, 0)
    // botPlayerB.onlineName =
    //   botNames[Math.floor(Math.random() * botNames.length)]
    // botPlayerB.isBot = true
    // botPlayerB.team = 2
    // state.players.set(v4(), botPlayerB)

    super(state)
  }

  async onJoin(
    client: Client,
    options: { token: string },
    _2: any,
  ): Promise<void> {
    super.broadcast('music', '/assets/music/newsroom.mp3')
    super.onJoin(client, options, _2)
  }

  tick(): void {
    super.tick()
    for (
      let i = super.getState().coins.size;
      i < super.getState().players.size * 20;
      i++
    ) {
      super.spawnCoin()
    }
    this.state.players.forEach((player) => {
      if (player.isBot || player.isNPC) {
        const coinjars = Array.from(this.state.coinJars.values()).filter(
          (coinjar) => coinjar.team !== player.team,
        )
        const distance = 500
        const coinjar = coinjars.find((jar) => {
          const dx = jar.x - player.x
          const dy = jar.y - player.y
          return dx * dx + dy * dy < distance * distance
        })

        if (coinjar) {
          const direction = calculateAngle(
            player.x,
            player.y,
            coinjar.x,
            coinjar.y,
          )
          player.angle = direction
          player.activeInputs.angle = player.angle
          player.inputs(player.activeInputs)
          this.captureCoinJar(player)
        } else {
          this.moveBot(player)
        }
      }
    })
  }
}

export class EssentialRoom extends CoreRoom {
  constructor() {
    let state = new GameState()
    super(state)
  }
}
