const {expect} = require('chai');
const defaultSchemas = require('adv-parser/schemas');
const modelSchemas = require('../schemas');
const omit = require('lodash.omit');
const {DataTypes: D} = require('sequelize');

describe('createModel', function () {
	const parser = require('../parser');
	const define = require('../index');
	const Sequelize = require('sequelize');
	const sequelize = new Sequelize({dialect: 'postgres'});

	var schemas = {};

	const p = function (code) {
		return parser(code, {
			schemas,
			dataTypes: D,
			defaultJsonType: D.JSONB,
		});
	};

	beforeEach(function () {
		schemas = {...defaultSchemas, ...modelSchemas};
	});

	it('parser', function () {
		var Friend = p(`Friend = {name: string}`);

		var {name, columns, options, schema} = p(`
		# User desc
		User = {
			id: id.primaryKey(),
			uuid: uuid.defaultValue(UUIDV4),
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
				...JSON,
				...Friend,
			},
			bestFriend: JSON.extend(Friend),
			friends: [Friend].type(JSON),
			typed: !!{
				type: 'string',
				minLength: 1,
				
				dataType: INTEGER,
				autoIncrement: true,
			},
			enumInt: 1 || 2,
			enumStr: 'a' || 'b',
			andObj: Friend && !!{type: 'object'},
			orInt: id || !!{type: 'integer'},
			orStr: string || uuid,
			created_at: DATE.format('date-time'),
			
			$maxProperties: 10,
			$freezeTableName: true,
			$tableName: 'user',
		}`);

		expect(name).to.eql('User');

		expect(columns).to.eql({
			id: {
				type: D.INTEGER,
				primaryKey: true,
				allowNull: false,
			},
			uuid: {
				type: D.STRING,
				allowNull: false,
				defaultValue: D.UUIDV4,
			},
			name: {
				type: D.STRING(10),
				allowNull: true,
				comment: 'Name desc',
			},
			age: {
				type: D.INTEGER,
				allowNull: false,
			},
			data: {
				type: D.JSONB,
				allowNull: false,
			},
			friend: {
				type: D.JSON,
				allowNull: false,
			},
			bestFriend: {
				type: D.JSON,
				allowNull: false,
			},
			friends: {
				type: D.JSON,
				allowNull: false,
				defaultValue: [],
			},
			typed: {
				type: D.INTEGER,
				autoIncrement: true,
				allowNull: false,
			},
			enumInt: {
				type: D.ENUM,
				values: [1, 2],
				allowNull: false,
			},
			enumStr: {
				type: D.ENUM,
				values: ['a', 'b'],
				allowNull: false,
			},
			andObj: {
				type: D.JSONB,
				allowNull: false,
			},
			orInt: {
				type: D.INTEGER,
				allowNull: false,
			},
			orStr: {
				type: D.STRING,
				allowNull: false,
			},
			created_at: {
				type: D.DATE,
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
			required: ['id', 'uuid', 'name', 'data', 'friend', 'bestFriend', 'friends', 'typed', 'enumInt', 'enumStr', 'andObj', 'orInt', 'orStr', 'created_at'],
			properties: {
				id: {type: 'integer', minimum: 1},
				uuid: {type: 'string', format: 'uuid'},
				name: {
					anyOf: [
						{
							description: 'Name desc',
							type: 'string',
							minLength: 2,
							maxLength: 10
						},
						{type: 'null'},
					]
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
				bestFriend: omit(Friend.schema, 'title'),
				friends: {
					type: 'array',
					items: Friend.schema,
				},
				typed: {
					type: 'string',
					minLength: 1,
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

		const advParser = require('adv-parser');

		var subSchema = advParser(`User.props('id')`, {schemas});

		expect(subSchema).to.eql({
			type: 'object',
			additionalProperties: false,
			required: ['id'],
			properties: {
				id: {type: 'integer', minimum: 1},
			},
			maxProperties: 10,
		});
	});

	it('data types', function () {
		var {columns, schema} = p(`User = {
			test1: STRING,
			test2: STRING(10).format('email'),
			test3: STRING.BINARY().format('email'),
			test4: TEXT('tiny'),
			test5: FLOAT(11, 10),
			test6: INTEGER.UNSIGNED().ZEROFILL().minimum(1),
			test61: INTEGER(10).UNSIGNED().ZEROFILL().maximum(10),
			test7: RANGE(INTEGER),
			test8: GEOMETRY('POINT', 4326),
			test9: ARRAY(INTEGER(5)),
		}`);

		expect(columns).to.eql({
			test1: {
				type: D.STRING,
				allowNull: false,
			},
			test2: {
				type: D.STRING(10),
				allowNull: false,
			},
			test3: {
				type: D.STRING.BINARY,
				allowNull: false,
			},
			test4: {
				type: D.TEXT('tiny'),
				allowNull: false,
			},
			test5: {
				type: D.FLOAT(11, 10),
				allowNull: false,
			},
			test6: {
				type: D.INTEGER.UNSIGNED.ZEROFILL,
				allowNull: false,
			},
			test61: {
				type: D.INTEGER(10).UNSIGNED.ZEROFILL,
				allowNull: false,
			},
			test7: {
				type: D.RANGE(D.INTEGER),
				allowNull: false,
			},
			test8: {
				type: D.GEOMETRY('POINT', 4326),
				allowNull: false,
			},
			test9: {
				type: D.ARRAY(D.INTEGER(5)),
				allowNull: false,
			},
		});

		expect(schema).to.eql({
			title: 'User',
			type: 'object',
			additionalProperties: false,
			required: ['test1','test2','test3','test4','test5','test6','test61','test7','test8','test9'],
			properties: {
				test1: {type: 'string', title: 'STRING'},
				test2: {type: 'string', format: 'email'},
				test3: {type: 'string', format: 'email'},
				test4: {type: 'string'},
				test5: {type: 'number'},
				test6: {type: 'integer', minimum: 1},
				test61: {type: 'integer', maximum: 10},
				test7: {type: 'array'},
				test8: {type: 'string'},
				test9: {type: 'array'},
			}
		});
	});

	it('define', function (done) {
		const User = define(`User = {date: DATE, name: STRING.minLength(3)}`, {sequelize});
		var user = new User();
		user.date = new Date();
		user.name = 'a';

		user
			.save()
			.then(function () {
				done(new Error('Should throw error'));
			}, function (err) {
				try {
					expect(err).to.be.instanceOf(Sequelize.ValidationError);
					expect(err.message).to.eql(`Validation error: user.name must NOT have fewer than 3 characters`);
				}
				catch (e) {
					done(e);
					return;
				}

				done();
			})
	});

	it('Model methods', function () {
		const Model = define(`User = {id: id.primaryKey(true), name: string.minLength(3), age: number}`, {sequelize});

		var v = Model.prop('id');

		expect(Model).to.have.property('_idPropValidator').and.to.be.an('object');
		expect(Model.prop('id')).to.equal(v);
		expect(v.isValid(0)).to.eql(false);
		expect(v.errors).to.be.an('array').and.to.have.length(1);
		expect(v.isValid(1)).to.eql(true);

		expect(() => v.validate(0)).to.throw(define.ColumnValidationError, 'must be >= 1');
		expect(() => v.validate(1)).to.not.throw(define.ColumnValidationError, 'must be >= 1');

		v = Model.props('name', 'age');

		expect(Model).to.have.property('_name_agePropsValidator').and.to.be.an('object');
		expect(Model.props('name', 'age')).to.equal(v);
		expect(v.isValid({name: '', age: 0})).to.eql(false);
		expect(v.errors).to.be.an('array').and.to.have.length(1);
		expect(v.isValid({name: 'asd', age: 0})).to.eql(true);
		expect(v.isValid({name: 'asd'})).to.eql(false);
	});

	it('default array', function () {
		const {columns, schema} = p(`User = {
			test1: [number],
			test2: [number].defaultValue([1]),
			test3: [number].allowNull(true),
			test4: ARRAY(INTEGER),
		}`);

		expect(columns).to.eql({
			test1: {
				type: D.JSONB,
				allowNull: false,
				defaultValue: [],
			},
			test2: {
				type: D.JSONB,
				allowNull: false,
				defaultValue: [1],
			},
			test3: {
				type: D.JSONB,
				allowNull: true,
			},
			test4: {
				type: D.ARRAY(D.INTEGER),
				allowNull: false,
			},
		});

		expect(schema).to.eql({
			title: 'User',
			type: 'object',
			additionalProperties: false,
			required: ['test1', 'test2', 'test3', 'test4'],
			properties: {
				test1: {
					type: 'array',
					items: {type: 'number'},
				},
				test2: {
					type: 'array',
					items: {type: 'number'},
				},
				test3: {
					anyOf: [
						{
							type: 'array',
							items: {type: 'number'},
						},
						{type: 'null'},
					]
				},
				test4: {
					type: 'array',
				},
			}
		});
	});

	it('nullable', function () {
		const {columns, schema} = p(`User = {
			test1: string || null,
			test2: (string || null).defaultValue(null),
			test3: {field: number}.allowNull(true),
			[test4]: {
				field: number,
				
				$allowNull: true
			},
		}`);

		expect(columns).to.eql({
			test1: {
				type: D.STRING,
				allowNull: true,
			},
			test2: {
				type: D.STRING,
				allowNull: true,
				defaultValue: null,
			},
			test3: {
				type: D.JSONB,
				allowNull: true,
			},
			test4: {
				type: D.JSONB,
				allowNull: true,
			},
		});

		expect(schema).to.eql({
			title: 'User',
			type: 'object',
			additionalProperties: false,
			required: ['test1', 'test2', 'test3'],
			properties: {
				test1: {
					anyOf: [
						{type: 'string'},
						{type: 'null'},
					]
				},
				test2: {
					anyOf: [
						{type: 'string'},
						{type: 'null'},
					]
				},
				test3: {
					anyOf: [
						{
							type: 'object',
							additionalProperties: false,
							required: ['field'],
							properties: {
								field: {type: 'number'}
							}
						},
						{type: 'null'},
					]
				},
				test4: {
					anyOf: [
						{
							type: 'object',
							additionalProperties: false,
							required: ['field'],
							properties: {
								field: {type: 'number'}
							}
						},
						{type: 'null'},
					]
				},
			}
		});
	});
});