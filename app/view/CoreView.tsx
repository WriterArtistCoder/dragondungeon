import { Room } from 'colyseus.js'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'
import { GameState } from '../../common'
import { ColyseusService } from '../../lib/colyseus'
import { StateManager } from '../state/StateManager'
import { GameView } from './GameView'
import { MapSchema } from '@colyseus/schema'
import { Player } from 'common'

import styles from '../../styles/menu.module.css'

function MenuOption(props) {
  let router = useRouter()
  return (
    <div
      className={styles.link}
      onClick={() => {
        router.push(props.href)
      }}
    >
      {props.name}
    </div>
  )
}

function renderTableData(players: MapSchema<Player>) {
  let leaderboardData = []
  players.forEach((player: Player, key: any) => {
    const score = player.score
    let name = player.onlineName
    const ballType = player.ballType
    leaderboardData.push(
      <span style={{ justifyContent: 'start' }}>
        <img
          src={`/assets/img/abilities/${ballType}ball.png`}
          style={{ height: '30px', padding: '10px', verticalAlign: 'sub' }}
        />{' '}
        {name}
        <b>
          &nbsp;&nbsp;<big>{score}</big>
        </b>
        <br />
      </span>,
    )
  })
  return leaderboardData
}

function CTCWinner(players: MapSchema<Player>) {
  let result = []
  let redScore = 0
  let blueScore = 0
  let winner: string
  players.forEach((player: Player, key: any) => {
    if (player.team == 1) {
      redScore += player.score
    } else if (player.team == 2) {
      blueScore += player.score
    }
  })
  if (redScore > blueScore) {
    winner = 'Red'
  } else if (blueScore > redScore) {
    winner = 'Blue'
  } else {
    ; ('Tie!')
  }
  result.push(
    <span>
      {winner} wins with score of: {redScore} for red and {blueScore} for blue!
    </span>,
  )
  return result
}

export default function CoreView({
  controls,
  token,
  mode,
}: {
  controls: number
  token: string
  mode: string
}) {
  const [room, setRoom] = useState<Room<GameState> | null>(null)
  const [state, setState] = useState<GameState | null>(null)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [stateManager, setStateManager] = useState<StateManager>(
    new StateManager(
      new ColyseusService(
        window.location.protocol == 'http:' ? 'ws' : 'wss',
        window.location.hostname + ':1337',
      ),
      'arena',
      token,
    ),
  )

  useMemo(() => {
    console.log('cv use memo')
    stateManager.joinRoom(mode).then(() => {
      stateManager.room.onStateChange((newState) => {
        setGameOver(newState.gameOver)
        setState(newState)
      })
    })
  }, [])

  if (state == null) {
    return (
      <div
        style={{
          color: '#f9e300',
          fontSize: '30pt',
          padding: '20px',
          position: 'fixed',
          bottom: 0,
          left: 0,
        }}
      >
        Contacting DragonDungeon Servers...
      </div>
    )
  }

  if (gameOver) {
    return (
      <div style={{ padding: '30px' }} className={styles.pageContent}>
        <h1>Game Over</h1>
        <p style={{ color: '#f9e300', fontSize: '25pt' }}>
          {state.gamemode == 'CTC' || state.gamemode == 'Zones'
            ? CTCWinner(state.players)
            : state.gameOverMessage}
        </p>

        {renderTableData(state.players)}
        <br />
        <br />
        <MenuOption name="New Game" href="/" />
      </div>
    )
  }

  return (
    <GameView stateManager={stateManager} state={state} controls={controls} />
  )
}
