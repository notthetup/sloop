var FFmpeg = require('fluent-ffmpeg');

function mp3encoder (){


}

mp3encoder.prototype.encode = function (filePath, callback, options){

	var self = this;

	options = options || {};
	options.bitrate = options.hasOwnProperty('bitrate') ? options.bitrate : '128k';
	options.quality = options.hasOwnProperty('quality') ? options.bitrate : 5;
	options.mp3FilePath = options.hasOwnProperty('mp3FilePath') ? options.mp3FilePath : (filePath.split(".").slice(0,-1)+ ".mp3");

	new FFmpeg({ source: filePath})
	.withNoVideo()
	.withAudioCodec('libmp3lame')
	.withAudioBitrate('128k')
	.withAudioQuality(5)
	.on('error', function(err) {
		console.log('FFMpeg Error: ' + err.message);
		callback(err);
	})
	.on('end', function() {
	      callback(null,options.mp3FilePath);
	})
	.saveToFile(options.mp3FilePath);
}

module.exports = mp3encoder;
