export declare let _variableSet: Map<string, string | number | undefined>;
export declare function resetVariableSet(): void;
export declare function getDeepValue(varName: string | number): {
    type: "string" | "number" | "variable";
    value: string;
};
export declare function tokenize(input: string): string[];
export declare function evaluateExpression(expression: string): any;
export declare function validValue(value: any): boolean;
export declare function validateOperand(value: string): boolean;
export declare function operandType(value: string): "string" | "number" | "variable";
export declare function validateVariableName(variableName: string): void;
export declare function isValidString(input: string): boolean;
export declare function isOperator(token: string): boolean;
export declare function isNumber(token: string): boolean;
export declare function isVariable(token: string): boolean;
