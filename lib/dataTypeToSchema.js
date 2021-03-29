const {astToAjvSchema} = require('adv-parser');

module.exports = function dataTypeToSchema(root) {
	return astToAjvSchema(root);
};