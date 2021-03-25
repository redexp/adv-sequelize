const toMethods = require('../utils/toMethods');
const type = require('./type');
const defaultValue = require('./defaultValue');

module.exports = toMethods({
	type,
	defaultValue,

	unique: ['boolean', 'string', 'object'],
	primaryKey: 'boolean',
	autoIncrement: 'boolean',
	autoIncrementIdentity: 'boolean',
	comment: 'string',
	references: ['string', 'object'],
	onUpdate: 'string',
	onDelete: 'string',
	validate: 'object',
	values: 'array',
	allowNull: 'boolean',
	field: 'string',
});