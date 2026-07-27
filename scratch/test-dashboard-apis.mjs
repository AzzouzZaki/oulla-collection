/**
 * Test dashboard page access with admin_token cookie.
 */
import { request } from 'http';

// First, get a token
const loginData = JSON.stringify({ username: 'user', password: 'password' });

const loginReq = request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  },
  (loginRes) => {
    const cookieHeader = loginRes.headers['set-cookie'];
    if (!cookieHeader) {
      console.error('No Set-Cookie header found!');
      process.exit(1);
    }
    const cookie = cookieHeader[0].split(';')[0];
    console.log(`Successfully authenticated. Cookie: ${cookie}\n`);

    // Now call /dashboard
    const dashboardReq = request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/dashboard',
        method: 'GET',
        headers: {
          'Cookie': cookie
        }
      },
      (dashboardRes) => {
        console.log(`DASHBOARD PAGE STATUS: ${dashboardRes.statusCode}`);
        console.log('DASHBOARD PAGE HEADERS:', JSON.stringify(dashboardRes.headers, null, 2));
        process.exit(0);
      }
    );
    dashboardReq.end();
  }
);

loginReq.write(loginData);
loginReq.end();
