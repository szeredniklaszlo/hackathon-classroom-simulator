const http = require('http');

const data = JSON.stringify({ userId: '4063df37-3b00-4036-9b3c-9b4ff1cfc5a6' });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/debug/seed-stats',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let responseData = '';
    res.on('data', chunk => {
        responseData += chunk;
    });
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(responseData);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
