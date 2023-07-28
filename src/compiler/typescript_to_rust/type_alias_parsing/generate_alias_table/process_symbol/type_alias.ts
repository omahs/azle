import * as ts from 'typescript';
import {
    getSymbolTableForNode,
    getSymbolTableForEntityName,
    getSymbolTableForExpression
} from '../../utils/get_symbol_table';
import { isNullKeyword, isAzleKeywordExpression } from '../../utils';
import { generateForIdentifier } from '../process_symbol';
import {
    generateSingleEntryAliasTable,
    DEFAULT_ALIAS_TABLE
} from '../alias_table';
import { AliasTable, GenerationType } from '../../types';

/*
export type AzleIntAlias = azle.int;
In this case azle is in the current symbol table and int will be in the symbol table that azle represents
export type DeepIntAlias = deep.azle.int;
deep is in the current symbol table
azle is in deeps symbol table
and int is in azle's symbol table.

So the right is in the left's symbol table
regardless of if its a symbol table or not.
So if we are trying to get that symbol table.

To begin with I have the symbol table with the left most identifier
I have the right most identifier.
step 1, get all the way back to the identifier
step 2, get that symbol from the symbol table we have, look up the next one
*/

export function generateForTypeAliasDeclaration(
    typeAliasDeclaration: ts.TypeAliasDeclaration,
    alias: string,
    program: ts.Program,
    generationType: GenerationType
): AliasTable | null {
    if (isAzleKeywordExpression(typeAliasDeclaration)) {
        // Is this bit of code reachable? If the todo is in lowercase and hidden
        // in a longer comment will anyone call me out on it in the pr? I'm not
        // sure what the best way to test this out. It's not hurting anything to
        // have it in here.
        if (generationType === 'LIST') return DEFAULT_ALIAS_TABLE; // https://github.com/demergent-labs/azle/issues/1136
        return generateSingleEntryAliasTable(
            typeAliasDeclaration.name.text,
            alias
        );
    }

    const aliasedType = typeAliasDeclaration.type;
    if (ts.isTypeReferenceNode(aliasedType)) {
        if (generationType === 'TABLE') {
            const typeParams = (typeAliasDeclaration.typeParameters ?? []).map(
                (typeParam) => typeParam.name.text
            );
            const typeArguments = aliasedType.typeArguments ?? [];
            if (typeArguments.length !== typeParams.length) {
                return null;
            }
            const typeArgsAreGenerics = typeArguments.every((typeArgument) => {
                return (
                    ts.isTypeReferenceNode(typeArgument) &&
                    ts.isIdentifier(typeArgument.typeName) &&
                    typeParams.includes(typeArgument.typeName.text)
                );
            });
            if (!typeArgsAreGenerics) {
                return null;
            }
        }
        const symbolTable = getSymbolTableForNode(
            typeAliasDeclaration,
            program
        );
        if (symbolTable === undefined) {
            return null;
        }
        const typeName = aliasedType.typeName;
        if (ts.isIdentifier(typeName)) {
            return generateForIdentifier(
                typeName,
                alias,
                symbolTable,
                program,
                generationType
            );
        }
        if (ts.isQualifiedName(typeName)) {
            const declSymbolTable = getSymbolTableForEntityName(
                typeName.left,
                symbolTable,
                program
            );
            if (declSymbolTable === undefined) {
                return null;
            }
            return generateForIdentifier(
                typeName.right,
                alias,
                declSymbolTable,
                program,
                generationType
            );
        }
    }
    if (aliasedType.kind === ts.SyntaxKind.BooleanKeyword) {
        return generateSingleEntryAliasTable('bool', alias);
    }
    if (isNullKeyword(aliasedType)) {
        return generateSingleEntryAliasTable('null', alias);
    }
    if (aliasedType.kind === ts.SyntaxKind.StringKeyword) {
        return generateSingleEntryAliasTable('text', alias);
    }
    if (aliasedType.kind === ts.SyntaxKind.BigIntKeyword) {
        return generateSingleEntryAliasTable('int', alias);
    }
    if (aliasedType.kind === ts.SyntaxKind.NumberKeyword) {
        return generateSingleEntryAliasTable('float64', alias);
    }
    if (aliasedType.kind === ts.SyntaxKind.VoidKeyword) {
        return generateSingleEntryAliasTable('void', alias);
    }
    if (
        aliasedType.kind === ts.SyntaxKind.FunctionType ||
        aliasedType.kind === ts.SyntaxKind.UnionType
    ) {
        // We do not yet have azle types that map to these types
        return null;
    }
    // The type is something we hadn't planned on
    return null;
}

export function generateForVariableDeclaration(
    variableDeclaration: ts.VariableDeclaration,
    alias: string,
    program: ts.Program,
    generationType: GenerationType
): AliasTable | null {
    if (isAzleKeywordExpression(variableDeclaration)) {
        // I'm not sure this is possible. Isn't the only way we could run into
        // this is when parsing the actual azle file? Otherwise it's always
        // going to come from an import declaration not a variable declaration
        if (generationType === 'LIST') return DEFAULT_ALIAS_TABLE; //TODO https://github.com/demergent-labs/azle/issues/1136
        return generateSingleEntryAliasTable(
            variableDeclaration.name.getText(),
            alias
        );
    }

    const expression = variableDeclaration.initializer;
    if (expression === undefined) {
        return null;
    }

    const symbolTable = getSymbolTableForNode(expression, program);
    if (symbolTable === undefined) {
        return null;
    }

    if (ts.isIdentifier(expression)) {
        return generateForIdentifier(
            expression,
            alias,
            symbolTable,
            program,
            generationType
        );
    }
    if (ts.isPropertyAccessExpression(expression)) {
        // follow all of the property access expression to the very bottom
        const declSymbolTable = getSymbolTableForExpression(
            expression.expression,
            symbolTable,
            program
        );
        if (declSymbolTable === undefined) {
            return null;
        }
        return generateForIdentifier(
            expression.name,
            alias,
            declSymbolTable,
            program,
            generationType
        );
    }
    if (ts.isStringLiteral(expression) || ts.isNewExpression(expression)) {
        // We do not yet have azle types that map to these types
        return null;
    }
    // The expression is something we haven't planned on
    return null;
}
