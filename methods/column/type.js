const set = require('adv-parser/methods/set');

module.exports = function type(schema, args, params) {
	return set(
		schema,
		['dataType', args[0]],
		{
			methodName: 'type',
			...params,
		}
	);
};