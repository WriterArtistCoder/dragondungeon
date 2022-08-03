import { PageLayout } from 'components'
import { useRouter } from 'next/router'
import styles from 'styles/menu.module.css'

function ModeItem(props) {
  return (
    <span
      style={{
        cursor: 'pointer',
        padding: '10px',
        margin: '10px',
        border: window.innerWidth > 1000 ? '2px solid red' : 'none',
        borderRadius: '5px'
      }}
      onClick={() => {
        if (props.href) {
          props.router.push(props.href)
        }
      }}
    >
      {props.img && (
        <img
          src={props.img}
          alt={props.name}
          style={{ imageRendering: 'pixelated', height: '70px', verticalAlign: 'middle', paddingRight: '10px' }}
        />
      )}
      <span style={{ verticalAlign: 'middle', fontSize: '20pt' }}>{props.name}</span>
      {typeof window !== 'undefined' && <>
        { window.innerWidth < 1000 && <><br /><br /><br /></> }
      </>}
    </span>
  )
}

export default function Home() {
  let router = useRouter()

  return (
    <PageLayout style={{
      textAlign: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: window.innerWidth < 1000 ? '7vw' : '3vw' }}>
        DragonDungeon
        <br />
        <br />
        <span
          style={{
            color: '#f9e300',
            fontFamily: 'Varela Round',
            fontSize: window.innerWidth < 1000 ? '5vw' : '2vw'
          }}
        >
          Public Beta
        </span>
      </h1>
      {typeof window !== 'undefined' && (
        <>
          <ModeItem
            description="Capture coins. Defend your zones."
            name="Zones"
            img="/assets/img/game/coinJar.png"
            href="/play/zones"
            router={router}
          />
          <ModeItem
            description="A classic free-for-all arena."
            name="Arena"
            img="/assets/img/game/bat.png"
            href="/play/arena"
            router={router}
          />
          <ModeItem
            description="Defend your base. Take back your coins."
            name="Capture"
            img="/assets/img/game/skull.png"
            href="/play/ctc"
            router={router}
          />
          <ModeItem
            description="Become the Last Dragon Standing."
            name="Survival"
            img="/assets/img/skins/basic.png"
            href="/play/lds"
            router={router}
          />
          <br /><br />
          <ModeItem
            description="Play with your friends across all modes."
            name="Join By ID"
            href="/join"
            router={router}
          />
          <ModeItem
            description="Learn the ropes."
            name="Tutorial"
            href="/play/tutorial"
            router={router}
          />
          <ModeItem
            description="Customize your Dragon with new skins and fireballs."
            name="Dragon"
            href="/profile"
            router={router}
          />
          <ModeItem
            description="Information, settings, and game credits."
            name="About"
            href="/about"
            router={router}
          />
        </>
      )}
    </PageLayout>
  )
}
