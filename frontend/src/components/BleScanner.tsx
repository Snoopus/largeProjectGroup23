import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type AdvertRow = {
  id: string
  name: string
  rssi: number | null
  txPower: number | null
  lastSeen: number
  uuids: string[]
  manufacturerDataHex: string[]
}

function dataViewToHex(view: DataView): string {
  const bytes: string[] = []
  for (let i = 0; i < view.byteLength; i++) {
    const b = view.getUint8(i)
    bytes.push(b.toString(16).padStart(2, '0'))
  }
  return bytes.join('')
}

function formatManufacturerData(map: Map<number, DataView>): string[] {
  const parts: string[] = []
  map.forEach((dv, key) => {
    parts.push(`${key}:0x${dataViewToHex(dv)}`)
  })
  return parts
}

export default function BleScanner() {
  const [supported, setSupported] = useState<boolean>(false)
  const [scanning, setScanning] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [adverts, setAdverts] = useState<Record<string, AdvertRow>>({})
  const [eventCount, setEventCount] = useState<number>(0)
  const scanRef = useRef<BluetoothLEScan | null>(null)
  const handlerRef = useRef<((ev: BluetoothAdvertisingEvent) => void) | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fallbackTimerRef = useRef<number | null>(null)
  const eventCountRef = useRef<number>(0)
  useEffect(() => { eventCountRef.current = eventCount }, [eventCount])

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && !!navigator.bluetooth && 'requestLEScan' in navigator.bluetooth)
  }, [])

  const onAdvertisement = useCallback((ev: BluetoothAdvertisingEvent) => {
    // Helpful debug log to verify events arrive
    // eslint-disable-next-line no-console
    console.log('advertisement', ev.device?.name, ev.rssi, ev)
    setEventCount(c => c + 1)
    const id = ev.device.id || ev.device?.name || 'unknown'
    setAdverts(prev => {
      const next: Record<string, AdvertRow> = { ...prev }
      next[id] = {
        id,
        name: ev.name ?? ev.device.name ?? 'Unknown',
        rssi: ev.rssi ?? null,
        txPower: ev.txPower ?? null,
        lastSeen: Date.now(),
        uuids: ev.uuids ?? [],
        manufacturerDataHex: formatManufacturerData(ev.manufacturerData),
      }
      return next
    })
  }, [])

  const startBridge = useCallback(() => {
    setError(null)
    // Always target the user's local machine for the bridge
    // Note: From an HTTPS site, ws://localhost may be blocked as mixed content.
    // In that case, run the site locally or proxy the bridge securely.
    const wsUrl = (location.protocol === 'https:' ? 'ws://' : 'ws://') + 'localhost:8765'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onopen = () => {
      setScanning(true)
    }
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(String(msg.data))
        if (data && data.type === 'adv') {
          setEventCount(c => c + 1)
          const id = data.id || data.name || 'unknown'
          setAdverts(prev => ({
            ...prev,
            [id]: {
              id,
              name: data.name || 'Unknown',
              rssi: typeof data.rssi === 'number' ? data.rssi : null,
              txPower: typeof data.txPower === 'number' ? data.txPower : null,
              lastSeen: data.seenAt || Date.now(),
              uuids: Array.isArray(data.uuids) ? data.uuids : [],
              manufacturerDataHex: data.manufacturer ? [data.manufacturer] : [],
            }
          }))
        }
      } catch {}
    }
    ws.onerror = () => setError('Bridge connection failed. Is the BLE bridge running?')
    ws.onclose = () => setScanning(false)
  }, [])

  const startScan = useCallback(async () => {
    setError(null)
    try {
      if (!navigator.bluetooth || !('requestLEScan' in navigator.bluetooth)) {
        // Fallback: connect to local bridge
        startBridge()
        return
      }
      // Attach listener BEFORE starting the scan to avoid missing early events
      handlerRef.current = onAdvertisement as any
      navigator.bluetooth.addEventListener('advertisementreceived', handlerRef.current as any)
      // Also set the property handler as a fallback on certain Chrome versions
      // @ts-ignore
      navigator.bluetooth.onadvertisementreceived = handlerRef.current

      const leScan = await navigator.bluetooth.requestLEScan({
        acceptAllAdvertisements: true,
        keepRepeatedDevices: true,
      } as any)
      scanRef.current = leScan
      setScanning(true)

      // Auto-fallback: if no events within 5s, switch to bridge
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current)
      const before = eventCountRef.current
      fallbackTimerRef.current = window.setTimeout(() => {
        if (eventCountRef.current === before) {
          // No events arrived; fallback
          try { scanRef.current?.stop() } catch {}
          try {
            if (handlerRef.current) {
              navigator.bluetooth.removeEventListener('advertisementreceived', handlerRef.current as any)
              // @ts-ignore
              if (navigator.bluetooth.onadvertisementreceived === handlerRef.current) {
                // @ts-ignore
                navigator.bluetooth.onadvertisementreceived = null
              }
            }
          } catch {}
          startBridge()
        }
      }, 5000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setScanning(false)
      try {
        // Cleanup listener if starting scan failed
        if (handlerRef.current) {
          navigator.bluetooth.removeEventListener('advertisementreceived', handlerRef.current as any)
          // @ts-ignore
          if (navigator.bluetooth.onadvertisementreceived === handlerRef.current) {
            // @ts-ignore
            navigator.bluetooth.onadvertisementreceived = null
          }
        }
      } catch {}
    }
  }, [onAdvertisement, startBridge])

  const stopScan = useCallback(() => {
    try {
      if (handlerRef.current) {
        navigator.bluetooth.removeEventListener('advertisementreceived', handlerRef.current as any)
        // @ts-ignore
        if (navigator.bluetooth.onadvertisementreceived === handlerRef.current) {
          // @ts-ignore
          navigator.bluetooth.onadvertisementreceived = null
        }
      }
    } catch {}
    try {
      scanRef.current?.stop()
    } catch {}
    scanRef.current = null
    try {
      wsRef.current?.close()
    } catch {}
    wsRef.current = null
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    setScanning(false)
  }, [onAdvertisement])

  useEffect(() => {
    return () => {
      try {
        if (handlerRef.current) {
          navigator.bluetooth.removeEventListener('advertisementreceived', handlerRef.current as any)
          // @ts-ignore
          if (navigator.bluetooth.onadvertisementreceived === handlerRef.current) {
            // @ts-ignore
            navigator.bluetooth.onadvertisementreceived = null
          }
        }
      } catch {}
      try {
        scanRef.current?.stop()
      } catch {}
      try {
        wsRef.current?.close()
      } catch {}
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
  }, [onAdvertisement])

  const rows = useMemo(() => Object.values(adverts).sort((a, b) => (b.lastSeen - a.lastSeen)), [adverts])

  if (!supported) {
    return (
      <div className="ble">
        <p>Web Bluetooth scanning not supported in this browser.</p>
        <p>Use Chrome on desktop with the experimental flag enabled.</p>
      </div>
    )
  }

  return (
    <div className="ble">
      <div className="ble-controls">
        <button onClick={scanning ? stopScan : startScan}>
          {scanning ? 'Stop scanning' : 'Start scanning'}
        </button>
        {error && <span className="ble-error">{error}</span>}
        <span className="ble-meta">Devices: {rows.length}</span>
        <span className="ble-meta">Events: {eventCount}</span>
        {!scanning && (
          <button onClick={() => { stopScan(); startBridge() }}>Use bridge</button>
        )}
      </div>
      <div className="ble-list">
        {rows.length === 0 && <p>No advertisements yet.</p>}
        {rows.map(row => (
          <div key={row.id} className="ble-item">
            <div className="ble-item-head">
              <strong>{row.name}</strong>
              <span className="ble-meta">RSSI: {row.rssi ?? 'n/a'} dBm</span>
            </div>
            <div className="ble-item-body">
              <div className="ble-meta">Tx: {row.txPower ?? 'n/a'} dBm</div>
              <div className="ble-meta">UUIDs: {row.uuids.length ? row.uuids.join(', ') : '—'}</div>
              <div className="ble-meta">Mfr: {row.manufacturerDataHex.length ? row.manufacturerDataHex.join(' | ') : '—'}</div>
              <div className="ble-meta">Last seen: {new Date(row.lastSeen).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


