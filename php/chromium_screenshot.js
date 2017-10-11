// Node port of chromium_screenshot.php

const http = require('http');
const url = require('url');
const fs = require('fs');
const sys = require('sys');
const child_process = require('child_process');
const crypto = require('crypto');

// CONFIG
const hostname = '0.0.0.0';
const port = 8012;
const cacheDir = '/tmp/screenshot-cache-chromium/';

/**
 * @param string urlArg
 * @param function done (called when completed with filePath as arg
 */
const fetchImage = (urlArg, done) => {
  let cachePath = cacheDir + new Buffer(urlArg).toString('base64');

  if (!fs.existsSync(cachePath)) {
    console.log(`Capturing ${urlArg}`);

    // chromium screenshot doesn't allow you to specify screenshot path so we
    // create in temp directory and the copy out
    let tempDir = '/tmp/' + crypto.randomBytes(8).toString('hex');

    if (!fs.existsSync(tempDir))
      fs.mkdirSync(tempDir);

    child_process.execFile('/usr/bin/chromium-browser', [
      '--headless',
      '--disable-gpu',
      '--screenshot',
      '--hide-scrollbars',
      '--window-size=1024,1326',
      urlArg,
    ], {
      cwd: tempDir,
      timeout: 180 * 1000 // in milleseconds
    }, (err, result) => {
      if (fs.existsSync(tempDir + '/screenshot.png')) {
        fs.chmodSync(tempDir + '/screenshot.png', 0755);
        fs.renameSync(tempDir + '/screenshot.png', cachePath);
      }
      fs.rmdirSync(tempDir);
      done(cachePath);
    });
  } else {
    done(cachePath);
  }
};

const server = http.createServer((req, res) => {
  const url_parts = url.parse(req.url, true);
  let urlArg = url_parts.query.url;

  fetchImage(urlArg, (filePath) => {
    // RESPONSE
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '1000');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token , Authorization');

    let stat = fs.statSync(filePath);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', stat.size);

    var readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
