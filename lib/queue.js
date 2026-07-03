// Async message queue backing a transport's receive(): buffers inbound messages
// and hands the next one to a pending pull(). Cap'n Web calls receive() in a loop.
export function makeQueue() {
  const buffer = [];
  const waiters = [];
  return {
    push(msg) {
      const w = waiters.shift();
      if (w) w.resolve(msg);
      else buffer.push(msg);
    },
    pull() {
      if (buffer.length) return Promise.resolve(buffer.shift());
      return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
    },
    fail(err) {
      let w;
      while ((w = waiters.shift())) w.reject(err);
    },
  };
}
