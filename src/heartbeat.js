import { noop } from './utils.js';

const defaultOptions = {
  interval: 5000,
  handler: noop,
};

class HeartBeat {
  options = defaultOptions;

  timeoutIndex = null;

  constructor(opts = defaultOptions) {
    this.options = { ...defaultOptions, ...opts };
  }

  #schedule() {
    this.#clear();
    this.start();
  }

  #clear() {
    clearTimeout(this.timeoutIndex);
  }

  start() {
    this.timeoutIndex = setTimeout(() => {
      this.options.handler();
      this.#schedule();
    }, this.options.interval);
  }

  postpone() {
    this.#schedule();
  }

  stop() {
    this.#clear();
  }
}

export default HeartBeat;
