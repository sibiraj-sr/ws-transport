import {
  afterAll, beforeAll, describe, expect, it, jest,
} from '@jest/globals';
import { closeServer, runServer } from '../ws-server.js';

import Transport from './transport.js';

const PORT = 7654;

const SERVER_URL = `ws://localhost:${PORT}/ws`;

const delay = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

beforeAll(async () => {
  await runServer(PORT);
});

afterAll(async () => {
  await closeServer();
});

describe('Transport', () => {
  it('should initialize correctly', () => {
    const transport = new Transport(SERVER_URL);
    expect(transport.url).toBe(SERVER_URL);
    expect(transport.ws).toBeInstanceOf(WebSocket);
    expect(transport.on).toBeInstanceOf(Function);
    expect(transport.close).toBeInstanceOf(Function);
    expect(typeof transport.options).toBe('object');
    expect(typeof transport.url).toBe('string');
    expect(typeof transport.onLine).toBe('boolean');
    expect(typeof transport.attempts).toBe('number');

    transport.close();
  });

  it('should create and close the connection successfully', async () => {
    const transport = new Transport(SERVER_URL);

    // wait for the connection
    const mockOpenHandler = jest.fn();
    transport.ws.onopen = mockOpenHandler;
    await delay(1000);
    expect(mockOpenHandler).toHaveBeenCalled();
    expect(transport.attempts).toBe(0);

    const mockCloseHandler = jest.fn();
    transport.ws.onclose = mockCloseHandler;
    transport.close();

    await delay(1000);

    expect(mockCloseHandler).toHaveBeenCalled();
    expect(transport.ws.readyState).toBe(WebSocket.CLOSED);
  });

  it('should be able to send and recieve messages', async () => {
    const url = new URL(SERVER_URL);
    url.searchParams.set('echo', true);

    const transport = new Transport(url.href);

    // wait for the connection
    const mockOpenHandler = jest.fn();
    transport.ws.onopen = mockOpenHandler;
    await delay(1000);
    expect(mockOpenHandler).toHaveBeenCalled();

    const mockMessageHandler = jest.fn();
    transport.ws.onmessage = mockMessageHandler;

    transport.ws.send('ping');
    await delay(1000);

    expect(mockMessageHandler).toHaveBeenCalled();
    transport.close();
  });

  // it('should attempt to autoreconnect', async () => {
  //   const url = new URL('unknown', SERVER_URL)

  //   const transport = new Transport(url.href);

  //   await delay(1000);
  //   console.log(transport.attempts)
  //   expect(transport.attempts).not.toBe(0);

  //   transport.close()
  // })
});
