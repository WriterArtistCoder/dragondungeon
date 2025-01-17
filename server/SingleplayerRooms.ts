import { Client } from 'colyseus'
import { CoinJar, GameState, IInputs, Player } from '../common'
import CoreRoom from './CoreRoom'
import { v4 } from 'uuid'

export class CampaignBetaRoom extends CoreRoom {
    constructor() {
        let state = new GameState()
        for (let i = 0; i < 100; i++) {
            let genNPC = new Player("fire", Math.floor(Math.random() * 2000), Math.floor(Math.random() * 2000))
            genNPC.isNPC = true;
            state.players.set(v4(), genNPC)
        }
        super(state)
    }

    async onJoin(client: Client, options: { token: string }, _2: any): Promise<void> {
        super.onJoin(client, options, _2)
        
    }
}

export class TutorialRoom extends CoreRoom {

    hasCollectedCoins: boolean = false
    maxClients: number = 1

    constructor() {
        super(new GameState())
    }

    async onJoin(client: Client, options: { token: string }, _2: any): Promise<void> {
        super.onJoin(client, options, _2)
        setTimeout(() => {
            client.send('chatlog', 'Welcome to DragonDungeon!')
            setTimeout(() => {
                client.send('chatlog', 'Use the mouse to move and <img src="/assets/img/prompts/mnk/Space_Key_Dark.png" height="50px" width="50px" style="vertical-align:middle" /> to shoot')
                super.onMessage('input', (clientm: Client, message: IInputs) => {
                    if (clientm == client && message.space == true && this.hasCollectedCoins == false) {
                        this.hasCollectedCoins = true
                        client.send('chatlog', 'Great job!')
                        setTimeout(() => {
                            client.send('chatlog', 'DragonDungeon is all about collecting coins!')
                            setTimeout(() => {
                                client.send('chatlog', 'Just hover over a coin to collect it.')
                                for (let i = 0; i < 30; i++) {
                                    super.spawnCoin()
                                    let ccint = setInterval(() => {
                                        if (super.getState().players[client.id].coins > 0) {
                                            client.send('chatlog', 'Keep going until your backpack is full of coins! You can use the <img src="/assets/img/prompts/mnk/V_Key_Dark.png" height="50px" width="50px" style="vertical-align:middle" /> key to dodge around if you want.')
                                            clearInterval(ccint)
                                            let cfint = setInterval(() => {
                                                if (super.getState().players[client.id].coins >= 10) {
                                                    client.send('chatlog', 'Great job! Now, bank your coins in the middle of the map, in the coin jar.')
                                                    this.state.coins.clear()
                                                    this.state.coinJars.set(v4(), new CoinJar(1500, 1500, 0))
                                                    clearInterval(cfint)
                                                    let csint = setInterval(() => {
                                                        if (super.getState().players[client.id].score > 0) {
                                                            client.send('chatlog', 'Congrats! You\'ve mastered the basics!')
                                                            this.state.coinJars.clear()
                                                            clearInterval(csint)
                                                            setTimeout(() => {
                                                                client.send('chatlog', 'Just one more thing...')
                                                                setTimeout(() => {
                                                                    client.send('chatlog', 'You can attack dragons using your fireballs! (remember those?)')
                                                                    setTimeout(() => {
                                                                        client.send('chatlog', 'Give it a try on this bot!')
                                                                        this.state.players[client.id].x = 1300
                                                                        this.state.players[client.id].y = 1500
                                                                        let bot = new Player('fire', 0, 0)
                                                                        bot.isBot = true
                                                                        bot.onlineName = 'Botty McBotFace'
                                                                        bot.x = 1500
                                                                        bot.y = 1500
                                                                        this.state.players.set('botty', bot)
                                                                        this.state.players['botty'].health = 9
                                                                        let bint = setInterval(() => {
                                                                            console.log(this.state.players['botty'].health)
                                                                            if(this.state.players['botty'].health == 10) {
                                                                                clearInterval(bint)
                                                                                this.state.gameOver = true
                                                                                super.gameOver('Congrats! You\'re ready to play.')
                                                                            }
                                                                        }, 30)
                                                                    }, 2000)
                                                                }, 1000)
                                                            }, 1000)
                                                        }
                                                    }, 30)
                                                }
                                            }, 30)
                                        }
                                    }, 30)
                                }
                            }, 3000)
                        }, 2000)
                    }
                    try {
                        this.state.players[client.sessionId].inputs(message)
                    } catch { }
                })
            }, 3000)
        }, 2000)
    }
}
