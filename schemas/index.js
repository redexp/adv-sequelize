const toAst = require('adv-parser/lib/toAst');

const schemas = {};

const types = {
	string: [
		'STRING',
		'CHAR',
		'TEXT',
		'CITEXT',

		'TIME',
		'DATE',
		'DATEONLY',
		'NOW',
		'UUID',
		'UUIDV1',
		'UUIDV4',

		'CIDR',
		'INET',
		'MACADDR',

		'GEOMETRY',
		'GEOGRAPHY',

		'BLOB',
	],
	integer: [
		'INTEGER',
		'TINYINT',
		'SMALLINT',
		'MEDIUMINT',
		'BIGINT',
	],
	number: [
		'FLOAT',
		'REAL',
		'DOUBLE',
		'DECIMAL',
	],
	object: [
		'JSON',
		'JSONB',
		'HSTORE',
	],
	boolean: [
		'BOOLEAN',
	]
};

for (let type in types) {
	let names = types[type];

	for (let i = 0; i < names.length; i++) {
		let dataType = names[i];

		schemas[dataType] = toAst(JSON.stringify({
			type,
			dataType: {
				type: 'DataType',
				path: dataType,
			},
		}));
	}
}

module.exports = schemas;