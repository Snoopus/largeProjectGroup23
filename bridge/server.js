'use strict'

// Simple BLE advertisement bridge for Linux/macOS using @abandonware/noble
// and Windows using noble-winrt fallback. Broadcasts adverts over WebSocket.

const { WebSocketServer } = require('ws')
let noble
try {
  noble = require('@abandonware/noble')
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Failed to load BLE library:', e)
  process.exit(1)
}

const PORT = process.env.BLE_BRIDGE_PORT ? Number(process.env.BLE_BRIDGE_PORT) : 8765
const wss = new WebSocketServer({ port: PORT })

const clients = new Set()
wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
  ws.on('message', async (raw) => {
    let msg
    try { msg = JSON.parse(String(raw)) } catch { return }
    if (!msg || typeof msg !== 'object') return
    if (msg.type === 'adv.start') {
      const cfg = msg.config || {}
      startAdvertising(cfg)
        .then(() => ws.send(JSON.stringify({ type: 'adv.status', status: 'advertising' })))
        .catch((e) => ws.send(JSON.stringify({ type: 'adv.status', status: 'error', error: String(e?.message || e) })))
      return
    }
    if (msg.type === 'adv.stop') {
      stopAdvertising()
      ws.send(JSON.stringify({ type: 'adv.status', status: 'stopped' }))
      return
    }
  })
})

function broadcast(obj) {
  const data = JSON.stringify(obj)
  for (const ws of clients) {
    if (ws.readyState === 1) {
      ws.send(data)
    }
  }
}

function toHex(buf) {
  return Array.from(buf || []).map(b => b.toString(16).padStart(2, '0')).join('')
}

function startScanning() {
  noble.on('stateChange', async (state) => {
    // eslint-disable-next-line no-console
    console.log('BLE state:', state)
    if (state === 'poweredOn') {
      try {
        await noble.startScanningAsync([], true) // duplicates
        // eslint-disable-next-line no-console
        console.log('Scanning started')
      } catch (e) {
        console.error('startScanning error', e)
      }
    } else {
      try {
        await noble.stopScanningAsync()
      } catch {}
    }
  })

  noble.on('discover', (peripheral) => {
    const { id, address, advertisement, rssi } = peripheral
    const name = advertisement?.localName || peripheral?.name || 'Unknown'
    const uuids = advertisement?.serviceUuids || []
    const mfr = (advertisement?.manufacturerData && advertisement.manufacturerData.length)
      ? `0x${toHex(advertisement.manufacturerData)}`
      : null
    const tx = typeof advertisement?.txPowerLevel === 'number' ? advertisement.txPowerLevel : null

    broadcast({
      type: 'adv',
      id: id || address || name,
      name,
      rssi,
      txPower: tx,
      uuids,
      manufacturer: mfr,
      seenAt: Date.now(),
    })
  })
}

wss.on('listening', () => {
  // eslint-disable-next-line no-console
  console.log(`BLE bridge WebSocket listening on ws://localhost:${PORT}`)
})

startScanning()

// --- Advertising support ---
let bleno
let isAdvertising = false
let blenoLoaded = false
async function ensureBleno() {
  if (blenoLoaded) return bleno
  try {
    bleno = require('@abandonware/bleno')
    blenoLoaded = true
    return bleno
  } catch (e) {
    throw new Error('Advertising not available: @abandonware/bleno not installed')
  }
}

function hexToBuffer(hex) {
  const clean = (hex || '').replace(/\s+/g, '')
  if (clean.length % 2 !== 0) return Buffer.alloc(0)
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return Buffer.from(bytes)
}

function buildAdvData(localName, mfrId, mfrData) {
  // AD Flags: LE General Discoverable Mode + BR/EDR Not Supported
  const flags = Buffer.from([0x02, 0x01, 0x06])
  const nameBuf = Buffer.from(localName, 'utf8')
  const nameField = Buffer.concat([Buffer.from([nameBuf.length + 1, 0x09]), nameBuf])
  let mfrField = Buffer.alloc(0)
  if (typeof mfrId === 'number' && mfrData && mfrData.length > 0) {
    const idLE = Buffer.from([mfrId & 0xff, (mfrId >> 8) & 0xff])
    const payload = Buffer.concat([idLE, mfrData])
    mfrField = Buffer.concat([Buffer.from([payload.length + 1, 0xFF]), payload])
  }
  return Buffer.concat([flags, nameField, mfrField])
}

async function startAdvertising(cfg) {
  const B = await ensureBleno()
  const localName = (cfg?.name || 'Advertiser').toString().slice(0, 26)
  const serviceUuids = Array.isArray(cfg?.serviceUuids) ? cfg.serviceUuids : []
  const mfrId = Number.isFinite(cfg?.manufacturerId) ? cfg.manufacturerId : undefined
  const mfrData = cfg?.manufacturerDataHex ? hexToBuffer(cfg.manufacturerDataHex) : undefined

  function startNow(resolve, reject) {
    try {
      if (mfrId !== undefined && mfrData) {
        const adv = buildAdvData(localName, mfrId, mfrData)
        // Start with raw EIR data (no scan response)
        B.startAdvertisingWithEIRData(adv, undefined, (err) => {
          if (err) return reject(err)
          isAdvertising = true
          resolve()
        })
      } else {
        B.startAdvertising(localName, serviceUuids, (err) => {
          if (err) return reject(err)
          isAdvertising = true
          resolve()
        })
      }
    } catch (e) {
      reject(e)
    }
  }

  return new Promise((resolve, reject) => {
    if (B.state === 'poweredOn') {
      return startNow(resolve, reject)
    }
    const onChange = (state) => {
      if (state === 'poweredOn') {
        B.removeListener('stateChange', onChange)
        startNow(resolve, reject)
      }
    }
    B.on('stateChange', onChange)
  })
}

function stopAdvertising() {
  if (!blenoLoaded || !bleno) return
  try { bleno.stopAdvertising() } catch {}
  isAdvertising = false
}


