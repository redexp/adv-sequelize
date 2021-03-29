const t = require('@babel/types');
const set = require('adv-parser/methods/set');
const {method, oneArg} = require('adv-parser/methods/utils');

module.exports = function defaultValue(schema, args, params) {
	var methodName = 'defaultValue';
	method(methodName);
	oneArg(args);

	var value = args[0];

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			convertValue: t.isIdentifier(value),
			...params,
		}
	);
};