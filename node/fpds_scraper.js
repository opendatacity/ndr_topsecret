
var fs = require('fs');
var download = require('./modules/downloader.js').download;
var parse = require('./modules/parse.js');
var utils = require('./modules/utils.js');

var zipfiles = 0;
//var minDate = new Date('1960-01-01');
var minDate = new Date('2000-01-01');
var maxDate = new Date('2020-01-01');

var entries = {};
var keysList = [];
var keysLookup = {};
var entryCount = 0;
var todos = [];
var active = 0;

process.on('exit', function() {

	//fs.writeFileSync('./keys.json', JSON.stringify(keysList, null, '\t'), 'utf8');
	fs.writeFileSync('../results/fpds-head.tsv', keysList.join('\t'), 'utf8');
	tsv.close();
});

var filestream = require('./modules/filestream.js').filestream;
var tsv = new filestream('../results/fpds-data.tsv');

[/*
	'Darmstadt',
	'Dagger',
	'Griesheim',
	'Eberstadt',
	'Nathan Hale',
	'ECC',
	'ESOC',
	'NSA',
	'Jim Belotte',
	'Mike Allington',
	'Arlene Haehnlein',
	'Wiesbaden',
	'WAAF',
	'Mainz',
	'Mainz-Kastel',
	'ETC',

	'Bundesamt',
	'Deutschland',
	'GmbH',*/
	'Germany'
].forEach(function (word) {
	scrapeFPDS(word);
})


function getUrl(searchword, minDate, maxDate, page) {
	var y0 = formatInteger(minDate.getFullYear(), 4);
	var y1 = formatInteger(maxDate.getFullYear(), 4);
	var m0 = formatInteger(minDate.getMonth()+1,  2);
	var m1 = formatInteger(maxDate.getMonth()+1,  2);
	var d0 = formatInteger(minDate.getDate(),     2);
	var d1 = formatInteger(maxDate.getDate(),     2);
	return {
		url:'https://www.fpds.gov/ezsearch/fpdsportal?s=FPDSNG.COM&indexName=awardfull&templateName=1.4.4&q='+searchword+'++SIGNED_DATE%3A%5B'+y0+'%2F'+m0+'%2F'+d0+'%2C'+y1+'%2F'+m1+'%2F'+d1+'%5D&rss=1&feed=atom0.3&start='+(page*10),
		cacheFilename:'../cache/FPDS/html/'+searchword+'/'+y0+'_'+m0+'_'+d0+'-'+y1+'_'+m1+'_'+d1+'/'+page+'.txt',
		jsonFilename:'../cache/FPDS/json/'+searchword+'/'+y0+'_'+m0+'_'+d0+'-'+y1+'_'+m1+'_'+d1+'/'+page+'.json',
		desc:'"'+searchword+'" von '+y0+'-'+m0+'-'+d0+' bis '+y1+'-'+m1+'-'+d1+' Seite '+page,
		searchword:searchword,
		minDate:minDate,
		maxDate:maxDate,
		page:page
	}
}


function scrapeFPDS (searchword) {
	scrape(searchword, minDate, maxDate, 0);
}

for (var i = 0; i < 4; i++) next();

function next() {
	if (todos.length == 0) {
		if (active > 0) {
			setTimeout(next, 1000);
		}

		return;
	}

	var file = todos.pop();
	active++;
	
	getFile(file, function (xml, ok) {
		setTimeout(next, 1);
		active--;

		if (!ok) {
			return;
		}
		var maxPage = getMaxPage(xml);
		if (maxPage >= 150) {
			var middleTime = (file.minDate.getTime()+file.maxDate.getTime())/2;
			middleTime = Math.round(middleTime/86400000)*86400000;
			
			var d0 = new Date(middleTime-86400000);
			var d1 = new Date(middleTime);
			
			scrape(file.searchword, file.minDate, d0, 0);
			scrape(file.searchword, d1, file.maxDate, 0);

			return;
		}
		
		if (maxPage >= 0) {
			var list;
			if (fs.existsSync(file.jsonFilename)) {
				try {
					list = JSON.parse(fs.readFileSync(file.jsonFilename, 'utf8'));
				} catch (e) {
					console.error('ERROR - JSON defekt:' + file.jsonFilename);
					process.exit();
				}
			} else {
				list = parse.entries(xml);
				utils.ensureFolder(file.jsonFilename);
				fs.writeFileSync(file.jsonFilename, JSON.stringify(list, 'null', '\t'), 'utf8');
			}
			addEntries(list);
			if (file.page == 0) {
				// antesten
				for (var i = maxPage; i > 0; i--) {
					scrape(file.searchword, file.minDate, file.maxDate, i);
				}
			}
		}
	})
}

function scrape (searchword, minDate, maxDate, page) {
	var file = getUrl(searchword, minDate, maxDate, page);
	todos.push(file);
}

function addEntries(list) {
	list.forEach(function (entry) {
		var key = [
			entry.awardID_ContractID_agencyID || entry.content_IDV_contractID_IDVID_agencyID,
			entry.awardID_ContractID_PIID || entry.content_IDV_contractID_IDVID_PIID,
			entry.awardID_ContractID_modNumber || entry.content_IDV_contractID_IDVID_modNumber,
			entry.awardID_ContractID_transactionNumber,
			entry.awardID_referencedIDVID_agencyID,
			entry.awardID_referencedIDVID_PIID,
			entry.awardID_referencedIDVID_modNumber
		];
		
		key = key.join('_');
		
		if (entries[key]) {
			/*
			if (entries[key].title != entry.title) {

				console.error('ERROR: '+key);
				console.error(entries[key].title);
				console.error(entry.title);
			}
			*/

		} else {
			entries[key] = true;
			tsv.write(compressEntry(entry).join('\t')+'\n');
		}
		
		entryCount++;
	});
}

function compressEntry(entry) {
	var result = [];
	Object.keys(entry).forEach(function (key) {
		if (keysLookup[key] === undefined) {
			keysLookup[key] = keysList.length;
			keysList.push(key);
		}
		result[keysLookup[key]] = entry[key];
	});
	return result;
}

function getMaxPage(xml) {
	var match = xml.match(/<link rel=\"last\".*start=([0-9]*)\"/);
	if (match) {
		return parseInt(match[1], 10)/10;
	} else {
		return -1;
	}
}

function getFile(file, callback) {
	if (fs.existsSync(file.cacheFilename)) {
		var data = fs.readFileSync(file.cacheFilename, 'utf8');
		setTimeout(function () {
			callback(data, true)
		}, 1);
	} else {
		console.log('Lade '+file.desc);
		download(file.url, function (data, ok) {
			console.log('Geladen '+file.desc);
			if (!ok) {
				console.error('Download Error');
				return;
			}
			utils.ensureFolder(file.cacheFilename);
			fs.writeFileSync(file.cacheFilename, data, 'utf8');
			callback(data, ok);
		})
	}
}

function formatInteger(value, digits) {
	value = '0000000000'+value.toFixed(0);
	return value.substr(value.length-digits, digits);
}