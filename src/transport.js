import Events from 'capillaries';

const SOCKET_ERRORS_CODES = {
  NORMAL: 1000,
};

export const TRANSPORT_EVENTS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  CONNECT_ERROR: 'connect-error',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
  MAX_RETRIES_MADE: 'max-retries-made',
};

const shouldReconnect = (event) => {
  switch (event.code) {
    case 1008:
    case 1011:
    case 1015:
      return false;

    default:
      return true;
  }
};

const defaultOptions = {
  // // called in a regular interval, useful for sending messages like ping/pong
  // // to keep the socket alive
  // heartBeat: false,

  // // a function to check if connection should be re-established when closed or errored.
  shouldReconnect,

  // // when set to true, automatic attempts to reconnect to server will be made
  autoReconnect: true,

  // // no of times to retry before
  maxRetries: Infinity,

  // // time to wait before
  retryInterval: 5 * 1000,
};

class Transport {
  // the connection URL
  #url = '';

  // Websocket protocols
  #protocols;

  // websocket instance
  #ws = null;

  // transport options
  #options = defaultOptions;

  // indicates whether the network online/offline listeners are attached already
  // so we can avoid adding multiple listeners during reconnect/reattempts
  #attachedNetworkListeners = false;

  // no. of connection attempts made
  attempts = 0;

  // timeout index for reconnect attempt
  #reconnectTimeoutIndex = null;

  // event emitter
  #events = new Events();

  // indicates whether connection should be established when online
  #reconnectWhenOnline = false;

  #forceClose = false;

  constructor(url, protocols, opts = defaultOptions) {
    this.#url = url;
    this.#protocols = protocols;
    this.#options = { ...defaultOptions, ...opts };
    this.#connect();
  }

  get url() {
    return this.#url;
  }

  get ws() {
    return this.#ws;
  }

  get options() {
    return this.#options;
  }

  get on() {
    return this.#events.on;
  }

  get onLine() {
    return globalThis.navigator.onLine;
  }

  close(code, reason) {
    this.#forceClose = true;
    this.#reset();
    return this.ws.close(code ?? SOCKET_ERRORS_CODES.NORMAL, reason);
  }

  #connect() {
    this.#events.emit(TRANSPORT_EVENTS.CONNECTING);

    const socket = new WebSocket(this.url, this.#protocols);
    this.#ws = socket;

    this.attempts += 1;
    this.#forceClose = false;

    socket.addEventListener('open', () => {
      this.#events.emit(TRANSPORT_EVENTS.CONNECTED);
      this.attempts = 0;
    });

    socket.addEventListener('error', () => {
      this.#events.emit(TRANSPORT_EVENTS.CONNECT_ERROR);
    });

    socket.addEventListener('close', (event) => {
      this.#events.emit(TRANSPORT_EVENTS.DISCONNECTED);

      if (this.options.autoReconnect) {
        this.#reconnect(event);
      }
    });

    this.#attachNetworkStatusListeners();
  }

  #reconnect(event) {
    if (this.#forceClose) {
      return;
    }

    if (this.attempts > this.options.maxRetries) {
      this.#detachNetworkStatusListeners();
      this.#events.emit(TRANSPORT_EVENTS.MAX_RETRIES_MADE);
      return;
    }

    if (!this.onLine) {
      this.#reconnectWhenOnline = true;
      return;
    }

    const delay = typeof this.options.retryInterval === 'function'
      ? this.options.retryInterval(event, this)
      : this.options.retryInterval;

    this.#reconnectTimeoutIndex = setTimeout(() => {
      // dispatch reconnecting event
      this.#connect();
    }, delay);
  }

  #whenOnline = () => {
    if (!this.#reconnectWhenOnline) {
      return;
    }

    this.#connect();
  };

  #whenOffline = () => {
    this.#clearPendingReconnect();
    this.#reconnectWhenOnline = true;
    this.ws.close(SOCKET_ERRORS_CODES.NORMAL, 'Network Offline');
  };

  #attachNetworkStatusListeners() {
    if (this.#attachedNetworkListeners) {
      return;
    }

    globalThis.addEventListener('online', this.#whenOnline);
    globalThis.addEventListener('offline', this.#whenOffline);
    this.#attachedNetworkListeners = true;
  }

  #detachNetworkStatusListeners() {
    globalThis.removeEventListener('online', this.#whenOnline);
    globalThis.removeEventListener('offline', this.#whenOffline);
    this.#attachedNetworkListeners = false;
  }

  #clearPendingReconnect() {
    if (!this.#reconnectTimeoutIndex) {
      return;
    }

    clearTimeout(this.#reconnectTimeoutIndex);
    this.#reconnectTimeoutIndex = null;
  }

  #reset() {
    this.#detachNetworkStatusListeners();
    this.#clearPendingReconnect();
    this.#reconnectWhenOnline = false;
  }
}

export default Transport;
