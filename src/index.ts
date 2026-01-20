export type LogLevel = "INFO" | "DEBUG" | "ERROR" | "WARN";
export type FilterField = { field: string; value: string };
export type GetLogsConfig = {
    limit?: number;
    page?: number;
    from?: string;
    to?: string;
    filters?: FilterField[];
    id?: string;
    message?: string;
    timestamp?: string;
    level?: LogLevel;
};

export interface Transport {
    writeLog: (level: LogLevel, message: string, fields: Record<string, any>) => Promise<void>;
}

export type LoggerOptions = { transports: Transport[]; baseDir: string };

export * from "./transports";
export * from "./logger";
