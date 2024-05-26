export let _variableSet: Map<string, string | number | undefined> = new Map();

export function resetVariableSet() {
    _variableSet = new Map();
}

export function getDeepValue(varName: string | number): { type: "string" | "number" | "variable", value: string} {

    varName = varName.toString().trim();
    const type = operandType(varName);
    if (type === "variable") {
        const val = getDeepValue(_variableSet.get(varName) as string);
        return { type: val.type, value: val.value };
    }
    return { type: type, value: varName };
}

const keywordsControl = {
    "jodi": true,
    "nahole": true,
    "nahole jodi": true,
    "huh": true,
}

const keywordBoolean = {
    "hoy": true,
    "na": true,
    "and": true,
    "or": true,
    "er": true,
    "theke": true,
    "kom": true,
    "beshi": true,
    "soman": true,
}


const keywordsLoop = {
    "bar": true
}

const keywords: { [key: string]: boolean } = {
    ...keywordsControl,
    ...keywordsLoop,
    ...keywordBoolean
};

function replaceVariables(expression: string, variableSet: Map<string, string | number | undefined>) {
    // Loop through each variable in the map
    variableSet.forEach((value, key) => {
        // Create a regular expression to match the variable name
        //escape strings quotes for expression
        //expression = expression.replace(/['"]+/g, '\\$&');
        const regex = new RegExp('\\b' + key + '\\b', 'g');
       
        // Replace all occurrences of the variable name with its value in the expression
        expression = expression.replace(regex, value !== undefined ? value.toString() : '');
       
    });
    return expression;
}

export function tokenize(input: string) {
    //split the input into tokens
    const tokens = input.split(/(\+|-|\*|\/)/g)
    .map(token => token?.trim())
    .filter(token => token?.length > 0);
    return tokens;
}

export function evaluateExpression(expression: string) {

    try {

        //split the expression into tokens
        let tokens = tokenize(expression);



        if (tokens.length > 0 && isOperator(tokens[tokens.length - 1])) {
            throw new Error('Extra operator at the end of the expression|' + tokens[tokens.length - 1]);
        }

        if (tokens.length > 0 && isOperator(tokens[0])) {
            if (tokens[0] != '-'){
                throw new Error('Invalid operator at the beginning of the expression|' + tokens[0]);
            }
            return true;
        }

        //cannot use operator for strings like, "Hello" + "World", or "Hello" - "World" or a + "Hello" or a + b if a or b are strings
        
        for (let i = 0; i < (tokens.length == 1 ? tokens.length : tokens.length - 1); i++) {
            if (isOperator(tokens[i]) && isOperator(tokens[i + 1])) {
                if (tokens[i + 1] != '-'){
                    throw new Error(`${tokens[i]} er pore abar ${tokens[i + 1]} likhso kno?🤨|${tokens[i+1]}`);
                }
            }else if (isVariable(tokens[i])) {



                const variables = tokens[i].split(/\s+/g);

                if (variables.length > 1){
                    throw new Error(`Unexpected token '${variables[1]}' found after '${variables[0]}'🤨|${variables[1]}`);
                }


                validateVariableName(tokens[i]);
            }

            if (!isOperator(tokens[i])){
                const {type, value} = getDeepValue(tokens[i]);
                if (!value){
                    throw new Error(`Variable '${tokens[i]}'  declare korso?😑|${tokens[i]}`);
                }
    


    
                if (type == "string" && isOperator(tokens[i + 1]) && tokens[i + 1] != '+'){
                    throw new Error(`Only '+' operator is allowd to contate strings🤨|${tokens[i+1]}`);
                }
            }            

        }

        // If all validations pass, the expression is valid
        // Replace all variables in the expression with their values
       
        expression = replaceVariables(expression, _variableSet);


       
        // Evaluate the expression
        const value = eval('`' + expression + '`');
       
        return value;
    } catch (e: any) {
        // If an error occurs during evaluation, return false
        throw new Error(e.message);
    }
}

export function validValue(value: any) {
    return !!(value + 1)
}

export function validateOperand(value: string) {
   
    value = value?.trim();
    try {
        return !!operandType(value || '');
    } catch (e: any) {
        throw new Error(e.message);
    }
}

