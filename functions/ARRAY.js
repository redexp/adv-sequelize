const toAst = require('adv-parser/lib/toAst');
const {astToAjvSchema, generateAjvSchema} = require('adv-parser');

module.exports = function ARRAY(args, params) {
	return toAst(JSON.stringify({
		type: 'array',
		dataType: {
			type: 'DataType',
			path: 'ARRAY',
			args: args.map(ast => generateAjvSchema(astToAjvSchema(ast, params), params)),
		}
	}));
};