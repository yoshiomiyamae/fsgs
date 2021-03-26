export class FagParser {
  static parse = (script: string) => {
    const sentences = FagParser.cleanse(script);
    let scenario: OperationCollection = [];
    const labelIndices: Indices = {};
    let nonLabelText = "";
    const checkInScript = () => {
      const analyzed = FagParser.analyze(nonLabelText);
      const temp = [...scenario, ...analyzed];
      return temp.length
        ? temp[temp.length - 1].action === Actions.InlineScript
        : false;
    };
    for (const sentence of sentences) {
      if (sentence.length > 0) {
        if (sentence[0] === "*") {
          // Label line
          if (nonLabelText !== "") {
            if (!checkInScript()) {
              scenario = [...scenario, ...FagParser.analyze(nonLabelText)];
              nonLabelText = "";
            }
          }
          if (!checkInScript()) {
            const [, labelName, , labelAlias] = <[any, string, any, string]>(
              sentence.match(/^\*(.*?)(\|(.*))?$/)
            );
            labelIndices[labelName] = scenario.length;
            scenario.push(<Operation>{
              action: Actions.Label,
              params: {
                name: labelName,
                alias: labelAlias,
              },
            });
          } else {
            nonLabelText += `${sentence}\r\n`;
          }
        } else {
          if (checkInScript()) {
            nonLabelText += `${sentence}\r\n`;
          } else {
            nonLabelText += sentence;
          }
        }
      }
    }

    scenario = [...scenario, ...FagParser.analyze(nonLabelText)].filter(
      (operation) =>
        operation.action !== Actions.Text ||
        operation.params.text.replace(/\r\n/, "") !== ""
    );

    // let inMacro = false;
    const macroIndices: Indices = {};

    scenario.forEach((operation, index) => {
      if (operation.action === Actions.Macro) {
        macroIndices[operation.params.name] = index;
      }
    });

    return <Script>{
      scenario,
      labelIndices: labelIndices,
      macroIndices: macroIndices,
    };
  };

  static analyze = (script: string) => {
    const output: OperationCollection = [];
    let inTag = false;
    let inText = false;
    let inParam = false;
    let temp = "";
    let tagName = "";
    let paramName = "";
    let tagParams: ParameterCollection = {};
    let inScript = false;

    for (let i = 0; i < script.length; i++) {
      const currentCharacter = script[i];
      switch (currentCharacter) {
        case "[": {
          if (inScript) {
            if (script.substr(i + 1, 9) !== "endscript") {
              temp += currentCharacter;
              break;
            } else {
              output.push(<Operation>{
                action: Actions.InlineScript,
                params: {
                  script: temp,
                },
              });
              inScript = false;
              inTag = false;
              tagName = "";
              temp = "";
              i += 10;
              break;
            }
          }
          if (!inText) {
            if (temp !== "") {
              output.push(<Operation>{
                action: Actions.Text,
                params: {
                  text: temp,
                },
              });
              temp = "";
            }
            inTag = true;
          } else {
            temp += currentCharacter;
          }
          break;
        }
        case "]": {
          if (inTag && !inText) {
            if (tagName === "") {
              tagName = temp;
              temp = "";
              inParam = true;
            } else if (inParam) {
              if (paramName !== "") {
                tagParams[paramName] = temp;
                paramName = "";
                temp = "";
                inParam = false;
              }
            }
            if (tagName === "iscript") {
              inScript = true;
            } else {
              output.push(<Operation>{
                action: tagName,
                params: tagParams,
              });
              tagName = "";
              tagParams = {};
            }
            inTag = false;
          } else {
            temp += currentCharacter;
          }
          break;
        }
        case '"': {
          if (!inScript) {
            inText = !inText;
          }
          break;
        }
        case "*": {
          if (inTag && paramName === "" && !inText && !inScript) {
            tagParams["inherit_macro_params"] = true;
          } else {
            temp += currentCharacter;
          }
          break;
        }
        case " ": {
          if (inTag && !inText) {
            if (tagName === "") {
              tagName = temp;
              temp = "";
              inParam = true;
            } else if (inParam) {
              if (paramName !== "") {
                tagParams[paramName] = temp;
                paramName = "";
                temp = "";
              }
            } else {
              temp = "";
              inParam = true;
            }
          } else {
            temp += currentCharacter;
          }
          break;
        }
        case "=": {
          if (inTag && inParam && !inText) {
            paramName = temp;
            temp = "";
          } else {
            temp += currentCharacter;
          }
          break;
        }
        default: {
          temp += currentCharacter;
          break;
        }
      }
    }

    if (temp === "") {
      return output;
    }
    if (inScript) {
      output.push(<Operation>{
        action: Actions.InlineScript,
        params: {
          script: temp,
        },
      });
    } else {
      output.push(<Operation>{
        action: Actions.Text,
        params: {
          text: temp,
        },
      });
      temp = "";
    }

    return output;
  };

  static cleanse = (sentence: string) =>
    sentence
      .split(/[\r\n]/)
      .filter((value) => value !== "" && value.length >= 1 && value[0] !== ";")
      .map((value) => {
        const match = value.match(/^\t*(.*)$/);
        const sentence = (match && match[1]) || "";
        if (sentence[0] === "@") {
          return `[${sentence.substring(1)}]`;
        }
        return sentence;
      });
}

export type OperationCollection = Operation[];

export interface Operation {
  action: Actions | string;
  params: ParameterCollection;
}

export type ParameterCollection = { [key: string]: any };

export enum Actions {
  Label = "label",
  Text = "text",
  Macro = "macro",
  EndMacro = "endmacro",
  InlineScript = "inlineScript",
}

export type Indices = { [key: string]: number };

export interface Script {
  scenario: OperationCollection;
  labelIndices: Indices;
  macroIndices: Indices;
}
