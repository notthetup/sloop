Wavemarker = require('./wavemarker');
Encoder = require('./mp3encoder');

var http = require('http'),
path = require('path'),
os = require('os'),
fs = require('fs'),
shortId = require('shortid');

var Busboy = require('busboy');

wm = new Wavemarker();
enc = new Encoder();

storageFolder = "audio/";

http.createServer(function(req, res) {
	if (req.method === 'POST') {
		var saveTo;
		var busboy = new Busboy({ headers: req.headers });
		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			saveTo = path.join(os.tmpDir(), path.basename(filename));
			file.pipe(fs.createWriteStream(saveTo));
			console.log("saving to " + saveTo);
		});
		busboy.on('finish', function() {
			var thisFileID = shortId.generate();
			console.log("Marking " + saveTo);
			wm.mark(saveTo, function (err, path){
				if (err){
					console.error(err);
					res.writeHead(200, { 'Connection': 'Error ' +  err.message});
					res.end("Ooops!");
				} else{
					console.log("File saved to " + path);
					enc.encode(path, function(err, path){
						if (err){
							console.error(err);
							res.writeHead(200, { 'Connection': 'Error ' +  err.message});
							res.end("Ooops!");
						} else{
							console.log("Encoded to " + path);
							fs.rename(path, storageFolder+thisFileID);
							console.log("Store to " + storageFolder+thisFileID);
							res.writeHead(200, { Connection: 'close' });
							res.end('<html><head></head><body>\
								<div>Your file was stored at </div>\
								</form>\
								</body></html>');
						}
					});
				}
			});
		});
		return req.pipe(busboy);
	} else if (req.method === 'GET') {
		res.writeHead(200, { Connection: 'close' });
		res.end('<html><head></head><body>\
			<form method="POST" enctype="multipart/form-data">\
			<input type="text" name="textfield"><br />\
			<input type="file" name="filefield"><br />\
			<input type="submit">\
			</form>\
			</body></html>');
	}
}).listen(8000, function() {
	console.log('Listening for requests');
});

// http.createServer(function(req, res) {
// 	if (req.method === 'POST') {
// 		var saveTo;
// 		var busboy = new Busboy({ headers: req.headers });
// 		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
// 			saveTo = path.join(os.tmpDir(), path.basename(filename));
// 			console.log("Saving to " + saveTo);
// 			file.pipe(fileSystem.createWriteStream(saveTo));
// 		});
// 		busboy.on('finish', function() {
// 			var thisFileID = shortId.generate();
// 			console.log("Marking " + saveTo);
// 			wm.mark(saveTo, function (err, path){
// 				if (err){
// 					console.error(err);
// 					res.writeHead(200, { 'Connection': 'Error ' +  err.message});
// 					res.end("Ooops!");
// 				} else{
// 					//console.log("File saved to " + path);
// 					enc.encode(path, function(err, path){
// 						if (err){
// 							console.error(err);
// 							res.writeHead(200, { 'Connection': 'Error ' +  err.message});
// 							res.end("Ooops!");
// 						} else{
// 							console.log("Encoded to " + path);
// 							fs.rename(path, storageFolder+thisFileID);
// 							console.log("Store to " + storageFolder+thisFileID);
// 						}
// 					});
// 				}
// 			});
// 		});
// 		req.pipe(busboy);
// 	}
// 	else if (req.method === 'GET') {
// 		res.writeHead(200, { Connection: 'close' });
// 		res.end('<html><head></head><body>\
// 			<form method="POST" enctype="multipart/form-data">\
// 			<input type="file"><br />\
// 			<input type="submit">\
// 			</form>\
// 			</body></html>');
// 	}
// }).listen(8000, function() {
// 	console.log('Listening for requests');
// });
