import chalk from 'chalk';

import { _variableSet, evaluateExpression, operandType, resetVariableSet, validValue, validateOperand, validateVariableName } from './utils.js';

export const log = console.log;

let sleepUsed: boolean = false;

const sleepCode = `
async function _jaanLangSleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}`;

let lines: string[] = [];

const testCode = `hi jaan

#declare a variable
dhoro tmrCG holo 3.2
dhoro amrCG holo 3.8


#check if tmrCG is greater than amrCG
amrCG jodi tmrCG er beshi hoy tahole
    bolo "I love you"
nahole
    bolo "Breakup!!"
huh

#say sorry 5 times. '$' is a counter variable
5 bar
    bolo "Sorry " + $
huh


bye jaan`;

type BlockType = "jodi" | "nahole jodi" | "nahole" | `${number} bar`;
let startBlockStack: Array<{ blockname: BlockType, line: number }> = [];
let endBlockStack: Array<{ blockname: BlockType, line: number }> = [];

function startup(code: string, terminal: boolean) {
    _variableSet.clear();
    resetVariableSet();
    startBlockStack = new Array<{ blockname: BlockType, line: number }>();
    endBlockStack = new Array<{ blockname: BlockType, line: number }>();
    sleepUsed = false;

    if (terminal) {
        log(chalk.yellowBright('Compiling...'));
    }

    //remove starting and trailing spaces
    lines = code.trim().split("\n");

    if (lines[0].trim() != "hi jaan") {
        throw new Error(`Error at line 1:  Missing Program entrypoint 'hi jaan' on the first line 😩`);
    }

    if (lines[lines.length - 1].trim() != "bye jaan") {
        throw new Error(`Error at line ${lines.length + 1}: Missing Program exitpoint 'bye jaan' on the last line 😩`);
    }

    //if any line after 'bye jaan' then throw error
    if (code.trimStart().endsWith("bye jaan") == false) {
        throw new Error(`Error at line ${lines.length + 1}: 'bye jaan' er pore r kicchu lekha jabe na. Extra lines remove koro 😩`);
    }

    //remove first and last line
    lines.shift();
    lines.pop();
}

