import { useState } from 'react'
import Transport from '../index.js'

const App = () => {
  const [socket, setSocket] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)

  const handleConnect = () => {
    console.log('Connecting to websocket server...')

    // const transport = new Transport('ws://localhost:7654/ws')
    const transport = new Transport('ws://localhost:7654/ws', null, {
      autoReconnect: true,
      retryInterval: (_event, transport) => {
        return Math.pow(1.5, transport.attempts) * 500
      }
    })

    transport.on('*', console.warn)

    setSocket(transport)
    const ws = transport.ws

    ws.onopen = () => {
      console.log('Connected to socket server')
      setSocketConnected(true)
    }

    ws.onerror = () => {
      setSocketConnected(false)
    }

    ws.onmessage = (event) => {
      console.log(event)
      if (event.data === 'ping') {
        ws.send('pong')
      }
    }

    ws.onclose = (event) => {
      console.log(event)
      setSocketConnected(false)
    }
  }

  return (
    <div className='container mx-auto py-4'>
      <button onClick={handleConnect} disabled={socketConnected} className='underline'>
        {socketConnected ? 'Connected' : 'Connect'}
      </button>
      <button onClick={() => socket.close()} className='ml-2 underline'>Close</button>
    </div>
  )
}

export default App
