/**
 * Test login API and display response headers.
 */
import { request } from 'http';

const data = JSON.stringify({
  username: 'user',
  password: 'password'
});

const req = request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  },
  (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log('HEADERS:');
    console.log(JSON.stringify(res.headers, null, 2));

    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('BODY:', body);
      process.exit(0);
    });
  }
);

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  process.exit(1);
});

req.write(data);
req.end();
