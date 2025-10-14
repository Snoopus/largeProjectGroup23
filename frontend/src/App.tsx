import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import BleScanner from './components/BleScanner'
import BleAdvertiser from './components/BleAdvertiser'

function App() {
  const [hash, setHash] = useState<string>(typeof window !== 'undefined' ? window.location.hash : '')

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>BLE Tools</h1>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
        <a href="#scan">Scanner</a>
        <a href="#adv">Advertiser</a>
      </div>
      {hash === '#adv' ? (
        <BleAdvertiser />
      ) : (
        <BleScanner />
      )}
    </>
  )
}

export default App