export function compile(code: string, terminal = true) {

    try{

        //clear all previous compilation metadata
        let output = "";

        startup(code, terminal);

        let i = 0;
    
        for (i = 0; i < lines.length; i++) {
            try {
    
                //if comment then return
                if (lines[i].trim()[0] === "#") {
                    continue;
                }
    
                //if line is empty then return
                if (lines[i].trim() === "") {
                    continue;
                }
    
                if (lines[i].trim() === "nahole") {
    
                    //use stack to check if nahole is used with jodi
                    if (startBlockStack.length === 0) {
                        throw new Error(`'nahole' er age kothao 'jodi' ba nahole [..] jodi' use korso?😒|nahole`);
                    }
                    if (startBlockStack.at(-1)?.blockname === "jodi" || startBlockStack.at(-1)?.blockname === "nahole jodi") {
                        output += "} else {";
                        startBlockStack.pop();
                        startBlockStack.push({ blockname: "nahole", line: i });
                        endBlockStack.pop();
                        endBlockStack.push({ blockname: "nahole", line: i });
                        continue;
                    } else {
                        throw new Error(`'nahole' er age kothao 'jodi' ba nahole [..] jodi' use korso?😒|nahole`);
                    }
                } else if (lines[i].trim().startsWith("nahole")) { //Nahole jodi block with condition
                    //use stack to check if nahole is used with jodi. Nahole is "else if" in bangla
                    if (startBlockStack.length === 0) {
                        throw new Error(`'nahole jodi' er age kothao 'jodi' ba nahole [..] jodi' use korso?😒|nahole jodi`);
                    }
                    if (startBlockStack.at(-1)?.blockname === "jodi" || startBlockStack.at(-1)?.blockname === "nahole jodi") {
                        output += "} else if (" + parseConditional(lines[i].replace("nahole", "").trim()) + ") {";
                        startBlockStack.pop();
                        startBlockStack.push({ blockname: "nahole jodi", line: i });
                        endBlockStack.pop();
                        endBlockStack.push({ blockname: "nahole jodi", line: i });
                        continue;
                    } else {
                        throw new Error(`'nahole jodi' er age kothao 'jodi' ba nahole [..] jodi' use korso?😒|nahole jodi`);
                    }
    
                } else if (lines[i].trim().match(/(.*)\s+(jodi)\s+(.*)/)) {
                    output += "\nif (" + parseConditional(lines[i]) + ") {";
                    startBlockStack.push({ blockname: "jodi", line: i });
                    endBlockStack.push({ blockname: "jodi", line: i });
                    continue;
                } else if (lines[i].trim().startsWith("huh")) {
                    //end of block
                    if (startBlockStack.length === 0) {
                        throw new Error(`Khoda amr😑!! Kono block start korso j 'huh' likhso?😒|huh`);
                    }

                    if (startBlockStack.at(-1)?.blockname === endBlockStack.at(-1)?.blockname) {
                        startBlockStack.pop();
                        endBlockStack.pop();
                    }
    
                    output += "\n}";
    
                } else if (lines[i].trim().startsWith("bolo")) {

                    handleBolo(i, lines);
                    //use regex
                    output += lines[i].replace(/(^\s)*bolo\s+(.*)$/gm, '\nconsole.log($2);');
                } else if (lines[i].trim().startsWith("dhoro")) {

                    const {value, name} = handleDhoro(i, lines);
    
                    output += `\nlet ${name} = ${value};`;
                    _variableSet.set(name[0], value);
    
                } else if (/(.*) holo (.*)/.test(lines[i])) {
                    const match = lines[i].match(/(.*) holo (.*)/);
                    if (match) {
                        output = handleHolo(match, output);
                    }
                } else if (/(.*)\s*bar\s*(\S*)\s*(.*)/.test(lines[i])) {
                    output += rangeLoopParser(lines[i], i);
                } else if (/(\S*)\s*(\S*)\s*wait koro\s*(.*)/.test(lines[i])){
                    const match = lines[i].match(/(\S*)\s*(\S*)\s*wait koro\s*(.*)/);
                    if (match) {
                        output = handleWait(match, output);
                    }
                } else {
                    const token = lines[i].trim().split(/\s+/)[0];
                    throw new Error(`Ajaira token😑 '${token}'|${token}`);
                }
            } catch (e: any) {
                
                const { msg, annotatedLine } = displayError(e, terminal, lines, i);
                throw new Error(`Error at line ${i + 2}: ${msg}\n\n${annotatedLine}\nCompilation failed🥺😭\n`);
            }
        }
    
        //if block is not closed and line is empty then throw error
        if (startBlockStack.length || endBlockStack.length) {
            if (startBlockStack.length > 0){
                throw new Error(`Error at line ${startBlockStack[0].line + 2}:  Block end korte 'huh' likho nai😑.\nCompilation failed🥺😭\n`);
            } else {
                throw new Error(`Error:  Kono ekta block end koro nai😑.\nCompilation failed🥺😭\n`);
            }
        }
        //wrap the code in a async function
        output = `(async () => {${output}\n\n/*[END_CODE]*/})();`;
        if (sleepUsed){
            output = sleepCode + output;
        }
    
        if (terminal) {
            log(chalk.greenBright('Compiled successfully'));
        }
        return output;
    } catch (e: any) {
        throw new Error(e.message);
    }
}

function handleWait(match: RegExpMatchArray, output: string){
    if (match){
        if (!match[2]){
            throw new Error(`Time unit koi?😑|wait`);
        }
        if (!["min", "sec"].includes(match[2].trim())){
            throw new Error(`Invalid time unit😑 '${match[2]}'. Use 'sec' or 'min' as Unit|${match[2]}`);
        }
        if (match[3]) {
            throw new Error(`Hae??😑 Invalid token '${match[2]}'|${match[2]}`);
        }
        const time = validateNumber(match[1].trim(), 'time count');
        sleepUsed = true;
        const ms = match[2].trim() === "sec" ? time * 1000 : time * 1000 * 60;
        output += `\nawait _jaanLangSleep(${ms});\n`;
    }

    return output;
}

function handleHolo(match: RegExpMatchArray, output: string){
    if (match) {

        const variable = match[1].trim();
        const expression = match[2].trim();

        if (!_variableSet.has(variable)) {
            throw new Error(`'${variable}' declare korso?😑|${variable}`);
        }

        //validate expression
        //expression can be a string or a variable or a combination of both
        const value = evaluateExpression(expression);

        if (!validValue(value)) {
            throw new Error(`Huh. Dumb kothakar🙂 '${expression}' er kono solution ase?|${expression}`);
        }

        if (value === undefined || value === null) {
            throw new Error(`Hijibiji hijibiji 😵‍💫  '${expression}'|${expression}`);
        }
        //use regex
        output += `\n${variable} = ${expression};`;
        _variableSet.set(variable, value);
    }

    return output;
}

