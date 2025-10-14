import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type AdvConfig = {
  name: string
  manufacturerId?: number
  manufacturerDataHex?: string
  serviceUuids?: string[]
}

export default function BleAdvertiser() {
  const [connected, setConnected] = useState<boolean>(false)
  const [status, setStatus] = useState<string>('idle')
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState<string>('Cards Demo')
  const [mfrId, setMfrId] = useState<string>('0x004C')
  const [mfrHex, setMfrHex] = useState<string>('')
  const [uuids, setUuids] = useState<string>('')
  const wsRef = useRef<WebSocket | null>(null)

  const wsUrl = useMemo(() => {
    return (location.protocol === 'https:' ? 'ws://' : 'ws://') + 'localhost:8765'
  }, [])

  const ensureWs = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return wsRef.current
    }
    setError(null)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setError('Bridge connection error')
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(String(msg.data))
        if (data?.type === 'adv.status') {
          setStatus(data.status || 'unknown')
          if (data.error) setError(String(data.error))
        }
      } catch {}
    }
    return ws
  }, [wsUrl])

  const sendWs = useCallback((obj: unknown) => {
    const ws = ensureWs()
    const data = JSON.stringify(obj)
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data)
    } else if (ws.readyState === WebSocket.CONNECTING) {
      const onOpen = () => {
        try { ws.send(data) } finally { ws.removeEventListener('open', onOpen) }
      }
      ws.addEventListener('open', onOpen)
    } else {
      setError('Bridge not connected')
    }
  }, [ensureWs])

  const startAdvertising = useCallback(() => {
    try {
      const cfg: AdvConfig = {
        name: name.trim() || 'Advertiser',
        manufacturerId: (() => {
          const v = mfrId.trim()
          if (!v) return undefined
          const parsed = v.startsWith('0x') || v.startsWith('0X') ? parseInt(v, 16) : parseInt(v, 10)
          return Number.isFinite(parsed) ? parsed : undefined
        })(),
        manufacturerDataHex: mfrHex.trim() || undefined,
        serviceUuids: uuids.split(',').map(s => s.trim()).filter(Boolean),
      }
      sendWs({ type: 'adv.start', config: cfg })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [sendWs, name, mfrId, mfrHex, uuids])

  const stopAdvertising = useCallback(() => {
    try {
      sendWs({ type: 'adv.stop' })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [sendWs])

  useEffect(() => {
    return () => {
      try { wsRef.current?.close() } catch {}
      wsRef.current = null
    }
  }, [])

  return (
    <div className="ble">
      <div className="ble-controls">
        <button onClick={startAdvertising}>Start advertising</button>
        <button onClick={stopAdvertising}>Stop advertising</button>
        <span className="ble-meta">Bridge: {connected ? 'connected' : 'disconnected'}</span>
        <span className="ble-meta">Status: {status}</span>
        {error && <span className="ble-error">{error}</span>}
      </div>

      <div className="ble-list">
        <label>
          <div className="ble-meta">Local name</div>
          <input value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label>
          <div className="ble-meta">Manufacturer ID (e.g., 0x004C)</div>
          <input value={mfrId} onChange={e => setMfrId(e.target.value)} />
        </label>
        <label>
          <div className="ble-meta">Manufacturer data (hex, no spaces)</div>
          <input value={mfrHex} onChange={e => setMfrHex(e.target.value)} />
        </label>
        <label>
          <div className="ble-meta">Service UUIDs (comma-separated)</div>
          <input value={uuids} onChange={e => setUuids(e.target.value)} />
        </label>
      </div>
    </div>
  )
}