export function operandType(value: string) {
    try {
        //returns "string", "number", "variable"

        value = value.trim();
        if (/["']/.test(value)) {
            if (isValidString(value) === false) {
                //remove starting or trailing " or '
                const token = value.replace(/^(["'])|(["'])$/g, "");
                throw new Error(`Dhur jaan!😑 Strings similar quotation e rakha lage jano na?. "${token}" or '${token}' eivabe.|${value}`);
            }
            return "string";
        } else if (/^(-)?[0-9]+(\.[0-9]+)?$/.test(value)) { // Updated regex to include floats
            return "number";
        } else {
            return "variable";
        }
    } catch (e: any) {
        throw new Error(e.message);
    }
}

export function validateVariableName(variableName: string) {
    try {
        //A variable name must start with a letter, underscore sign. Subsequent characters can also be digits (0-9).
        if (!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(variableName)) {
            throw new Error(`Arey jaan😑! Variable name letter, underscore diye likha jay. '${variableName}' abar ki?|${variableName}`);
        }
        //check if variable name is a reserved keyword
        if (keywords[variableName]) {
            throw new Error(`Arey jaan😑! '${variableName}' to reserved keyword. Eita variable er nam dite parba nah.|${variableName}`);
        }
    } catch (e: any) {
        //throw new Error(e.message);
        throw new Error(e.message);
    }
}

export function isValidString(input: string) {
    try {
        //strings must be enclosed in single or double quotes. i.e. "string" or 'string' or "string's" or 'string"s' or 'Hello' + "World"
        //use stack method to check if the string is valid
        const stack: (string | string[])[] = [];
        for (let i = 0; i < input.length; i++) {
            if (input[i] === '"' || input[i] === "'") {
                if (stack.length > 0 && stack[stack.length - 1] === input[i]) {
                    stack.pop();
                } else {
                    stack.push(input[i]);
                }
            }
        }

        if (stack.length != 0){
            throw new Error("Invalid string pairs🤕|"+input);
        }

        //check for validation of string
        //put all strings in a stack
        const stringsStack: string[] = new Array();
        const regex = /(['].*?['])|(["].*?["])/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(input)) !== null) {
            if (match[1]) {
                stringsStack.push(match[1]);
            } else if (match[2]) {
                stringsStack.push(match[2]);
            }
        }

        const remainingValue = input.replace(regex, "");

        const remainingTokens = tokenize(remainingValue);



        if (stringsStack.length === 0) {
            throw new Error("Invalid string format😬|"+input);
        }

        for (let i = 0; i < remainingTokens.length; i++) {
            if (isOperator(remainingTokens[i])) {
                throw new Error("Unexpected operator found in string🤕. Maybe you forgot to contate with a '+'😐|"+remainingTokens[i]);
            }

            if (isNumber(remainingTokens[i])) {
                throw new Error("Unexpected number found in string.🤕. Maybe you forgot to contate with a '+'😐|"+remainingTokens[i]);
            }

            if (isVariable(remainingTokens[i])) {
                throw new Error("Unexpected variable found in string🤕. Maybe you forgot to contate with a '+'😐|"+remainingTokens[i]);
            }

            if (remainingTokens[i].trim()) {
                throw new Error("Invalid token found in string🤕|"+remainingTokens[i]);
            }
        }

        if (stringsStack.length > 1){
            throw new Error("Jaan! Expected only one string🤕. Maybe you forgot to contate with a '+'😐|"+input);
        }


        return stack.length === 0;
    } catch (e: any) {
        throw new Error(e.message);
    }
}

export function isOperator(token: string) {
    return token === '+' || token === '-' || token === '*' || token === '/';
}

export function isNumber(token: string) {
    //can be a.b or a but not .b or a..b or a.b.
    return /^[0-9]+(\.[0-9]+)?$/.test(token);
}

export function isVariable(token: string) {
    if (!token) {
        return false;
    }
   
    const type = operandType(token);
   
    if (type === "variable") {
        if (isOperator(token) || isNumber(token)) {
            return false;
        }
        return true;
    } 
    return false;
}
