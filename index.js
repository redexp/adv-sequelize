const parser = require('./parser');

module.exports = function define(code, {sequelize: s, schemas, ajv, ...params} = {}) {
	var DataTypes = s.DataTypes || s.Sequelize.DataTypes;

	var {name, columns, options, schema} = parser(code, {
		schemas,
		dataTypes: DataTypes,
		defaultJsonType: s.options.dialect === 'postgres' ? DataTypes.JSONB : DataTypes.JSON,
		...params,
	});

	if (!ajv) {
		let Ajv = require('ajv');
		Ajv = typeof Ajv.default === 'function' ? Ajv.default : Ajv;
		ajv = new Ajv();

		var hasFormats = false;

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

	Object.keys(columns).forEach(function (name) {
		const column = columns[name];
		const columnSchema = schema.properties[name];
		const validator = ajv.compile(columnSchema);

		column.validate = column.validate || {};

		column.validate.adv = function (value) {
			if (!validator(value)) {
				throw createError(validator.errors);
			}
		};
	});

	const Model = s.define(name, columns, options);

	Model.prop = function (prop) {
		if (!prop) {
			throw new Error(`${Model.name}.prop required one argument`);
		}

		const key = `_${prop}PropValidator`;

		if (Model[key]) return Model[key];

		const sch = schema.properties[prop];

		if (!sch) {
			throw new Error(`Unknown ${Model.name} column ${JSON.stringify(prop)}`);
		}

		return (Model[key] = createValidator(sch, ajv));
	};

	Model.props = function (...props) {
		if (props.length === 0) {
			throw new Error(`${Model.name}.props required at least one argument`);
		}

		const key = `_${props.join('_')}PropsValidator`;

		if (Model[key]) return Model[key];

		const sch = {
			type: 'object',
			additionalProperties: false,
			required: props,
			properties: {},
		};

		props.forEach(prop => {
			sch.properties[prop] = schema.properties[prop];

			if (!sch.properties[prop]) {
				throw new Error(`Unknown ${Model.name} column ${JSON.stringify(prop)}`);
			}
		});

		return (Model[key] = createValidator(sch, ajv));
	};

	return Model;
};

class ColumnValidationError extends Error {
	constructor(message, errors) {
		super(message);

		this.name = "ColumnValidationError";
		this.errors = errors;
	}
}

function createError(errors) {
	return new ColumnValidationError(errors.map(e => e.message).join('; '), errors);
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

module.exports.ColumnValidationError = ColumnValidationError;