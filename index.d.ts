import {Sequelize, Model, DataTypes, DataType, ModelOptions} from "sequelize";
import Ajv, {ErrorObject, JSONType} from "ajv";
import {AjvSchema, Code, Params} from 'adv-parser';

declare function define(code: Code, options: DefineOptions): typeof ParsedModel;

export default define;

export function parser(code: Code, options: ParserOptions): ParsedData;

export interface DefineOptions extends ParserOptions {
    sequelize: Sequelize,
    ajv?: Ajv,
}

export interface ParserOptions extends Params {
    dataTypes?: typeof DataTypes,
    defaultJsonType?: DataType,
}

export class ParsedModel extends Model {
    public static Schema: SchemaGenerator;
    public static ajv: Ajv;
    public static propValidator(prop: string): Validator;
    public static propsValidator(prop: string | string[], ...props: string[]): Validator;
    public static validateProps(data: {[prop: string]: any}): boolean;
}

export interface ParsedData {
    name: string,
    columns: {[name: string]: AjvSchema},
    options: ModelOptions,
    schema: AjvSchema,
}

export interface Validator {
    errors: null | ErrorObject[],

    isValid(value: any): boolean,

    validate(value: any): boolean,
}

export class ColumnValidationError extends Error {
    name: "ColumnValidationError";
    errors: ErrorObject[];
}

export class SchemaGenerator {
    constructor(schema: JsonSchema);

    toJSON(): JsonSchema;
    set(prop: string, value: any): SchemaGenerator;
    get(prop: string): any;
    not(prop: string): SchemaGenerator;

    id(id: string): SchemaGenerator;
    ref(ref: string): SchemaGenerator;

    prop(name: string): SchemaGenerator;
    props: PropsMethod;
    pick: PropsMethod;
    add: AddMethod;
    merge: AddMethod;
    assign: AddMethod;
    extend: AddMethod;
    remove: PropsMethod;
    omit: PropsMethod;
    required: PropsMethod;
    notRequired: PropsMethod;
    optional: PropsMethod;
    additionalProperties: BooleanMethod;
    dependencies: SetMethod;
    dependentRequired: SetMethod;
    dependentSchemas: SetMethod;
    maxProperties: SetMethod;
    minProperties: SetMethod;
    patternProperties: SetMethod;
    propertyNames: SetMethod;
    unevaluatedProperties: BooleanOrSchemaMethod;

    minLength: NumberMethod;
    maxLength: NumberMethod;
    pattern: SetMethod<string>;
    format: SetMethod<string>;

    minimum: NumberMethod;
    maximum: NumberMethod;
    exclusiveMinimum: NumberMethod;
    exclusiveMaximum: NumberMethod;
    multipleOf: NumberMethod;

    items: SetMethod;
    minItems: NumberMethod;
    maxItems: NumberMethod;
    uniqueItems: BooleanMethod;
    additionalItems: BooleanOrSchemaMethod;
    contains: SchemaMethod;
    minContains: NumberMethod;
    maxContains: NumberMethod;
    unevaluatedItems: BooleanOrSchemaMethod;
}

type PropsMethod = (props: string | string[], ...rest: string[]) => SchemaGenerator;
type AddMethod = (properties: {[prop: string]: any}) => SchemaGenerator;
type SetMethod<T = any> = (value: T) => SchemaGenerator;
type BooleanMethod = (state?: boolean) => SchemaGenerator;
type BooleanOrSchemaMethod = (value?: boolean | JsonSchema) => SchemaGenerator;
type SchemaMethod = (schema: JsonSchema) => SchemaGenerator;
type NumberMethod = SetMethod<number>;

interface JsonSchema {
    type: JSONType | JSONType[],
    [prop: string]: any,
}