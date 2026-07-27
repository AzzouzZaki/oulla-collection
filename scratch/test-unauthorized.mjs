/**
 * Test unauthorized request to dashboard page.
 */
import { request } from 'http';

const req = request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/dashboard',
    method: 'GET'
  },
  (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
    process.exit(0);
  }
);

req.on('error', (e) => {
  console.error(e);
  process.exit(1);
});

req.end();
