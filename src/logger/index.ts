import { LoggerOptions, LogLevels } from "../types";
import path from "node:path";
const getStack = () => {
    const obj: { stack?: NodeJS.CallSite[] } = {};
    if ("captureStackTrace" in Error) {
        const orig = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        Error.captureStackTrace(obj, getStack);
        Error.prepareStackTrace = orig;
    }
    return obj.stack;
};

export class Logger {
    private transports;
    private baseDir;

    constructor(options: LoggerOptions) {
        this.transports = options.transports;
        this.baseDir = options.baseDir;
    }

    private getFileAndLine() {
        const s = getStack()?.[4];
        if (s && "getFileName" in s) {
            const fn = s.getFileName() || "";
            const mod = path.relative(this.baseDir, fn).split(path.sep);
            return {
                module: mod,
                line: s.getLineNumber() || 0,
                column: s.getColumnNumber() || 0,
            };
        }
        return {
            module: ["unknown"],
            line: 0,
            column: 0,
        };
    }

    private processFields(param: any[]) {
        const hasFields = param.length > 1 && typeof param.at(-1) === "object";
        const message = hasFields
            ? param.slice(0, -1).map((p) => `${p}`).join(" ")
            : param.map((p) => `${p}`).join(" ");
        const fields = hasFields ? param.at(-1) : {};
        return { fields: { ...fields, ...this.getFileAndLine() }, message };
    }

    private log(level: LogLevels, param: any[]) {
        const f = this.processFields(param);
        this.transports.forEach((t) => {
            t.writeLog(level, f.message, f.fields);
        });
    }

    public info(...param: any[]) {
        this.log("INFO", param);
    }
    public debug(...param: any[]) {
        this.log("DEBUG", param);
    }
    public error(...param: any[]) {
        this.log("ERROR", param);
    }
    public warn(...param: any[]) {
        this.log("WARN", param);
    }
}
