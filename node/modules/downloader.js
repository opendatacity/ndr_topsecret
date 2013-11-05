
var URL = require('url');
var HTTP = require('http');
HTTP.globalAgent.maxSockets = 2;

var HTTPS = require('https');
HTTPS.globalAgent.maxSockets = 2;

var timeout = 30;

exports.download = function (url, callbackFunction, german, binary) {
	var opt = URL.parse(url);
					
	var protocol;
	switch (opt.protocol) {
		case 'http:': protocol = HTTP; break;
		case 'https:': protocol = HTTPS; break;
		default:
			console.error('Unknown Protocol '+opt.protocol);
	}
	
	var language = german ? 'de-de;q=0.7,en;q=0.3' : 'en-us;q=0.7,en;q=0.3';

	var calledback = false;
	var finished = false;

	var callback = function (data, error) {
		if (!calledback) {
			calledback = true;
			callbackFunction(data, error);
		}
	}
	
	var request = protocol.request(
		{
			host: opt.host,
			path: opt.path,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:16.0) Gecko/20100101 Firefox/16.0',
				'Accept': 'text/css,*/*;q=0.1',
				'Accept-Language': language,
				'Cache-Control': 'max-age=0'
			}
		}, function (res) {
			var code = res.statusCode;
			if (code != 200) {
				console.error('ERROR: HTTP code = ' + code + ' (' + url + ')');
				finished = true;
				callback(undefined, false);
				request.abort();
				return;
			}
			
			var data = '';
			
			if (binary) res.setEncoding('binary');
			
			res.on('data', function (chunk) { data += chunk });
			
			res.on('end', function () {
				finished = true;
				callback(data, true);
			});
		}
	);
	
	request.setTimeout(timeout*1000, function (e) {
		console.error('request timeout: '+url);
		callback(undefined, false);
	});
	
	request.on('error', function(e) {
		console.error('UNKOWN ERROR: '+e);
	});
	
	request.on('socket', function(e) {
		setTimeout(function () {
			if (!finished) {
				console.error('Verkackt!');
				request.abort();
				callback(undefined, false);
			}
		}, (timeout+5)*1000);
	});
	
	request.end();
}