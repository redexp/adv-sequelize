require('chai').use(require('chai-shallow-deep-equal'));
const {expect} = require('chai');
const defaultSchemas = require('adv-parser/schemas');
const modelSchemas = require('../schemas');
const omit = require('lodash.omit');

describe('createModel', function () {
	const parser = require('../parser');
	const schemas = {...defaultSchemas, ...modelSchemas};
	const dataTypes = {
		STRING: '%STRING%',
		INTEGER: '%INTEGER%',
		BOOLEAN: '%BOOLEAN%',
		JSON: '%JSON%',
		JSONB: '%JSONB%',
		ENUM: '%ENUM%',
		DATE: '%DATE%',
	};

	const p = function (code) {
		return parser(code, {
			schemas,
			dataTypes,
			defaultJsonType: dataTypes.JSONB,
		});
	};

	it('parser', function () {
		var Friend = p(`Friend = {name: string}`);

		var {name, columns, options, schema} = p(`
		# User desc
		User = {
			id: id.primaryKey(),
			# Name desc
			name: (
				string
				.minLength(2)
				.maxLength(10)
				.allowNull()
			),
			[age]: positive,
			data: {
				value1: string,
				value2: /^\\d+$/,
			},
			friend: {
				...Friend,
				
				$type: "JSON",
			},
			friends: [Friend].type("JSON"),
			enumInt: 1 || 2,
			enumStr: 'a' || 'b',
			andObj: Friend && {type: 'object'},
			orInt: id || {type: 'integer'},
			orStr: string || uuid,
			created_at: DATE.format('date-time'),
			
			$maxProperties: 10,
			$freezeTableName: true,
			$tableName: 'user',
		}`);

		expect(name).to.eql('User');

		expect(columns).to.eql({
			id: {
				type: '%INTEGER%',
				primaryKey: true,
				allowNull: false,
			},
			name: {
				type: '%STRING%',
				allowNull: true,
				comment: 'Name desc',
			},
			age: {
				type: '%INTEGER%',
				allowNull: true,
			},
			data: {
				type: '%JSONB%',
				allowNull: false,
			},
			friend: {
				type: '%JSON%',
				allowNull: false,
			},
			friends: {
				type: '%JSON%',
				allowNull: false,
			},
			enumInt: {
				type: '%ENUM%',
				values: [1, 2],
				allowNull: false,
			},
			enumStr: {
				type: '%ENUM%',
				values: ['a', 'b'],
				allowNull: false,
			},
			andObj: {
				type: '%JSONB%',
				allowNull: false,
			},
			orInt: {
				type: '%INTEGER%',
				allowNull: false,
			},
			orStr: {
				type: '%STRING%',
				allowNull: false,
			},
			created_at: {
				type: '%DATE%',
				allowNull: false,
			},
		});

		expect(options).to.eql({
			comment: 'User desc',
			freezeTableName: true,
			tableName: 'user',
		});

		expect(Friend.schema).to.eql({
			title: 'Friend',
			type: 'object',
			additionalProperties: false,
			required: ['name'],
			properties: {
				name: {type: "string"},
			}
		});

		expect(schema).to.eql({
			title: 'User',
			description: 'User desc',
			type: 'object',
			additionalProperties: false,
			maxProperties: 10,
			required: ['id', 'name', 'data', 'friend', 'friends', 'enumInt', 'enumStr', 'andObj', 'orInt', 'orStr', 'created_at'],
			properties: {
				id: {type: 'integer', minimum: 1},
				name: {
					description: 'Name desc',
					type: 'string', minLength: 2, maxLength: 10
				},
				age: {type: 'number', minimum: 0},
				data: {
					type: 'object',
					additionalProperties: false,
					required: ['value1', 'value2'],
					properties: {
						value1: {type: "string"},
						value2: {type: "string", pattern: "^\\d+$"},
					}
				},
				friend: omit(Friend.schema, 'title'),
				friends: {
					type: 'array',
					items: Friend.schema,
				},
				enumInt: {
					type: 'number',
					enum: [1, 2],
				},
				enumStr: {
					type: 'string',
					enum: ['a', 'b'],
				},
				andObj: {
					allOf: [
						Friend.schema,
						{type: 'object'},
					]
				},
				orInt: {
					anyOf: [
						{type: 'integer', minimum: 1},
						{type: 'integer'},
					]
				},
				orStr: {
					anyOf: [
						{type: 'string'},
						{type: 'string', format: 'uuid'},
					]
				},
				created_at: {type: 'string', format: 'date-time'},
			}
		});
	});
});