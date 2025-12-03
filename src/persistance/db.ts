import { Database } from "bun:sqlite";
import { and, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { GetLogsConfig, LogLevels, Transport } from "../types";
import * as schema from "./schema";

export class DB implements Transport {
    private instance;

    constructor(client: Database) {
        this.instance = drizzle({ client, schema });
        migrate(this.instance, { migrationsFolder: "migrations" });
    }

    public async getFields() {
        return await this.instance.query.fieldsDef.findMany({
            columns: { name: true, type: true, format: true, is_array: true },
            orderBy: (f, { asc }) => [asc(f.name), asc(f.type)],
        });
    }

    private buildFilters(config: GetLogsConfig) {
        const filterList = [];
        if (config.id) {
            filterList.push(like(schema.logs.id, config.id));
        }
        if (config.message) {
            filterList.push(like(schema.logs.message, config.message));
        }
        if (config.level) {
            filterList.push(eq(schema.logs.level, config.level));
        }
        if (config.timestamp) {
            filterList.push(eq(schema.logs.timestamp, config.timestamp));
        }
        if (config.filters && config.filters.length > 0) {
            const f: Record<string, any[]> = {};
            config.filters.forEach((ff) => {
                if (f[ff.field]) {
                    f[ff.field].push(ff.value);
                } else {
                    f[ff.field] = [ff.value];
                }
            });
            Object.entries(f).forEach(([key, value]) => {
                if (value.length > 1) {
                    filterList.push(or(...value.map((v) => sql`fields -> '$.${key}' LIKE '${v}'`)));
                } else {
                    filterList.push(sql`fields -> '$.${key}' LIKE '${value[0]}'`);
                }
            });
        }
        if (filterList.length > 0) {
            return and(...filterList);
        }
        return sql``;
    }

    public async getLogs(config: GetLogsConfig = { limit: 50, page: 0 }) {
        if (!config.limit || config.limit <= 0) {
            config.limit = 50;
        }
        if (!config.page || config.page < 0) {
            config.page = 0;
        }
        const filters = this.buildFilters(config);
        const totalCount = await this.instance.$count(schema.logs, filters);
        const totalPages = Math.ceil(totalCount / config.limit);
        if (config.page >= totalPages) {
            config.page = totalPages - 1;
        }
        let isLastPage = config.page === totalPages - 1;
        const data = await this.instance.query.logs.findMany({
            columns: { created_at: false, created_by: false, updated_at: false, updated_by: false },
            orderBy: (l, { desc }) => [desc(l.timestamp)],
            where: filters,
            limit: config.limit,
            offset: config.limit * config.page,
        });

        return {
            from: config.from,
            to: config.to,
            filters: config.filters,
            pagination: {
                page: config.page,
                limit: config.limit,
                totalPages,
                totalCount,
                isLastPage,
            },
            data,
        };
    }

    public async writeLog(level: LogLevels = "INFO", message: string, fields: Record<string, any>) {
        await this.instance.insert(schema.logs).values({ level, message, fields });
    }
}
