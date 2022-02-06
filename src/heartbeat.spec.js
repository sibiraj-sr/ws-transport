import { describe, expect, it, jest } from '@jest/globals';

import HeartBeat from './heartbeat.js';

jest.useFakeTimers();

describe('HeartBeat', () => {
  it('should initialize correctly', () => {
    const heartbeat = new HeartBeat();
    expect(heartbeat).toBeInstanceOf(HeartBeat);
    expect(heartbeat.start).toBeInstanceOf(Function);
    expect(heartbeat.stop).toBeInstanceOf(Function);
    expect(heartbeat.postpone).toBeInstanceOf(Function);
  });

  it('should call the handler at default intervals', () => {
    const mockHandler = jest.fn();

    const heartbeat = new HeartBeat({
      handler: mockHandler,
    });

    heartbeat.start();

    expect(mockHandler).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2000);
    expect(mockHandler).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2000);
    expect(mockHandler).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(mockHandler).toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    expect(mockHandler).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(3000);
    expect(mockHandler).toHaveBeenCalledTimes(2);

    heartbeat.stop();
  });

  it('should not call the handler once stopped', () => {
    const mockHandler = jest.fn();

    const heartbeat = new HeartBeat({
      handler: mockHandler,
    });

    heartbeat.start();
    jest.advanceTimersByTime(5000);
    expect(mockHandler).toHaveBeenCalled();

    heartbeat.stop();

    jest.advanceTimersByTime(5000);
    expect(mockHandler).not.toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(5000);
    expect(mockHandler).not.toHaveBeenCalledTimes(2);
  });

  it('should reschedule the timer', () => {
    const mockHandler = jest.fn();

    const heartbeat = new HeartBeat({
      handler: mockHandler,
    });

    heartbeat.start();
    jest.advanceTimersByTime(5000);
    expect(mockHandler).toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    heartbeat.postpone();
    jest.advanceTimersByTime(3000);
    expect(mockHandler).not.toHaveBeenCalledTimes(2);

    heartbeat.postpone();
    jest.advanceTimersByTime(3000);
    expect(mockHandler).not.toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(2000);
    expect(mockHandler).toHaveBeenCalledTimes(2);

    heartbeat.stop();
  });
});
