const t = require('@babel/types');
const {method, firstType, oneArg} = require('adv-parser/methods/utils');
const set = require('adv-parser/methods/set');

/**
 * @param {Object<string, string|Array<string>|Function>} source
 * @returns {Object<string, function(schema: Object, args: Array, params?: Object): Object>}
 */
module.exports = function toMethods(source) {
	const target = {};

	for (const name in source) {
		const type = source[name];

		if (typeof type === 'function') {
			target[name] = type;
			continue;
		}

		target[name] = function (schema, args, params) {
			method(name);

			if (args.length === 0) {
				if (type === 'boolean') {
					args = [t.booleanLiteral(true)];
				}
				else {
					oneArg(args);
				}
			}

			return set(
				schema,
				[name, args[0]],
				{
					methodName: name,
					valueType: value => firstType(value, type),
					...params,
				}
			);
		};
	}

	return target;
};