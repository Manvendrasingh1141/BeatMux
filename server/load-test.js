import autocannon from 'autocannon';

const runLoadTest = () => {
  const instance = autocannon({
    url: 'http://localhost:3000/health/live',
    connections: 100, // number of concurrent connections
    pipelining: 1, 
    duration: 10, // 10 seconds
  }, (err, result) => {
    if (err) {
      console.error('Load test error:', err);
    } else {
      console.log('--- HTTP Benchmark Results ---');
      console.log(`Requests per second: ${result.requests.average}`);
      console.log(`Latency p50: ${result.latency.p50} ms`);
      console.log(`Latency p99: ${result.latency.p99} ms`);
      console.log(`Total requests: ${result.requests.total}`);
      console.log(`Errors: ${result.errors}`);
      console.log('------------------------------');
    }
  });

  autocannon.track(instance, { renderProgressBar: true });
};

runLoadTest();
