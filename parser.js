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
const dataTypeMethods = require('./methods/dataType');
const functions = require('./functions');

const methods = {
	...defaultMethods,
	...modelMethods,
	...columnMethods,
	...dataTypeMethods,
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
	dataTypes: D,
	defaultJsonType,
	...parserParams
}) {
	if (!D) {
		D = require('sequelize').DataTypes;
	}

	defaultJsonType = defaultJsonType || D.JSON;

	const {title, required, properties, ...rest} = parser(code, {
		schemas,
		methods,
		objectOptions,
		functions,
		...parserParams,
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

	const toDataType = (type, columnSchema = {}) => {
		switch (type) {
		case 'object':
		case 'array':
			return defaultJsonType;
		case 'number':
			return D.INTEGER;
		default:
			let TYPE = type;

			if (typeof TYPE === 'string') {
				TYPE = TYPE.toUpperCase();
			}

			if (!has(D, TYPE)) {
				throw new Error('Invalid column validator type: ' + JSON.stringify(type));
			}

			TYPE = get(D, TYPE);

			if (type === 'string' && columnSchema.maxLength) {
				TYPE = TYPE(columnSchema.maxLength);
			}

			return TYPE;
		}
	}

	const columns = {};

	for (const name in properties) {
		let {type, dataType, ...prop} = properties[name];
		let schemaOptions = omit(prop, columnMethodsNames);
		const columnOptions = pick(prop, columnMethodsNames);

		if (schemaOptions.description && !columnOptions.comment) {
			columnOptions.comment = schemaOptions.description;
		}

		if (type) {
			schemaOptions.type = type;
		}

		if (
			columnOptions.allowNull &&
			!schemaOptions.anyOf &&
			schemaOptions.type !== 'null'
		) {
			schemaOptions = {
				anyOf: [
					schemaOptions,
					{type: 'null'},
				]
			};
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
			const items = (
				schemaOptions.anyOf ||
				schemaOptions.allOf
			);

			if (items.length < 2) {
				throw new Error(`Invalid number of items in "${schemaOptions.anyOf ? 'anyOf' : 'allOf'}"`);
			}

			let item = items[0];

			if (item.type === 'null') {
				item = items[1];
			}

			if (!item.type || item.type === 'null') {
				throw new Error(`Invalid "type" of item[${items.indexOf(item)}] in "${schemaOptions.anyOf ? 'anyOf' : 'allOf'}"`);
			}

			if (items.some(({type}) => type !== item.type && type !== 'null')) {
				throw new Error(`All items in "${schemaOptions.anyOf ? 'anyOf' : 'allOf'}" must be same type`);
			}

			dataType = toDataType(item.type, item);
		}
		else if (!dataType) {
			dataType = toDataType(type, schemaOptions);
		}
		else if (isDataType(D, dataType)) {
			dataType = convertDataType(D, dataType);
		}
		else {
			throw new Error('Invalid column data type: ' + JSON.stringify(dataType));
		}

		if (isDataType(D, columnOptions.defaultValue)) {
			columnOptions.defaultValue = convertDataType(D, columnOptions.defaultValue);
		}

		if (!columnOptions.hasOwnProperty('allowNull')) {
			columnOptions.allowNull = !!(
				schemaOptions.anyOf &&
				schemaOptions.anyOf.some(item => item.type === 'null')
			);
		}

		if (
			!columnOptions.defaultValue &&
			!columnOptions.allowNull &&
			(dataType === D.JSON || dataType === D.JSONB) &&
			schemaOptions.type === 'array'
		) {
			columnOptions.defaultValue = [];
		}

		columns[name] = {
			type: dataType,
			...columnOptions,
		};
	}

	parser(`${title} = !!${JSON.stringify(schema)}`, {schemas});

	return {name: title, columns, options, schema: cloneDeep(schema)};
};

function get(obj, path) {
	if (typeof path !== 'string') return;

	if (path.includes('.')) {
		return path.split('.').reduce((src, prop) => src[prop], obj);
	}

	return obj[path];
}

function has(obj, path) {
	return typeof get(obj, path) !== 'undefined';
}

function getDataType(item) {
	return item && (
		(item.type === 'DataType' && item.path && item) ||
		(item.dataType && item.dataType.type === 'DataType' && item.dataType.path && item.dataType)
	);
}

function isDataType(D, item) {
	const type = getDataType(item);

	return !!type && has(D, type.path);
}

function convertDataType(D, item) {
	const dataType = getDataType(item);

	if (!dataType) return item;

	let TYPE = get(D, dataType.path);

	if (!TYPE) {
		throw new Error(`Unknown data type: ${JSON.stringify(dataType.path)}`)
	}

	if (dataType.args) {
		TYPE = TYPE.apply(null, dataType.args.map(item => convertDataType(D, item)));
	}

	if (dataType.UNSIGNED) {
		TYPE = TYPE.UNSIGNED;
	}
	if (dataType.ZEROFILL) {
		TYPE = TYPE.ZEROFILL;
	}
	if (dataType.BINARY) {
		TYPE = TYPE.BINARY;
	}

	return TYPE;
}