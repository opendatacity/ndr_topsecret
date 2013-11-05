var fs = require('fs');

exports.filestream = function (filename) {
	var me = this;
	var fd = fs.openSync(filename, 'w');
	var buffer = '';

	var writeBuffer = function () {
		if (buffer.length > 0) {
			var b = new Buffer(buffer, 'ascii');
			fs.writeSync(fd, b, 0, b.length);
			buffer = '';
		}
	}

	me.write = function (data) {
		buffer += data;
		if (buffer.length > 1e6) writeBuffer();
	}

	me.close = function () {
		writeBuffer();
		fs.closeSync(fd);
	}

	return me;
}