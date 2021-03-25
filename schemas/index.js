const toAst = require('adv-parser/lib/toAst');

const schemas = {
	DATE: {
		type: "string",
		dataType: "DATE",
	},
};

for (let name in schemas) {
	schemas[name] = toAst(JSON.stringify(schemas[name]));
}

module.exports = schemas;