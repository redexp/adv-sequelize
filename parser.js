const {DataTypes} = require('sequelize');
const parser = require('adv-parser');
const defaultSchemas = require('adv-parser/schemas');
const defaultMethods = require('adv-parser/methods');
const defaultObjectOptions = require('adv-parser/methods/object');
const pick = require('lodash.pick');
const omit = require('lodash.omit');
const cloneDeep = require('lodash.clonedeep');
const modelSchemas = require('./schemas');
const modelMethods = require('./methods/model');
const columnMethods = require('./methods/column');

const methods = {
	...defaultMethods,
	...modelMethods,
	...columnMethods,
};

const objectOptions = {
	...defaultObjectOptions,
	...modelMethods,
	...columnMethods,
};

const modelMethodsNames = Object.keys(modelMethods);
const columnMethodsNames = Object.keys(columnMethods);

module.exports = function (code, {
	schemas = {...defaultSchemas, ...modelSchemas},
	dataTypes: D = DataTypes,
	defaultJsonType,
}) {
	defaultJsonType = defaultJsonType || D.JSON;

	const {title, required, properties, ...rest} = parser(code, {
		schemas,
		methods,
		objectOptions,
	});

	const schema = {
		title,
		required,
		properties: {},
		...omit(rest, modelMethodsNames),
	};

	const options = pick(rest, modelMethodsNames);

	if (schema.description && !options.comment) {
		options.comment = schema.description;
	}

	const toDataType = type => {
		switch (type) {
		case 'object':
		case 'array':
			return defaultJsonType;
		case 'number':
			return D.INTEGER;
		default:
			let TYPE = type.toUpperCase();

			if (D[TYPE]) return D[TYPE];

			throw new Error('Invalid column validator type: ' + JSON.stringify(type));
		}
	}

	const columns = {};

	Object.keys(properties).forEach(function (name) {
		var {type, dataType, ...prop} = properties[name];
		var columnOptions = pick(prop, columnMethodsNames);
		var schemaOptions = omit(prop, columnMethodsNames);

		if (schemaOptions.description && !columnOptions.comment) {
			columnOptions.comment = schemaOptions.description;
		}

		if (!columnOptions.hasOwnProperty('allowNull')) {
			columnOptions.allowNull = !required.includes(name);
		}

		if (type) {
			schemaOptions.type = type;
		}

		schema.properties[name] = {
			...schemaOptions,
		};

		if (
			!dataType &&
			schemaOptions.enum &&
			schemaOptions.enum.every(function (item) {
				return typeof item === type;
			})
		) {
			dataType = D.ENUM;

			if (!columnOptions.values) {
				columnOptions.values = [...schemaOptions.enum];
			}
		}
		else if (
			!dataType &&
			(
				schemaOptions.anyOf ||
				schemaOptions.allOf
			)
		) {
			let items = (
				schemaOptions.anyOf ||
				schemaOptions.allOf
			);

			if (items.length === 0) {
				throw new Error(`Invalid number of items in "${schemaOptions.anyOf ? 'anyOf' : 'allOf'}"`);
			}

			let mainType = items[0].type;

			if (!mainType) {
				throw new Error(`Invalid "type" of item in "${schemaOptions.anyOf ? 'anyOf' : 'allOf'}"`);
			}

			if (!items.every(item => item.type === mainType)) {
				throw new Error(`All items in "${schemaOptions.anyOf ? 'anyOf' : 'allOf'}" must be same type`);
			}

			dataType = toDataType(mainType);
		}
		else if (!dataType) {
			dataType = toDataType(type);
		}
		else if (typeof dataType === 'string') {
			if (D[dataType]) {
				dataType = D[dataType];
			}
			else {
				throw new Error('Invalid column data type: ' + JSON.stringify(dataType));
			}
		}

		columns[name] = {
			type: dataType,
			...columnOptions,
		};
	});

	return {name: title, columns, options, schema: cloneDeep(schema)};
};