import connect from 'connect';
import bodyParser from 'body-parser';

const app = connect();

app.use(bodyParser.json());
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}\n${JSON.stringify(req.body, null, 2)}`);
  next();
});

app.use('/api/ping', (req, res, next) => {
  if (req.method === 'GET') {
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    next();
  }
});

const serverAddress = process.env.SERVER_ADDRESS || '127.0.0.1:8080';
const [host, port] = serverAddress.split(':');
const http = app.listen(port, host, () => {
  console.log(`Listening on http://${serverAddress}`);
});

function stop() {
  console.log('Stopping...');
  http.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

process.on('SIGHUP', () => stop());
process.on('SIGUSR2', () => stop());
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
