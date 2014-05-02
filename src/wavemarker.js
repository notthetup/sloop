var wav = require('ndarray-wav');
var assert = require('assert');
var ndarray = require('ndarray');
var fill = require("ndarray-fill")

function Wavemarker (){

	this._checkSeamlessLoop = function (originalSamples){
		return true;
	}

	this._markAndPopulate = function(originalSamples, postfixLength, rampLength){
		var numChannels = originalSamples.shape[0];
		var originalLength = originalSamples.shape[1];
		var markedLength = (originalLength + 2*postfixLength);
		var markedSamples = new ndarray(new Float32Array(markedLength*numChannels), [numChannels, markedLength]);

		var index;
		for (index = 0; index < postfixLength; index++)
		{
			// Put spike in center
			for (var chIndex = 0; chIndex < numChannels; ++chIndex){
				if (index == postfixLength/2)
				{
					if (chIndex % 2 === 0){
						//console.log(" setting to 1 " + chIndex % 2);
						markedSamples.set(chIndex,index,1.0);
					}
					else{
						//console.log(" setting to -1 " + chIndex % 2);
						markedSamples.set(chIndex,index,-1.0);
					}
				}
				else if (index > postfixLength-rampLength)
				{
					// Near end, do a fade in with wrapped-around
					// source sample data
					gain = 1 - (postfixLength-index)/rampLength;
					var srcPos = -(postfixLength-index);
					while (srcPos < 0){
						srcPos += originalLength;
					}
					markedSamples.set(chIndex, index, gain * originalSamples.get(chIndex,srcPos));
				}else{
					markedSamples.set(chIndex,index,0);
				}
			}
		}

		// Write the full loop
		for (index = 0; index < originalLength; index++)
		{
			for (var chIndex = 0; chIndex < numChannels; ++chIndex){
				markedSamples.set(chIndex, postfixLength+index,originalSamples.get(chIndex, index));
			}
		}

		// Write postfix
		var postFixStart = postfixLength + originalLength;
		//console.log(postFixStart);
		for (index = 0; index < postfixLength; index++)
		{
			// Put spike in center
			for (var chIndex = 0; chIndex < numChannels; ++chIndex){
				if (index == postfixLength/2)
				{
					if (chIndex % 2 === 0){
						markedSamples.set(chIndex,postFixStart+index,1.0);
					}
					else{
						markedSamples.set(chIndex,postFixStart+index,-1.0);
					}
				}
				else if (index < rampLength)
				{
					// Near end, do a fade in with wrapped-around
					// source sample data
					gain = 1 - index/rampLength;
					markedSamples.set(chIndex,postFixStart+index, gain * originalSamples.get(chIndex,index%originalLength));
				}else{
					markedSamples.set(chIndex,postFixStart +index,0);
				}
			}

		}

		return markedSamples;

	}

}

/**
 * If f
 *
 *
 * TODO Accept Buffer or Path as well.
 */
 Wavemarker.prototype.mark = function (filePath, callback, options){

 	var self = this;

 	options = options || {};
 	options.postfixLength = options.hasOwnProperty('postfixLength') ? options.postfixLength : 5000;
 	options.rampLength = options.hasOwnProperty('rampLength') ? options.rampLength : 1000;
 	options.forceStereo = options.hasOwnProperty('forceStereo') ? options.forceStereo : false;
 	options.force = options.hasOwnProperty('force') ? options.force : false;

 	if (! options.hasOwnProperty('markedFilePath')){
 		var filePathPre = filePath.split(".").slice(0,-1);
 		var filePathExtension = filePath.split(".").slice(-1);
 		options.markedFilePath = filePathPre+"_marked."+ filePathExtension;
 	}

 	if (filePath === null || filePath === undefined || typeof filePath !== "string"){
 		callback(new Error('Not a valid filePath'));
 		return;
 	}

 	wav.open(filePath, function (err, chunkMap, chunkArr) {
 		if (err) {
 			callback(err);
 			return;
 		}
 		var format = chunkMap.fmt;
		var originalSamples = chunkMap.data; // the wave data as an ndarray
		var originalLength = originalSamples.shape[1];
		//console.log(format.channels + ": " +  originalSamples.shape[0]);

		if (options.forceStereo && format.channels === 1){
			var stereoSamples = new ndarray(new Float32Array(originalLength*2), [2, originalLength]);

			fill(stereoSamples, function(i,j) {
				return originalSamples.get(0,j);
			});

			format.channels = 2;
			originalSamples = stereoSamples;
		}

		assert(format.channels == originalSamples.shape[0]);

		if (self._checkSeamlessLoop(originalSamples) || options.force){
			var markedSamples = self._markAndPopulate(originalSamples, options.postfixLength, options.rampLength);

			wav.write(options.markedFilePath, markedSamples, format, function (err) {
				if (err){
					callback(err);
				}else{
					callback(null, options.markedFilePath);
				}
			});
		}else{
			callback(new Error ("Input doesn't seem like a seamless loop, use the option 'force'."));
		}
	});
}

module.exports = Wavemarker
