import { Player } from 'common'
import { MapSchema } from '@colyseus/schema'
import { Box } from 'components'

import styles from 'styles/leaderboard.module.css'
import { useEffect, useState } from 'react'
import { v4 } from 'uuid'
function renderTableData(players: MapSchema<Player>) {

 // let leaderboardData = []
  let redScore = 0
  let blueScore = 0
  players.forEach((player: Player, key: any) => {
    const score = player.score
    if (player.team == 1){
        redScore += score
    }
    else if(player.team == 2){
        blueScore += score
    }
  })
 
    console.log("leaderboard", "redScore: "+redScore+"  blueScore: "+blueScore)
  return <span key = {v4()}> {redScore} | {blueScore} </span>
}

export function CTCLeaderboard(props: {
  players: MapSchema<Player>
}) {
  const [players, setPlayerState] = useState<MapSchema<Player>>(props.players)

  return (
    <>
      <p className={styles.mobileCountdown}></p>
      <div id="captions" style={{ position: 'fixed', color: '#f9e300' }}></div>
      <div id="chatlog" className={styles.CTCboard}></div>
      <div className={styles.CTCboard}>
        {renderTableData(props.players)}
      </div>
    </>
  )
}
