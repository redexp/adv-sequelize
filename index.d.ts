import {Sequelize, Model, DataTypes, DataType, ModelOptions} from "sequelize";
import Ajv, {ErrorObject} from "ajv";
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
    public static prop(prop: string): Validator;
    public static props(prop: string | string[], ...props: string[]): Validator;
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