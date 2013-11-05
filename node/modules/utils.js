var fs = require('fs');
var path = require('path');

exports.ensureFolder = function (folder) {
	folder = path.resolve(path.dirname(require.main.filename), folder);
	folder = path.dirname(folder);
	var rec = function (fol) {
		if (fol != '/') {
			rec(path.dirname(fol));
			if (!fs.existsSync(fol)) fs.mkdirSync(fol);
		}
	}
	rec(folder);
}

exports.loadCSV = function (filename) {
	var csv = fs.readFileSync(filename, 'ascii');
	var result = [];

	var text = '';
	var fields = [];
	var addField = function () {
		fields.push(text);
		text = '';
	}
	var addLine = function () {
		addField();
		if (fields.length > 1) result.push(fields);
		fields = [];
	}

	var inQuotes = false;
	for (var i = 0; i < csv.length; i++) {
		var c = csv[i];
		if (c == '"') {
			inQuotes = !inQuotes;
			if (inQuotes) {
				var j = csv.indexOf('"', i+1)-1;
				if (j - i > 1) {
					text += csv.substr(i+1, j-i);
					i = j;
				}
			}
		} else {
			if (inQuotes) {
				text += c;
			} else {
				switch (c) {
					case ',': addField(); break;
					case '\n': addLine(); break;
					default: text += c;
				}
			}
		}
	}

	addLine();

	return result;
}