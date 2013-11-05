
var fs = require('fs');
var utils = require('./modules/utils.js');

// filestream ist ein besonderer filewriter,
// der sehr schnell sehr großen Datenmengen schreiben kann.
var filestream = require('./modules/filestream.js').filestream;
var tsv = new filestream('../results/fbo-data.tsv');

var keysList = [];
var keysLookup = {};
var todos = [];

// Verzeichnisse scannen
scanDir('../cache/FBO/FBORecovery/');
scanDir('../cache/FBO/FBORecoveryAwards/');

todos = todos.sort(function (a,b) {
	if (a == b) return 0;
	if (a < b) return 1;
	return -1;
});

var todoCount = todos.length;


// Und jetzt werden alle CSV-Dateien eingelesen, gesäubert
// und hintereinander als eine große TSV ausgegeben.
next();





// Benötigte Funktionen


function next() {
	if (todos.length <= 0) {
		fs.writeFileSync('../results/fbo-head.tsv', keysList.join('\t'), 'utf8');
		tsv.close();
		return;
	}
	
	var i = todoCount-todos.length;
	if (i % 10 == 0) console.log((100*i/todoCount).toFixed(1)+'%');

	scanFile(todos.pop(), next);
}

function scanDir(path) {
	var files = fs.readdirSync(path);
	files.forEach(function (filename) {
		if (filename.match(/^FBO.*?\.csv$/)) {
			todos.push(path+filename);
		}
	});
}

function scanFile(filename, callback) {
	console.log('   - '+filename);
	var csv = utils.loadCSV(filename);
	var head = csv.shift();

	for (var i = 0; i < csv.length; i++) {
		var entry = csv[i];
		var obj = {};
		for (var j = 0; j < head.length; j++) {
			obj[head[j]] = entry[j];
		}
		saveResult(obj);
	}

	setTimeout(callback, 0);
}


function saveResult(object) {
	if (!object) return;

	var entry = [];

	Object.keys(object).forEach(function (key) {
		if (keysLookup[key] === undefined) {
			keysLookup[key] = keysList.length;
			keysList.push(key);
		}
		var value = object[key];
		value = value.replace(/\\/g, '\\\\');
		value = value.replace(/\t/g, '\\t');
		value = value.replace(/\r/g, '\\r');
		value = value.replace(/\n/g, '\\n');
		entry[keysLookup[key]] = value;
	});

	tsv.write(entry.join('\t')+'\n');
}
