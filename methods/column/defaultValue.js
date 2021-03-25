const set = require('adv-parser/methods/set');

module.exports = function defaultValue(schema, args, params) {
	var methodName = 'defaultValue';

	return set(
		schema,
		[methodName, args[0]],
		{
			methodName,
			...params,
		}
	);
};