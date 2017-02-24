var http = require('http');
var express = require('express');
var app = express();

(function() {

  var webpack = require('webpack');
  var webpackConfig = require('./webpack.config');
  var compiler = webpack(webpackConfig);

  var webpackDevMiddleware = require('webpack-dev-middleware');
  var webpackHotMiddleware = require('webpack-hot-middleware');

  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath,
  }));

  app.use(webpackHotMiddleware(compiler, {
    log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000
  }));

})();


app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/ui', function(req, res){
    res.sendFile(__dirname + '/ui.html');
});


if (require.main === module) {
  var server = http.createServer(app);
  server.listen(process.env.PORT || 8000, function() {
    console.log("Listening on %j", server.address());
  });
}

/*var server = new http.Server(app);
var io = require('socket.io')(server);

var PORT = process.env.PORT || 8090;

server.listen(PORT);

console.log("YOOO");

io.on('connection', (socket) => {
	console.log("YO33OO");
  // <insert relevant code here>
  socket.emit('mappy:playerbatch', playerbatch);
});

*/
