exports.entries = function (xml, callback) {
	var result = [];
	xml = xml.replace(/[\n\r]+/g, ' ');
	xml.match(/<entry>.*?<\/entry>/g).forEach(function (entry) {
		result.push(parseEntry(entry.match(/<entry>(.*?)<\/entry>/)[1]));
	});
	return result;
}

function parseEntry(xml) {
	var result = {};
	parseChildren(result, xml,'');
	return result;
}

function parseChildren(result, xml, prefix) {
	xml = trim(xml);
	while (xml != '') {
		var parts = xml.match(/^<([a-z0-9\:-]*)(.*?)>(.*)<\/\1>(.*)$/i);
		//console.log(xml);
		var tag = parts[1];
		var attributes = trim(parts[2]);
		var content = trim(parts[3]);

		if (tag.indexOf(':') >= 0) {
			tag = tag.replace(/^.*?\:/, '');
		}

		var subTag = prefix+'_'+tag;

		if (attributes != '') {
			parseAttributes(result, attributes, subTag);
		}

		if (content.match('^<[a-z]')) {
			parseChildren(result, content, subTag);
		} else {
			addValue(result, subTag, parseText(content));
		}

		xml = trim(parts[4]);
	};
}

function parseAttributes(result, xml, prefix) {
	xml.match(/[a-z0-9\:-]*=\".*?\"/ig).forEach(function (attribute) {
		var match = attribute.match(/([a-z0-9\:-]*)=\"(.*?)\"/i);
		var name = match[1];
		var value = match[2];
		var subTag = prefix+'_'+name;
		if (name.indexOf('href') >= 0) value = parseHref(value);
		addValue(result, subTag, value);
	});
}

function addValue(result, key, value) {
	key = key.replace(/^_*/, '');

	if (key == 'link_rel') return;
	if (key == 'link_type') return;
	if (key == 'content_type') return;
	if (key == 'content_xmlns:ns1') return;
	if (key == 'content_award_xmlns:ns1') return;

	key = key.replace(/^content_award_/, '');
	key = key.replace(/^awardID_award/, 'awardID_');
	key = key.replace(/_vendor/, '');

	if (result[key]) console.error('ERROR');
	result[key] = value;
}

function parseText(text) {
	if (text.substr(0,9) == '<![CDATA[') text = text.substr(9, text.length-12);
	return text;
}

function parseHref(text) {
	text = text.replace(/&amp;/g, '&');
	return text;
}

function trim(text) {
	return text.replace(/^\s+|\s+$/, '');
}
