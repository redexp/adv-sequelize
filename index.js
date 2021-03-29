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
		var Ajv = require('ajv');
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

		Ajv = typeof Ajv.default === 'function' ? Ajv.default : Ajv;

		ajv = new Ajv();
	}

	Object.keys(columns).forEach(function (name) {
		var column = columns[name];
		var columnSchema = schema.properties[name];
		var validator = ajv.compile(columnSchema);

		column.validate = column.validate || {};

		column.validate.adv = function (value) {
			if (!validator(value)) {
				var {errors} = validator;
				throw new ColumnValidationError(errors.map(e => e.message).join('; '), errors);
			}
		};
	});

	return s.define(name, columns, options);
};

class ColumnValidationError extends Error {
	constructor(message, errors) {
		super(message);

		this.name = "ColumnValidationError";
		this.errors = errors;
	}
}

module.exports.ColumnValidationError = ColumnValidationError;