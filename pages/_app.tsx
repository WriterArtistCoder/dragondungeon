import Head from 'next/head'
import { useMemo, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

import '../styles/globals.css'
import { LoadingIcon } from 'components'

function DragonDungeon({ Component, pageProps }) {
  let [ gameStarted, setGameStarted ] = useState<boolean>(false)
  let [ signInNeeded, setSignInNeeded ] = useState<boolean>(false)

  useMemo(() => {
    if (typeof window !== undefined) {
      initializeApp({
        apiKey: 'AIzaSyCRClPzTZnRSg_fAap6ENnAkxUBQKJGk5w',
        authDomain: 'leaguedragoncoin.firebaseapp.com',
        projectId: 'leaguedragoncoin',
        storageBucket: 'leaguedragoncoin.appspot.com',
        messagingSenderId: '320692217416',
        appId: '1:320692217416:web:f9cd0efdc04445865e9a7d',
      })
    
      let auth = getAuth()    
      let unsubAuthState = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setGameStarted(true)
        } else {
          setSignInNeeded(true)
        }
      })
    
      unsubAuthState()
    }
  }, [])

  return <>
    <Head>
      <title>Dragon Dungeon</title>
      <link rel="icon" href="/img/game/coinJar.png" />
    </Head>
    <div id='league' style={{ display: 'none', position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', background: 'black', textAlign: 'center' }}>
      <img src="/img/ui/jtl.png" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%); }}' }} />
    </div>
    <p style={{ color: '#f9e300', fontFamily: 'Cinzel', position: 'fixed', top: '0', right: '0', fontSize: '13pt', padding: '10px', margin: '10px', border: '5px solid #f9e300', background: 'rgba(0, 0, 0, 0.8)' }}>Beta Build {require('package.json').version}</p>
    {!gameStarted && <div style={{ textAlign: 'center' }}>
        <br /><br /><br />
        <img style={{ textAlign: 'center', height: '150px', imageRendering: 'pixelated' }} src="/img/dragons/basicDragon.png" />
        <br /><br /><br />
        <h1>DRAGON DUNGEON</h1>
        {!signInNeeded && <h2>Loading...</h2>}
        {signInNeeded && <>
          <h2 onClick={async () => {
            let auth = getAuth()
            let info = await signInWithPopup(auth, new GoogleAuthProvider())
            if (info.user) {
              setSignInNeeded(false)
              setGameStarted(true)
            }
          }}>Sign In</h2>
        </>}
      </div>}
    {gameStarted && <Component {...pageProps} />}
  </>
}

export default DragonDungeon
