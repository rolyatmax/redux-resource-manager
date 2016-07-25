const http = require('http');
const request = require('request'); // eslint-disable-line
const url = require('url');

const PORT = 1213;
const baseUrl = 'https://api.github.com/users';

function fetchUser(username) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `${baseUrl}/${username}`,
      headers: {
        'User-Agent': 'redux-resource-manager demo',
      },
    };
    request(options, (error, res, body) => {
      if (!error && res.statusCode === 200) {
        resolve(JSON.parse(body));
      } else {
        console.error('Received error response:', error, body);
        reject(error);
      }
    });
  }).catch((error) => {
    console.log('There was an error with the Github API:', error);
  });
}

function handleRequest(req, res) {
  const { query, pathname } = url.parse(req.url);

  if (pathname !== '/users') {
    res.end(`Path ${pathname} not supported`);
    return;
  }

  const queryParams = query.split('=');
  if (queryParams.length !== 2 || queryParams[0] !== 'usernames') {
    res.end('"usernames" is the only accepted query param and is required');
    return;
  }

  const usernames = queryParams[1].split(',');

  if (usernames.length > 10) {
    res.end('You may only pass up to 10 usernames');
    return;
  }
  console.log('Received request for usernames:', usernames);
  Promise.all(usernames.map(fetchUser)).then((users) => {
    console.log('Github API response, users:', users);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(JSON.stringify(users.map((u) => {
      // put in some errors here and there
      if (Math.random() < 0.5) return { login: u.login, error: 'no response from Github' };
      return u;
    })));
    res.end();
  });
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`Server listening on: http://localhost:${PORT}`);
});
