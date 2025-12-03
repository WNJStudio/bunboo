import chalk from "chalk";
import { LogLevels, Transport } from "../types";
import path from "node:path";

export class ConsoleTransport implements Transport {
    private moduleLength;

    constructor(moduleLength: number = 24) {
        this.moduleLength = moduleLength;
    }

    private formatModule(module: string[] = ["unknown"], line: number = 0, column: number = 0) {
        let t = `:${line}:${column}`;
        if (module.length === 0) {
            return {
                formatted: "",
                head: t.padStart(this.moduleLength, " ").replace(t, ""),
            };
        }
        let head = module.slice(0, -1);
        let m = module.at(-1) || "";
        let f = [...head, m].join(path.sep);
        let c = `${f}${t}`;
        while (c.length > this.moduleLength) {
            if (head.length > 0) {
                if (head[0] === "..") {
                    head.shift();
                } else {
                    head[0] = head[0].replace(/^\.*.?/, "..");
                }
            } else {
                m = m.replace(/^\.*.?/, "..");
            }
            f = [...head, m].join(path.sep);
            c = `${f}${t}`;
        }

        return {
            formatted: f,
            head: `${f}${t}`.padStart(this.moduleLength, " ").replace(`${f}${t}`, ""),
        };
    }

    public async writeLog(level: LogLevels, message: string, fields: Record<string, any>) {
        const ts = chalk.green(new Date().toISOString());
        const levelPadded = level.padEnd(5, " ");
        let l = levelPadded;
        let logger = console.log;
        switch (level) {
            case "INFO":
                l = chalk.bgBlue(levelPadded);
                logger = console.log;
                break;
            case "DEBUG":
                l = chalk.bgGreen(levelPadded);
                logger = console.debug;
                break;
            case "ERROR":
                l = chalk.bgRed(levelPadded);
                logger = console.error;
                break;
            case "WARN":
                l = chalk.bgYellow(levelPadded);
                logger = console.warn;
                break;
        }
        const { module, line, column, ...rest } = fields;
        const mf = this.formatModule(module, line, column);
        const m = chalk.gray(`${mf.head}${chalk.blue(mf.formatted)}:${chalk.yellow(line)}:${chalk.yellow(column)}`);
        logger(
            `${ts} [${l}][${m}]: ${message.replaceAll("\n", " ")}${
                Object.keys(rest).length > 0 ? ` | ${chalk.magentaBright(JSON.stringify(rest))}` : ""
            }`,
        );
    }
}
