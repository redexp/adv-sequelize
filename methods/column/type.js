const t = require('@babel/types');
const set = require('adv-parser/methods/set');
const {method, oneArg} = require('adv-parser/methods/utils');

module.exports = function type(schema, args, params) {
	method('type');
	oneArg(args);

	const TYPE = args[0];

	if (!t.isIdentifier(TYPE)) {
		throw new Error(`Method "type": first argument should be Data Type`);
	}

	return set(
		schema,
		['dataType', TYPE],
		{
			methodName: 'type',
			convertValue: true,
			...params,
		}
	);
};