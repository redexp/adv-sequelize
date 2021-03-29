# adv-sequelize

[![Build Status](https://travis-ci.com/redexp/adv-sequelize.svg?branch=master)](https://travis-ci.com/redexp/adv-sequelize)

Create sequelize models with adv syntax

## Usage

```js
const createModel = require('adv-sequelize');
const Sequelize = require('sequelize');
const sequalize = new Sequelize();
const Types = sequalize.DataTypes;
const Ajv = require('ajv').default;
const ajv = new Ajv();
const define = function (code) {
    return createModel(code, {
        sequalize,
        ajv,
        defaultJsonType: Types.JSONB,
    });
};

const Users = define(`Users = {
    type: 'admin' || 'manager' || 'agent'
    name: string.minLength(3),
    email: {
        type: 'string',
        format: 'email',
        
        $unique: true,
    },
    [age]: positive,
    data: {
        option: string,
        
        $defaultValue: {option: 'value'},
    },
    created_at: DATE.format('date-time'),
    
    $paranoid: true,
    $freezeTableName: true,
}`);

Users == sequalize.define('Users', {
    type: {
        type: Types.ENUM,
        values: ['admin', 'manager', 'agent'],
        notNull: true,
        validate: {
            adv: value => ajv.validate(value, {
                type: 'string',
                enum: ['admin', 'manager', 'agent'],
            })
        }
    },
    name: {
        type: Types.STRING,
        notNull: true,
        validate: {
            adv: value => ajv.validate(value, {
                type: 'string',
                minLength: 3,
            })
        }
    },
    email: {
        type: Types.STRING,
        notNull: true,
        unique: true,
        validate: {
            adv: value => ajv.validate(value, {
                type: 'string',
                format: 'email',
            })
        }
    },
    age: {
        type: Types.INTEGER,
        notNull: false,
        validate: {
            adv: value => ajv.validate(value, {
                type: 'number',
                minimum: 0,
            })
        }
    },
    data: {
        type: Types.JSONB,
        notNull: true,
        defaultValue: {option: 'value'},
        validate: {
            adv: value => ajv.validate(value, {
                type: 'object',
                additionalProperties: false,
                required: ['option'],
                properties: {
                    option: {type: 'string'}
                }
            })
        }
    },
    created_at: {
        type: Types.DATE,
        notNull: true,
        validate: {
            adv: value => ajv.validate(value, {
                type: 'string',
                format: 'date-time',
            })
        }
    },
}, {
    paranoid: true,
    freezeTableName: true,
});
```
