const parser = require('./parser');
const SchemaGenerator = require('./SchemaGenerator');

module.exports = define;
module.exports.parser = parser;

function define(code, {sequelize: s, schemas, ajv, ...params} = {}) {
	const DataTypes = s.DataTypes || s.Sequelize.DataTypes;

	const {name, columns, options, schema} = parser(code, {
		schemas,
		dataTypes: DataTypes,
		defaultJsonType: s.options.dialect === 'postgres' ? DataTypes.JSONB : DataTypes.JSON,
		...params,
	});

	if (!ajv) {
		let Ajv = require('ajv');
		Ajv = typeof Ajv.default === 'function' ? Ajv.default : Ajv;
		ajv = new Ajv();

		let hasFormats = false;

		try {
			hasFormats = !!require.resolve('ajv-formats');
		}
		catch (err) {
			// ajv-formats not found
		}

		if (hasFormats) {
			require('ajv-formats')(ajv);
		}
	}

	const instanceName = name.charAt(0).toLowerCase() + name.slice(1);

	for (const prop in columns) {
		const column = columns[prop];
		const columnSchema = schema.properties[prop];
		const validator = ajv.compile(columnSchema);
		const isDate = column.type === DataTypes.DATE;

		column.validate = column.validate || {};

		column.validate.adv = function (value) {
			if (isDate && value instanceof Date) return;

			if (!validator(value)) {
				throw createError(validator.errors, instanceName + '.' + prop);
			}
		};
	}

	const Model = s.define(name, columns, options);

	Model.ajv = ajv;
	Model.Schema = new SchemaGenerator(schema);

	Model._propValidators = {};
	Model._propsValidators = {};

	Model.propValidator = propValidator;
	Model.propsValidator = propsValidator;
	Model.validateProps = validateProps;

	return Model;
}

class ColumnValidationError extends Error {
	constructor(message, errors) {
		super(message);

		this.name = "ColumnValidationError";
		this.errors = errors;
	}
}

function createError(errors, propName = '') {
	return new ColumnValidationError(
		errors
		.map(e => {
			const prop = propName || (
				(e.dataPath || e.instancePath)
				.replace(/^\//, '')
				.replace(/\/(\d+)$/, '[$1]')
				.replace(/\/(\d+)\//g, '[$1].')
				.replace(/\//g, '.')
			);

			return `${prop} ${e.message}`;
		})
		.join('; '),

		errors
	);
}

function createValidator(schema, ajv) {
	const validate = ajv.compile(schema);

	const validator = {
		errors: null,

		isValid(value) {
			const res = validate(value);
			validator.errors = validate.errors;
			return res;
		},

		validate(value) {
			if (!validator.isValid(value)) {
				throw createError(validator.errors);
			}

			return true;
		}
	};

	return validator;
}

function propValidator(name) {
	if (!name) {
		throw new Error(`${this.name}.prop required one argument`);
	}

	const {_propValidators: cache, Schema, ajv} = this;

	if (!cache[name]) {
		cache[name] = createValidator(
			Schema.prop(name).toJSON(),
			ajv
		);
	}

	return cache[name];
}

function propsValidator(...props) {
	if (props.length === 0) {
		throw new Error(`${this.name}.props required at least one argument`);
	}

	if (Array.isArray(props[0])) {
		props = props[0];
	}

	props.sort();

	const {_propsValidators: cache, Schema, ajv} = this;
	const key = props.join(' ');

	if (!cache[key]) {
		cache[key] = createValidator(
			Schema.props(props).toJSON(),
			ajv
		);
	}

	return cache[key];
}

function validateProps(data) {
	return (
		this
		.propsValidator(Object.keys(data))
		.validate(data)
	);
}

module.exports.ColumnValidationError = ColumnValidationError;