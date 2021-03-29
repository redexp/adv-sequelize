const set = require('adv-parser/methods/set');
const {getProp} = require('adv-parser/lib/object');
const t = require('@babel/types');

const names = [
	'UNSIGNED',
	'ZEROFILL',
	'BINARY',
];

const methods = {};

names.forEach(function (name) {
	methods[name] = function (schema, args) {
		var dataType = getProp(schema, 'dataType');

		if (!dataType) {
			throw new Error(`Method "${name}": invalid schema`);
		}

		set(
			dataType.value,
			[name, args.length > 0 ? args[0] : t.booleanLiteral(true)],
			{
				methodName: name,
				clone: false,
			}
		);

		return schema;
	};
});

module.exports = methods;