function displayError(e: any, terminal: boolean, lines: string[], i: number) {
    let annotatedLine = `${lines[i].trim()}\n`;
    //add spaces before ^ to align with the error message
    const error = e.message;
    if (!error) {
        throw new Error("Allah!! ki jani hoise.😨 Ami kichu jani na🥺");
    }
    const msg = error.split("|")[0];
    let token: string = error.split("|")[1];
    if (token) {
        if (token.startsWith("#")){
            if (token.includes("end")){
                //show the annotation at the end of the line
                annotatedLine += " ".repeat(lines[i].trim().length);
                annotatedLine += terminal ? chalk.yellowBright("^") : "^";
            }
        } else if (lines[i].trim().includes(token)) {
            annotatedLine += " ".repeat(lines[i].trim().indexOf(token));
            for (let j = 0; j < token.length; j++) {
                annotatedLine += terminal ? chalk.yellowBright("~") : "~";
            }
        }
    }

    return {
        msg,
        annotatedLine
    };
}

function handleBolo(i: number, lines: string[]) {
    //find parameter of bolo
    const expression = lines[i].replace("bolo", "").trim();
    //extract all parameters by searching for variables and strings
    const regex = /(["'](.*)["'])|([a-zA-Z0-9]+)/g;
    const matches = expression.match(regex);

    if (!matches) {
        const garbage = expression.replace(/["'].*["']/g, "").replace(/[a-zA-Z0-9]+/g, "").trim();
        if (garbage) {
            throw new Error(`Invalid token😑 '${garbage}'|${garbage}`);
        }
        throw new Error(`Bolo ki?😑 kichu to bolo.|bolo`);
    }
    //validate expression
    //expression can be a string or a variable or a combination of both

    
    const value = evaluateExpression(expression);

    if (!validValue(value)) {
        throw new Error(`Huh. Dumb kothakar🙂 '${expression}' er kono solution ase?|${expression}`);
    }
    
    if (value == undefined) {
        throw new Error(`Hijibiji hijibiji 😵‍💫  '${expression}'|${expression}`);
    }
}

function handleDhoro(i: number, lines: string[]) {
    //remove dhoro and split by "holo"
    const variableDeclaration = lines[i].replace("dhoro", "");
    //if variableDeclaration contains holo then split by holo
    const variableDeclarationParts = variableDeclaration.split("holo").map((part) => part.trim());

    if (variableDeclarationParts.length > 1) {
        if (!variableDeclarationParts[1]) {
            throw new Error(`Expected value after 'holo'. '${variableDeclarationParts[0]} er value koi?😤'|holo`);
        } else {
            //check if it is a variable or value
            validateOperand(variableDeclarationParts[1]);
        }
    }

    if (variableDeclarationParts.length > 2) {
        throw new Error(`Ajaira token😑 after ${variableDeclarationParts[1]}. Found '${variableDeclarationParts[2]}'|${variableDeclarationParts[2]}`);
    }

    validateVariableName(variableDeclarationParts[0]);

    //if variable is already declared then throw error
    if (_variableSet.has(variableDeclarationParts[0])) {
        throw new Error(`'${variableDeclarationParts[0]} to ekbar declare korso. Onno nam dao😑'|${variableDeclarationParts[0]}`);
    }

    let value: string | number | undefined = variableDeclarationParts[1];

    if (value) {
        const type = operandType(value);

        switch (type) {
            case "string":
                value = String(value);
                break;
            case "number":
                value = Number(value);
                break;
            case "variable":
                value = _variableSet.get(value);
                break;
        }
    }

    return {
        name: variableDeclarationParts[0],
        value: value
    }
}

function parseConditional(text: string) {

    try {


        //extract 2 parts of the conditional, first remove the jodi keyword.
        text = text.trim();

        //split by and, or
        const parts = text.split(/(and|or)/).filter((part) => part !== undefined && part !== "" && part !== " ").map((part) => part.trim());
        let expression = "";
        let lastCondition = "";

        const regex = /([a-zA-Z0-9'"_]+)\s*(\bjodi\b)?\s*([a-zA-Z0-9'"_]+)?\s*(\ber kom ba soman hoy|\ber kom ba soman na hoy|\ber beshi ba soman hoy|\ber beshi ba soman na hoy|\ber beshi hoy|\ber beshi na hoy|\ber kom hoy|\ber kom na hoy|\ber soman hoy|\ber soman na hoy|\bhoy|\bna hoy)\s*([a-zA-Z0-9'"_]+)?/;


        //check if it is a conditional statement
        for (let i = 0; i < parts.length; i++) {


            if (lastCondition && lastCondition === parts[i]) {
                throw new Error(`Eksathe duibar same jinish use jay??😷'${lastCondition} ${parts[i]}'|${parts[i]}`);
            }

            if (parts[i] === "and" || parts[i] === "or") {
                expression += ` ${parts[i] === 'and' ? '&& ' : '|| '}`;
                lastCondition = parts[i];
                continue;
            }

            lastCondition = "";

            const match = parts[i].match(regex);

            if (!match) {
                throw new Error("Aigula ki?😐 Invalid syntax");
            }

            const var1 = match[1];
            const jodi = match[2];
            const var2 = match[3];


            if (!var1) {
                throw new Error("Gadha reh😞 Expected a valid 1st variable or value");
            }
            if (!jodi || jodi !== "jodi") {
                throw new Error(`Gadha reh😞 Expected 'jodi' after variable or value|${var1}`);
            }
            if (!var2) {
                throw new Error(`Gadha reh😞 Expected a valid 2nd variable or value|${jodi}`);
            }

            let operator = match[4];

            if (!operator) {
                throw new Error(`Gadha reh😞 Operator ke likhbe?|${var2}`);
            }

            if (!match[5]) {
                throw new Error(`Arey jaan😑! last e 'tahole' likha lage after condition expression|${operator}`);
            } else if (match[5] !== "tahole") {
                throw new Error(`Arey jaan😑! last e 'tahole' likha lage after condition expression. Tumi likhso '${match[5]}'|${match[5]}`);
            }

            expression += validateConditionExpression(var1, var2, operator);
        }
        return expression;
    } catch (e: any) {
        throw new Error(e.message);
    }
}

function validateConditionExpression(var1: string, var2: string, operator: string) {

    try {


        if (operandType(var1) != "variable" && operandType(var2) === "variable") {
            throw new Error(`Arey jaan😑! Variable should be on the left side. Like '${var2} jodi ${var1} ${operator}|${var2}`);
        } else if (operandType(var2) === "variable" && ["hoy", "na hoy"].includes(operator)) {
            throw new Error(`Umm.. Thik ache but '${var1} jodi ${var2} er soman ${operator}' eivabe likhle dekhte sundor lage. Eivabe likho|${operator}`);
        } else if (operandType(var2) != "variable" && operator === "er soman hoy") {
            throw new Error(`Umm.. Thik ache but '${var1} jodi ${var2} hoy' eivabe likhle dekhte sundor lage. Eivabe likho|er soman hoy|${operator}`);
        } else if (operandType(var2) != "variable" && operator === "er soman na hoy") {
            throw new Error(`Umm.. Thik ache but '${var1} jodi ${var2} na hoy' eivabe likhle dekhte sundor lage. Eivabe likho|er soman na hoy|${operator}`);
        }

        switch (operator) {
            case 'hoy':
            case 'er soman hoy':
                operator = '==='
                break;
            case 'na hoy':
            case 'er soman na hoy':
                operator = '!=='
                break;
            case 'er kom hoy':
                operator = '<'
                break;
            case 'er kom na hoy':
                operator = '>'
                break;
            case 'er beshi hoy':
                operator = '>'
                break;
            case 'er beshi na hoy':
                operator = '<'
                break;
            case 'er kom ba soman hoy':
                operator = '<='
                break;
            case 'er kom ba soman na hoy':
                operator = '>='
                break;
            case 'er beshi ba soman hoy':
                operator = '>='
                break;
            case 'er beshi ba soman na hoy':
                operator = '<='
                break;
            default:
                throw new Error(`Hayre pagol🤦‍♀️ Invalid operator '${operator}'. Valid operators are: er soman, theke beshi, theke kom, theke beshi ba soman, theke kom ba soman|${operator}`);
        }
        return `${var1} ${operator} ${var2}`;
    } catch (e: any) {
        throw new Error(e.message);
    }
}

function rangeLoopParser(text: string, line: number) {

    try{
        //syntax: (number) bar
        //User can use $ to access the current value of the loop
        //user can write like: 10 bar ewrwejwnel 
        //any text after 'bar' will be considered as syntax error
        //check if any text after bar
        const regex = /(.*)\s*bar\s*(\S*)\s*(.*)/;
        const matches = text.match(regex);
        if (matches) {
    
            const number = matches[1].trim();
    
            
            const n = validateNumber(number, 'loop');
            
            const hasLoopingVariable = matches[2];
            
            if (hasLoopingVariable) {


                validateVariableName(hasLoopingVariable);
                
                if (_variableSet.has(hasLoopingVariable)) {
                    throw new Error(`'${hasLoopingVariable}' already declare kora ase. Onno nam dao 😑|${hasLoopingVariable}`);
                }

                if (matches[3].trim() === ""){
                    throw new Error(`Expected 'dhore' after ${hasLoopingVariable}|#end`);
                } else if (matches[3].trim() !== "dhore"){
                    throw new Error(`Expected 'dhore' after ${hasLoopingVariable}. Found '${matches[3]}'|${matches[3]}`);
                }
                
                _variableSet.set(hasLoopingVariable, 0);
            }
            
            const loopVariable = hasLoopingVariable ? hasLoopingVariable : "$";
    
            startBlockStack.push({ blockname: `${n} bar`, line: line });
            endBlockStack.push({ blockname: `${n} bar`, line: line });
    
            return `\nfor (let ${loopVariable} = 1; ${loopVariable} <= ${number}; ${loopVariable}++) {`;
        }
    
        return text;
    } catch (e: any) {
        throw new Error(e.message);
    }
}

function sentenceCase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


function validateNumber(number: string, usedFor: 'loop' | 'time count'){
    
    const type = operandType(number.trim());

    const integer = usedFor === 'loop';

    if (type === "number") {
        //if not positive integer then throw error
        if (Number(number) < 0) {
            throw new Error(`Negative number diso kno?😑 '${number}'. ${sentenceCase(usedFor)}ing variable always positive${ integer? " integer" : ""} number hoy jaan|${number}`);
        }
        //if not integer then throw error
        if (integer && !Number.isInteger(Number(number))) {
            throw new Error(`Ultapalta value diso kno?😑 '${number}'. ${sentenceCase(usedFor)}ing variable always positive integer number hoy jaan|${number}`);
        }
    } else if (type === "string") {
        throw new Error(`String diso kon dukkhe?😑 '${number}'. ${sentenceCase(usedFor)}ing variable always positive${ integer? " integer" : ""} number hoy jaan|${number}`);
    } else {
    
        let value = _variableSet.get(number);
    
        if (!value) {
            throw new Error(`${number} er value koi? ki likhso egula hae?? 😑|${number}`);
        } else {

            if (typeof value === "number") {
                if (Number(value) < 0) {
                    throw new Error(`'${number}' er value '${value}'. ${sentenceCase(usedFor)}ing variable always positive${ integer? " integer" : ""} number hoy jaan|${number}`);
                }
                //if not integer then throw error
                if (integer && !Number.isInteger(Number(value))) {
                    throw new Error(`'${number}' er value '${value}'. ${sentenceCase(usedFor)}ing variable always positive integer number hoy jaan|${number}`);
                }
            } else {
                throw new Error(`'${number}' ba '${value}' diye ${usedFor} kora jay na😑. ${sentenceCase(usedFor)}ing variable always positive${ integer? " integer" : ""} number hoy jaan|${number}`);
            }
        }

        return value;
    }

    return Number(number);
}

const code = `
hi jaan
    # This is a comment
    dhoro id holo 6
    dhoro kichuEkta holo id
    dhoro amrNaam holo "Tamanna"
    dhoro a
    dhoro b

    a jodi 10 er theke beshi hoy tahole
        bolo "Hello World"
    nahole a jodi 0 er soman hoy tahole
        bolo "a is 3"
    nahole
        bolo "a is not 0 and not greater than 10"
    huh

    a jodi b er soman hoy tahole
        bolo "Hello World"
    nahole
        bolo "a is not 0 and not greater than 10"
    huh


    10 bar
        bolo "Sorry Jaan " + $
    huh

bye jaan
`;


export function runCode(code: string) {
    try {
        const parsedCode = compile(code);
        try {
            log(chalk.yellowBright('Running...'));
            eval(parsedCode);
        } catch (e: any) {
            log(chalk.yellowBright(`Eita kono kotha🙂! Internal error: ${e.message}`));
        }
    } catch (e: any) {
        log(chalk.redBright(e.message));
    }
}
