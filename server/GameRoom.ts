import { Room, Client } from 'colyseus'

import {
  GameState,
  Player,
  IInputs,
  Coin,
  Maths,
  Countdown,
  Fireball,
  Bat,
  Skull,
  Wall,
  CoinJar,
} from '../common'

import * as admin from 'firebase-admin'
import { v4 } from 'uuid'
import { BaseTexture } from 'pixi.js'

const botnames = require('./botnames.json')
const botwords = require('./wordlists/nouns.json')
const MAX_COINS_HELD = 30

const serviceAccount = require('../config/private/adminsdk.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

class ServerPlayer extends Player {
  colyseusClient: Client = null
  constructor(
    ballType: string,
    skinType: string,
    teamNum: number,
    client: Client,
  ) {
    super(ballType, skinType, teamNum)
    this.colyseusClient = client
  }
}

export class GameRoom extends Room<GameState> {
  counter = 0
  maxClients = 6

  redTeamIds: string[] = []
  blueTeamIds: string[] = []

  botPlayers: Player[] = []

  gameInt: NodeJS.Timeout

  onCreate() {
    this.setState(new GameState())
    this.registerMessages()
    this.startGameLoop()
  }

  manageBat() {
    let bat = new Bat(
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 3000),
      Math.floor(Math.random() * 3000),
      1,
    )
    this.state.bats.set(v4(), bat)
    setTimeout(() => {
      if (bat.angle == 0) {
        bat.x += Math.floor(Math.random() * 20)
        bat.y += Math.floor(Math.random() * 20)
      } else {
        bat.x -= Math.floor(Math.random() * 20)
        bat.y -= Math.floor(Math.random() * 20)
      }

      if (this.checkWalls(bat.x, bat.y, 1, false)) {
        bat.angle == 0 ? (bat.angle = 1) : (bat.angle = 0)
      }
    }, 100)
  }

  async onJoin(client: Client, options: { token: string }, _2: any) {
    for (let batCreationIndex = 0; batCreationIndex < 70; batCreationIndex++) {
      this.manageBat()
    }

    this.state.skulls.set(
      v4(),
      new Skull(Math.floor(Math.random() * 10000), 1500, 1500, 1),
    )
    this.state.skulls.set(
      v4(),
      new Skull(Math.floor(Math.random() * 10000), 0, 1500, 1),
    )

    const user = await admin.auth().verifyIdToken(options.token)
    const db = admin.firestore()
    let ballType = 'fireball'
    let dragonSkin = 'default'

    const userDoc = await db.collection(user.uid).doc('gameplay').get()
    if (userDoc.data()?.ballType) {
      ballType = userDoc.data()?.ballType
    } else {
      switch (Math.floor(Math.random() * 5)) {
        case 0:
          ballType = 'fire'
          break
        case 1:
          ballType = 'ice'
          break
        case 2:
          ballType = 'poison'
          break
        case 3:
          ballType = 'mud'
          break
        case 4:
          ballType = 'electric'
          break
      }
    }

    if (userDoc.data()?.dragonSkin) {
      dragonSkin = userDoc.data()?.dragonSkin
    } else {
      switch (Math.floor(Math.random() * 3)) {
        case 0:
          dragonSkin = 'default'
          break
        case 1:
          dragonSkin = 'light'
          break
        case 2:
          dragonSkin = 'gold'
          break
      }
    }

    var teamnum
    var xPos
    var yPos
    if (this.state.gamemode == 'CTC') {
      if (this.redTeamIds.length <= this.blueTeamIds.length) {
        teamnum = 1
        this.redTeamIds.push(client.id)
        xPos = Math.random() * 700 + 100
        yPos = Math.random() * 800 + 1100
      } else {
        teamnum = 2
        this.blueTeamIds.push(client.id)
        xPos = Math.random() * 800 + 2100
        yPos = Math.random() * 800 + 1100
      }
    } else {
      teamnum = 0
      xPos = this.state.gamewidth * Math.random()
      yPos = this.state.gameheight * Math.random()
      while (this.checkWalls(xPos, yPos, 45, false)) {
        xPos = this.state.gamewidth * Math.random()
        yPos = this.state.gameheight * Math.random()
      }
    }
    this.state.players[client.id] = new ServerPlayer(
      ballType,
      dragonSkin,
      teamnum,
      client,
    )

    this.state.players[client.id].x = xPos
    this.state.players[client.id].y = yPos

    if (user.name == null) {
      const adjectives = require('../../wordlists/adjectives.json')
      const nouns = require('../../wordlists/nouns.json')
      const adjective =
        adjectives[Math.floor(Math.random() * adjectives.length)]
      const noun = nouns[Math.floor(Math.random() * nouns.length)]
      this.state.players[client.id].onlineName =
        `${adjective}-${noun}`.toLowerCase()
    } else {
      this.state.players[client.id].onlineName = user.name
    }
    this.state.players[client.id].onlineID = user.uid
  }

  onLeave(client: Client, _consent: boolean) {}

  registerMessages() {
    this.onMessage('input', (client: Client, message: IInputs) => {
      this.state.players[client.sessionId].inputs(message)
    })
  }

  startGameLoop() {
    this.setWalls(false)
    this.setCoinJar()
    this.gameInt = setInterval(() => {
      this.clock.tick()
      this.tick()
      this.state.debugOn = !this.state.debugOn
    }, 1000 / 60)
  }

  gameOver() {
    this.clock.clear()
    this.state.gameOver = true
    this.state.players.forEach((player: Player) => {
      player.dead = true
    })
  }

  setCoinJar() {
    if (this.state.gamemode == 'CTC') {
      this.state.coinJars.set(
        v4(),
        new CoinJar(this.state.gamewidth / 4, this.state.gameheight / 2, 1),
      )
      this.state.coinJars.set(
        v4(),
        new CoinJar(this.state.gamewidth / 1.25, this.state.gameheight / 2, 2),
      )
    } else {
      this.state.coinJars.set(
        v4(),
        new CoinJar(this.state.gamewidth / 2, this.state.gameheight / 2, 0),
      )
    }
  }

  spawnCoin() {
    var num = Math.random()
    var size = 20
    var xPos
    var yPos
    if (num >= 0.75) {
      size += 5
      if (num >= 0.95) {
        size += 5
        if (num >= 0.995) {
          size = 100
        }
      }
    }
    var teamNum
    if (this.state.gamemode == 'CTC') {
      teamNum = 1
      if (this.state.coins.size % 2 == 0) {
        xPos = Math.random() * 700 + 100
        yPos = Math.random() * 800 + 1100
      } else if (this.state.coins.size % 2 == 1) {
        teamNum = 2
        xPos = Math.random() * 800 + 2100
        yPos = Math.random() * 800 + 1100
      }
    } else {
      teamNum = 0
      xPos = Math.random() * this.state.gamewidth
      yPos = Math.random() * this.state.gameheight
      while (this.checkWalls(xPos, yPos, size, false)) {
        xPos = Math.random() * this.state.gamewidth
        yPos = Math.random() * this.state.gameheight
      }
    }

    this.state.coins.set(
      v4(),
      new Coin(this.state.coins.size, xPos, yPos, size, teamNum),
    )

    //IDK what this line does. Old?
    //Math.random() < 0.01 ? this.state.coins.set(v4(), new Coin(this.state.coins.size, Math.random() * 3000 + 40, Math.random() * 3000 + 40, 100, 0)) : this.state.coins.set(v4(), new Coin(this.state.coins.size, Math.random() * 3000, Math.random() * 3000, 20, 0));
  }

  createCoin(x: number, y: number) {
    this.state.coins.set(v4(), new Coin(v4(), x, y, 20, 0))
  }
  //sets x and y of player to random numbers
  spawnPlayer(player: Player) {
    var newX = 0
    var newY = 0
    do {
      newX = Math.random() * 100
      newY = Math.random() * 100
    } while (
      this.checkWalls(newX, newY, 45, false) ||
      (newX > 500 && newY > 500 && newX < 3500 && newY < 3500)
    )
    player.x = newX
    player.y = newY
  }

  moveBot(bot: Player) {
    bot.inputs({
      up: Math.random() > 0.5 ? true : false,
      down: Math.random() > 0.5 ? true : false,
      left: Math.random() > 0.5 ? true : false,
      right: Math.random() > 0.5 ? true : false,
      shoot: false,
      autoshoot: false,
      angle: 1,
      space: false,
    })
  }

  //this is where the setup of all inner walls is
  setWalls(isCTC: boolean) {
    const gamewidth = this.state.gamewidth
    const gameheight = this.state.gameheight
    const midAreaLength = 350
    //wall length needs to be a multiple of 100
    const wallLength = 700
    const wallWidth = 50

    var walls: Wall[] = []
    if (this.state.gamemode == 'CTC') {
      //left side
      //walls.push(new Wall(0, (gameheight/3), (gamewidth/3), wallWidth, false, 10, "CTC"))
      for (let i = 0; i < 5; i++) {
        walls.push(
          new Wall(
            i * (gamewidth / 3 / 5),
            gameheight / 3,
            gamewidth / 3 / 5,
            wallWidth,
            false,
            10,
            'CTC',
          ),
        )
      }
      walls.push(
        new Wall(
          0,
          gameheight / 1.5,
          gamewidth / 3,
          wallWidth,
          false,
          10,
          'CTC',
        ),
      )
      walls.push(
        new Wall(
          gamewidth / 3,
          gameheight / 3,
          gamewidth / 3,
          wallWidth,
          true,
          10,
          'CTC',
        ),
      )
      //right side
      walls.push(
        new Wall(
          gamewidth / 1.5,
          gameheight / 3,
          gamewidth / 3,
          wallWidth,
          false,
          10,
          'CTC',
        ),
      )
      walls.push(
        new Wall(
          gamewidth / 1.5,
          gameheight / 1.5,
          gamewidth / 3,
          wallWidth,
          false,
          10,
          'CTC',
        ),
      )
      walls.push(
        new Wall(
          gamewidth / 1.5,
          gameheight / 3,
          gamewidth / 3,
          wallWidth,
          true,
          10,
          'CTC',
        ),
      )
    } else {
      //bottom right
      walls.push(
        new Wall(
          gamewidth / 2 + midAreaLength,
          gameheight / 2 + midAreaLength,
          wallLength,
          wallWidth,
          true,
          2,
          'coingrab',
        ),
      )
      walls.push(
        new Wall(
          gamewidth / 2 + midAreaLength,
          gameheight / 2 + midAreaLength,
          wallLength,
          wallWidth,
          false,
          2,
          'coingrab',
        ),
      )
      //bottom left
      walls.push(
        new Wall(
          gamewidth / 2 - midAreaLength,
          gameheight / 2 + midAreaLength,
          wallLength,
          wallWidth,
          true,
          2,
          'coingrab',
        ),
      )
      walls.push(
        new Wall(
          gamewidth / 2 - midAreaLength - wallLength,
          gameheight / 2 + midAreaLength,
          wallLength,
          wallWidth,
          false,
          2,
          'coingrab',
        ),
      )
      //top left
      walls.push(
        new Wall(
          gamewidth / 2 - midAreaLength,
          gameheight / 2 - midAreaLength - wallLength,
          wallLength,
          wallWidth,
          true,
          2,
          'coingrab',
        ),
      )
      walls.push(
        new Wall(
          gamewidth / 2 - midAreaLength - wallLength,
          gameheight / 2 - midAreaLength,
          wallLength,
          wallWidth,
          false,
          2,
          'coingrab',
        ),
      )
      //top right
      walls.push(
        new Wall(
          gamewidth / 2 + midAreaLength,
          gameheight / 2 - midAreaLength - wallLength,
          wallLength,
          wallWidth,
          true,
          2,
          'coingrab',
        ),
      )
      walls.push(
        new Wall(
          gamewidth / 2 + midAreaLength,
          gameheight / 2 - midAreaLength,
          wallLength,
          wallWidth,
          false,
          2,
          'coingrab',
        ),
      )
    }
    for (let wall of walls) {
      this.state.walls[v4()] = wall
    }
  }

  removeDeadWalls() {
    for (let id of this.state.walls.keys()) {
      if (this.state.walls[id].health <= 0) {
        this.state.walls[id].remove
      }
    }
  }

  movePlayer(player: Player, ticks: number) {
    if (player.direction.x !== 0 || player.direction.y !== 0) {
      const magnitude = Maths.normalize2D(
        player.direction.x,
        player.direction.y,
      )
      const speedX = Maths.round2Digits(
        player.direction.x *
          (((player.speed + player.coins) * (1 / player.deceleration) * ticks) /
            magnitude),
      )
      const speedY = Maths.round2Digits(
        player.direction.y *
          (((player.speed + player.coins) * (1 / player.deceleration) * ticks) /
            magnitude),
      )
      const newX = player.x + speedX
      const newY = player.y + speedY

      if (!this.checkWalls(player.x, newY, 45, false)) {
        player.y = newY
      }
      if (!this.checkWalls(newX, player.y, 45, false)) {
        player.x = newX
      }

      if (player.deceleration > 1) {
        player.deceleration *= 0.9
      }
    }
  }

  //false means no collision, true means collision
  checkWalls(
    objectX: number,
    objectY: number,
    radius: number,
    isFireball: boolean,
  ) {
    let walls = this.state.walls
    let result = false

    if (
      objectX > this.state.gamewidth - radius ||
      objectY > this.state.gameheight - radius ||
      objectX < radius ||
      objectY < radius
    ) {
      return true
    }

    for (let wallKey of this.state.walls.keys()) {
      let wall = this.state.walls[wallKey]
      let xLen = wall.xLength
      let yLen = wall.yLength
      if (wall.isRotated) {
        xLen = wall.yLength * 1
        yLen = wall.xLength
      }
      if (wall.health >= 0) {
        if (objectY + radius > wall.y && objectY - radius < wall.y + yLen) {
          if (
            (wall.isRotated &&
              objectX + radius > wall.x - xLen &&
              objectX - radius < wall.x) ||
            (!wall.isRotated &&
              objectX + radius > wall.x &&
              objectX - radius < wall.x + xLen)
          ) {
            if (isFireball && wall.gamemode == 'CTC') {
              //if(isFireball){
              wall.health -= 1
            }
            result = true
          }
        }
      }
    }

    return result
  }

  moveFireballs(player: Player, ticks: number) {
    for (let fireball of player.fireballs) {
      fireball.lifetime -= ticks

      var newX =
        fireball.x + fireball.speed * Math.cos(fireball.angle - Math.PI)
      var newY =
        fireball.y + fireball.speed * Math.sin(fireball.angle - Math.PI)
      if (!this.checkWalls(newX, fireball.y, 22.5, true)) {
        fireball.x = newX
      } else {
        fireball.lifetime -= 0.3
      }
      if (!this.checkWalls(fireball.x, newY, 22.5, true)) {
        fireball.y = newY
      } else {
        fireball.lifetime -= 0.3
      }
    }
  }

  tick() {
    if (this.state.players.size < 2) {
      for (let botIndex = 0; botIndex < 3; botIndex++) {
        let botNames = require('./botnames.json')

        let ballType = 'fire'
        switch (Math.floor(Math.random() * 5)) {
          case 0:
            ballType = 'fire'
            break
          case 1:
            ballType = 'ice'
            break
          case 2:
            ballType = 'poison'
            break
          case 3:
            ballType = 'mud'
            break
          case 4:
            ballType = 'electric'
            break
        }

        let botPlayer = new Player(ballType, 'light', 0)
        botPlayer.onlineName =
          botNames[Math.floor(Math.random() * botNames.length)]
        botPlayer.isBot = true
        setInterval(() => this.moveBot(botPlayer), botPlayer.botTimeout)
        this.botPlayers.push(botPlayer)
        this.state.players.set(v4(), botPlayer)
      }
    }

    this.counter++
    const dx = this.clock.deltaTime
    this.state.countdown.elaspseTime()
    if (this.state.countdown.done) {
      if (this.state.gameOver) {
        clearInterval(this.gameInt)
      }
      this.gameOver()
    }

    for (let i = this.state.coins.size; i < this.state.players.size * 10; i++) {
      this.spawnCoin()
    }

    for (let skull of this.state.skulls.values()) {
      skull.move()
    }

    for (let id of this.state.players.keys()) {
      //console.log(this.state.players[id].x+"   "+this.state.players[id].y)

      this.movePlayer(this.state.players[id], dx / 50)
      this.moveFireballs(this.state.players[id], dx / 50)

      this.state.players[id].tick(dx)

      for (let id2 of this.state.players.keys()) {
        for (let i = 0; i < this.state.players[id2].fireballs.length; i++) {
          if (id != id2) {
            if (
              this.state.players[id2].fireballs[i].checkHit(
                this.state.players[id].x,
                this.state.players[id].y,
                this.state.players[id].team,
              )
            ) {
              this.state.players[id2].hitsDealt++
              this.state.players[id].hitsRecived++
              this.state.players[id].health -= 0.1
              if (this.state.players[id].health < 0) {
                this.state.players[id].health = 0
                try {
                  this.state.players[id].colyseusClient.send(
                    'chatlog',
                    'You are very dead',
                  )
                  this.state.players[id].x = -40000
                  this.state.players[id].y = -40000
                  this.state.players[id].coins = 0

                  setTimeout(() => {
                    this.state.players[id].x = 200
                    this.state.players[id].y = 200
                    this.state.players[id].health = 10
                  }, 5000)
                } catch {}
              }
              var fireBall = this.state.players[id2].fireballs[i]
              const coinChance = 0.2 // the possibility of removing a coin on collision with a fireball, this is done to spread out the coins more
              const lifetimeRemove = 1 // the lifetime decreace of the fireball for every coin it removes from a dragon (as if  it is heavier)

              try {
                const oldX = this.state.players[id].x
                const oldY = this.state.players[id].y
                const newX =
                  oldX + fireBall.speed * Math.cos(fireBall.angle - Math.PI)
                const newY =
                  oldY + fireBall.speed * Math.sin(fireBall.angle - Math.PI)

                if (!this.checkWalls(oldX, newY, 45, true)) {
                  this.state.players[id].y = newY
                }
                if (!this.checkWalls(newX, oldY, 45, true)) {
                  this.state.players[id].x = newX
                }

                if (
                  this.state.players[id].coins > 0 &&
                  Math.random() < coinChance
                ) {
                  this.state.players[id].coins--
                  fireBall.lifetime -= lifetimeRemove
                  if (
                    fireBall.type == 'poison' &&
                    this.state.players[id2].coins < 10
                  ) {
                    this.state.players[id2].coins++
                    this.state.players[id2].coinsPickedUp++
                  } else {
                    this.createCoin(
                      this.state.players[id].x,
                      this.state.players[id].y,
                    )
                  }
                }
              } catch {}

              switch (fireBall.type) {
                case 'electric':
                  if (
                    this.state.players[id2].fireballs.length < 10 &&
                    Math.random() > 0.9
                  ) {
                    const angle = Math.random() * 6.28
                    const newX = this.state.players[id].x + 50 * Math.cos(angle)
                    const newY = this.state.players[id].y + 50 * Math.sin(angle)
                    // TODO: Reimplement when checkWalls is a thing... again
                    // if (!this.checkWalls(newX, newY, 22.5, true)) {
                    // 	this.state.players[id2].fireballs.push(new Fireball(newX, newY, angle + Math.PI, 7, "electric", 20, 0));

                    // }
                  }
                  break
                case 'mud':
                  fireBall.width += 1
                  fireBall.height += 1.87
                  //fireBall.speed += .05;
                  break
                case 'ice':
                  this.state.players[id].deceleration = 2
                  break
              }
            }
          }
        }
      }
      for (let coinJarId of this.state.coinJars.keys()) {
        if (
          this.state.coinJars[coinJarId].checkHit(
            this.state.players[id].x,
            this.state.players[id].y,
            this.state.players[id].team,
          )
        ) {
          // when a player has collided with the coinjar
          this.state.players[id].score += this.state.players[id].coins // add coins to players score
          if (this.state.players[id].coins > 0) {
            try {
              this.state.players[id].colyseusClient.send(
                'sfx',
                '/audio/coinjar.wav',
              )
              this.broadcast(
                'chatlog',
                `${this.state.players[id].onlineName} <img src='/img/game/coinJar.png' height='20px' height='20px' style='image-rendering:pixelated' /> ${this.state.players[id].coins}`,
              )
            } catch {}
          }
          this.state.players[id].coins = 0 // remove coins
        }
      }

      for (let cid of this.state.coins.keys()) {
        if (
          this.state.players[id].team == this.state.coins[cid].team &&
          this.state.coins[cid].checkHit(
            this.state.players[id].x,
            this.state.players[id].y,
            0,
          ) &&
          this.state.players[id].coins < 10
        ) {
          let prevCoins = this.state.players[id].coins
          var coins = this.state.players[id].coins
          try {
            this.state.players[id].colyseusClient.send('sfx', '/audio/coin.wav')
          } catch {}
          switch (this.state.coins[cid].getSize()) {
            case 20:
              coins++
              break
            case 25:
              coins += 2
              break
            case 30:
              coins += 4
              break
            case 100:
              this.state.players[id].score += 20
              this.state.players[id].coinsPickedUp += 20
              break
          }
          if (prevCoins < 10 && coins >= 10) {
            try {
              this.state.players[id].colyseusClient.send(
                'sfx',
                '/audio/error.wav',
              )
              this.state.players[id].colyseusClient.send(
                'chatlog',
                '<img src="/img/game/icon.png" width="20px" height="20px" /> out of space',
              )
            } catch {}
          }
          this.state.players[id].coinsPickedUp +=
            Math.min(coins, 10) - this.state.players[id].coins
          this.state.players[id].coins = Math.min(coins, 10)
          this.state.coins.delete(cid)
        }
      }

      for (let bat of this.state.bats.values()) {
        if (bat.checkHit(this.state.players[id].x, this.state.players[id].y)) {
          this.state.players[id].deceleration = 2
          this.state.players[id].fireballCooldown += 0.2
          break
        }
      }

      for (let skull of this.state.skulls.values()) {
        if (
          skull.checkHit(this.state.players[id].x, this.state.players[id].y)
        ) {
          if (Math.random() < 0.2 && this.state.players[id].coins > 0) {
            this.state.players[id].coins--
            if (Math.random() < 0.5 && this.state.players[id].score > 0) {
              this.state.players[id].score--
            }
          }
          break
        }
      }
    }
    this.removeDeadWalls()
  }
}
