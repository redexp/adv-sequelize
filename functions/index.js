const toAst = require('adv-parser/lib/toAst');
const ARRAY = require('./ARRAY');
const RANGE = require('./RANGE');

const types = {
	string: [
		'STRING',
		'TEXT',
		'DATE',
		'GEOMETRY',
		'BLOB',
	],
	integer: [
		'INTEGER',
		'BIGINT',
	],
	number: [
		'FLOAT',
		'REAL',
		'DOUBLE',
		'DECIMAL',
	],
};

const functions = {
	ARRAY,
	RANGE,
};

for (const type in types) {
	const names = types[type];

	for (const dataType of names) {
		functions[dataType] = function (args) {
			return toAst(JSON.stringify({
				type,
				dataType: {
					type: 'DataType',
					path: dataType,
					args: args.map(item => item.value),
				},
			}));
		};
	}
}

module.exports = functions;