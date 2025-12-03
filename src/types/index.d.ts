export type LogLevels = "INFO" | "DEBUG" | "ERROR" | "WARN";
type FilterField = { field: string; value: string };
export type GetLogsConfig = {
    limit?: number;
    page?: number;
    from?: string;
    to?: string;
    filters?: FilterField[];
    id?: string;
    message?: string;
    timestamp?: string;
    level?: LogLevels;
};

export interface Transport {
    writeLog: (level: LogLevels, message: string, fields: Record<string, any>) => Promise<void>;
}

export type LoggerOptions = { transports: Transport[]; baseDir: string };
