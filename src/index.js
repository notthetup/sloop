var http = require('http'),
path = require('path'),
os = require('os'),
inspect = require('util').inspect;
Wavemarker = require('./wavemarker');
Mp3Encoder = require('./mp3encoder');
var fileSystem = require('fs');


var Busboy = require('busboy');
var wm = new Wavemarker();
var enc = new Mp3Encoder();

http.createServer(function(req, res) {
	if (req.method === 'POST') {
		var busboy = new Busboy({ headers: req.headers });
		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			var saveTo = path.join(os.tmpDir(), path.basename(fieldname));
			file.pipe(fileSystem.createWriteStream(saveTo));
		});
		busboy.on('finish', function() {
			wm.mark("audio/sine.wav", function (err, path){
				if (err){
					console.error(err);
					res.writeHead(200, { 'Connection': 'Error ' +  err.message});
					res.end("Ooops!");
				} else{
					//console.log("File saved to " + path);
					enc.encode(path, function(err, path){
						if (err){
							console.error(err);
							res.writeHead(200, { 'Connection': 'Error ' +  err.message});
							res.end("Ooops!");
						} else{
							//console.log("Encoded to " + path);
							res.setHeader('Content-disposition', 'attachment; filename=' + path.split('/').splice(-1,1));
							res.setHeader('Content-type', "audio/mp3");
							var filestream = fileSystem.createReadStream(path);
							filestream.pipe(res);
						}
					})
				}
			});
		});
		req.pipe(busboy);
	}
	else if (req.method === 'GET') {
		res.writeHead(200, { Connection: 'close' });
		res.end('<html><head></head><body>\
			<form method="POST" enctype="multipart/form-data">\
			<input type="file" name="filefield"><br />\
			<input type="submit">\
			</form>\
			</body></html>');
	}
}).listen(8000, function() {
	console.log('Listening for requests');
});
