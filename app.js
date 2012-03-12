
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
	, fs = require('fs')
	, im = require('imagemagick')
	, twitter = require('ntwitter')
	, twitterSettings = require('./twitterSettings').settings;

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
	app.use("/public", express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
app.get('/file-upload', routes.initFileUpload);
app.post('/file-upload', function(req, res){

		// get the temporary location of the file
    var tmp_path = req.files.thumbnail.path;
    // set where the file should actually exists - in this case it is in the "images" directory
    var target_path = './public/img/download/' + req.files.thumbnail.name;
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;
						console.log('Sockets', globalSocket);

						im.resize({ srcData: fs.readFileSync(target_path, 'binary'),width: 320, height: 240}, 
										function(err, stdout, stderr){
  											if (err) throw err;
  											resizedPath =  './public/img/download/resized-' + req.files.thumbnail.name;
												fs.writeFileSync(resizedPath, stdout, 'binary');

												globalSocket.forEach(function(socket){
													socket.emit('newPhoto', resizedPath);
												});

										});

						
            res.send('File uploaded ');
        });
    });
		

});


// Twitter stream
//
var twit = new twitter({
      consumer_key: twitterSettings.consumer_key,
      consumer_secret: twitterSettings.consumer_secret,
      access_token_key: twitterSettings.access_token_key,
      access_token_secret: twitterSettings.access_token_secret
    });

twit.stream('statuses/filter', {'track':'TestTweetNode'}, function(stream) {
      stream.on('data', function (data) {
        console.log(data.entities.media[0].media_url);
				mediaUrl = data.entities.media[0].media_url;
				globalSocket.forEach(function(socket){
						socket.emit('newPhoto', mediaUrl);
				});


      });
    });
/*
twit.search('#DevoxxFR', function(err, data) {
      console.log('search');
      console.log(data);
    });
*/
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var io = require('socket.io').listen(app);

globalSocket = new Array();
io.sockets.on('connection', function(socket){
	globalSocket.push(socket);
	console.log('GlobalSocket', globalSocket);
});

