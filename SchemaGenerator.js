const cloneDeep = require('lodash.clonedeep');

class SchemaGenerator {
	constructor(schema) {
		this.schema = cloneDeep(schema);
	}

	toJSON() {
		return this.schema;
	}

	set(prop, value) {
		const gen = new SchemaGenerator(this.schema);

		gen.schema[prop] = value;

		return gen;
	}

	get(prop) {
		return this.schema[prop];
	}

	not(value) {
		return this.set('not', value);
	}

	id(value) {
		return this.set('$id', value);
	}

	ref(value) {
		return this.set('$ref', value);
	}

	//region "object"

	prop(name) {
		if (!name) {
			throw new Error(`method "prop" required argument "name"`);
		}

		const schema = this.schema.properties[name];

		if (!schema) {
			throw new Error(`Undefined property ${JSON.stringify(name)}`);
		}

		return new SchemaGenerator(schema);
	}

	props(...props) {
		props = toProps(props, 'props');

		const schema = {
			type: 'object',
			additionalProperties: false,
			required: props,
			properties: {},
		};

		for (const prop of props) {
			schema.properties[prop] = this.schema.properties[prop];

			if (!schema.properties[prop]) {
				throw new Error(`Undefined property ${JSON.stringify(prop)}`);
			}
		}

		return new SchemaGenerator(schema);
	}

	pick(...props) {
		return this.props(props);
	}

	add(properties) {
		const gen = new SchemaGenerator(this.schema);
		const {schema} = gen;

		Object.assign(schema.properties, cloneDeep(properties));

		return gen;
	}

	merge(properties) {
		return this.add(properties);
	}

	assign(properties) {
		return this.add(properties);
	}

	extend(properties) {
		return this.add(properties);
	}

	remove(...props) {
		props = toProps(props, 'remove');

		const gen = new SchemaGenerator(this.schema);
		const {required, properties} = gen.schema;

		for (const prop of props) {
			const index = required.indexOf(prop);

			if (index > -1) {
				required.splice(index, 1);
			}

			if (properties.hasOwnProperty(prop)) {
				delete properties[prop];
			}
		}

		return gen;
	}

	omit(...props) {
		return this.remove(toProps(props, 'omit'));
	}

	required(...props) {
		const gen = new SchemaGenerator(this.schema);
		const {schema} = gen;
		const {required, properties} = schema;

		for (const prop of toArray(props)) {
			if (!properties.hasOwnProperty(prop)) {
				throw new Error(`Undefined schema property ${JSON.stringify(prop)}`);
			}
		}

		if (Array.isArray(props[0])) {
			schema.required = props[0];
		}
		else {
			for (const prop of props) {
				if (required.includes(prop)) continue;

				required.push(prop);
			}
		}

		return gen;
	}

	notRequired(...props) {
		props = toProps(props, 'notRequired');

		const gen = new SchemaGenerator(this.schema);
		const {schema} = gen;

		schema.required = schema.required.filter(name => !props.includes(name));

		return gen;
	}

	optional(...props) {
		return this.notRequired(toProps(props, 'optional'));
	}

	additionalProperties(state = true) {
		return this.set('additionalProperties', state);
	}

	dependencies(value) {
		return this.set('dependencies', value);
	}

	dependentRequired(value) {
		return this.set('dependentRequired', value);
	}

	dependentSchemas(value) {
		return this.set('dependentSchemas', value);
	}

	maxProperties(value) {
		return this.set('maxProperties', value);
	}

	minProperties(value) {
		return this.set('minProperties', value);
	}

	patternProperties(value) {
		return this.set('patternProperties', value);
	}

	propertyNames(value) {
		return this.set('propertyNames', value);
	}

	unevaluatedProperties(value = true) {
		return this.set('unevaluatedProperties', value);
	}

	//endregion

	//region "string"

	minLength(value) {
		return this.set('minLength', value);
	}

	maxLength(value) {
		return this.set('maxLength', value);
	}

	pattern(value) {
		return this.set('pattern', value);
	}

	format(value) {
		return this.set('format', value);
	}

	//endregion

	//region "number"

	minimum(value) {
		return this.set('minimum', value);
	}

	maximum(value) {
		return this.set('maximum', value);
	}

	exclusiveMinimum(value) {
		return this.set('exclusiveMinimum', value);
	}

	exclusiveMaximum(value) {
		return this.set('exclusiveMaximum', value);
	}

	multipleOf(value) {
		return this.set('multipleOf', value);
	}

	//endregion

	//region "array"

	items(value) {
		return this.set('items', value);
	}

	minItems(value) {
		return this.set('minItems', value);
	}

	maxItems(value) {
		return this.set('maxItems', value);
	}

	uniqueItems(value = true) {
		return this.set('uniqueItems', value);
	}

	additionalItems(value = true) {
		return this.set('additionalItems', value);
	}

	contains(value) {
		return this.set('contains', value);
	}

	minContains(value) {
		return this.set('minContains', value);
	}

	maxContains(value) {
		return this.set('maxContains', value);
	}

	unevaluatedItems(value = true) {
		return this.set('unevaluatedItems', value);
	}

	//endregion
}

module.exports = SchemaGenerator;

function toProps(props, method) {
	if (props.length === 0) {
		throw new Error(`method ${JSON.stringify(method)} required at least one argument`);
	}

	props = toArray(props);

	return props;
}

function toArray(props) {
	if (Array.isArray(props[0])) {
		props = props[0];
	}

	return props;
}
