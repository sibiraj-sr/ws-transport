import { createServer } from 'node:http';
import { URLSearchParams } from 'node:url';
import { WebSocketServer } from 'ws';
import express from 'express';

const PORT = 7654;

const app = express();
const server = createServer(app);

class URLParams extends URLSearchParams {
  get(name, type) {
    const value = super.get(name);

    if (!value) {
      return value;
    }

    switch (type) {
      case 'num':
        return Number(value);

      case 'bool':
        return Boolean(value);

      default:
        return value;
    }
  }
}

app.use('/', (_req, res) => {
  res.send('Hey there!').end();
});

const wss = new WebSocketServer({
  server,
  path: '/ws',
});

wss.on('connection', (conn, req) => {
  console.log('Connection created');

  const query = req.url.substring(req.url.indexOf('?'));
  const params = new URLParams(query);

  const exitCode = params.get('exitCode', 'num');

  if (exitCode) {
    const delay = params.get('delay', 'num');
    const exitMessage = params.get('exitMessage') || undefined;

    setTimeout(() => {
      conn.close(exitCode, exitMessage);
    }, delay || 500);

    return;
  }

  const echo = params.get('echo', 'bool');

  conn.on('message', (data) => {
    console.log('Received: %s', data);

    if (echo) {
      console.log('Echo: %s', data);
      conn.send(data.toString());
    }
  });

  const ping = () => {
    conn.send('ping');
    setTimeout(ping, 5000);
  };

  ping();
});

server.listen(PORT, () => {
  console.info(`Server listening at http://localhost:${PORT}`);
});
