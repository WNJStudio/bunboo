import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const textField = () => text({ mode: "text" });
const uuidField = () => text({ mode: "text" }).$defaultFn(() => Bun.randomUUIDv7());
const jsonField = () => text({ mode: "json" }).$type<{ [x: string]: any }>();
const boolField = () => integer({ mode: "boolean" });
const createdAtField = () => text().default(sql`(CURRENT_TIMESTAMP)`);
const updatedAtField = () => text().default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`);

export const fieldsDef = sqliteTable("fields", {
    name: textField().notNull(),
    type: text({ enum: ["number", "string", "date", "object", "boolean"] }).notNull(),
    format: textField(),
    is_array: boolField().default(false).notNull(),
    created_at: createdAtField().notNull(),
    created_by: textField().default("SYSTEM").notNull(),
    updated_at: updatedAtField().notNull(),
    updated_by: textField().default("SYSTEM").notNull(),
}, (t) => [primaryKey({ columns: [t.name, t.type] })]);

export const logs = sqliteTable("logs", {
    id: uuidField().primaryKey(),
    timestamp: createdAtField().notNull(),
    level: text({ enum: ["INFO", "DEBUG", "ERROR", "WARN"] }).default("INFO").notNull(),
    message: textField(),
    fields: jsonField(),
    created_at: createdAtField().notNull(),
    created_by: textField().default("SYSTEM").notNull(),
    updated_at: updatedAtField().notNull(),
    updated_by: textField().default("SYSTEM").notNull(),
});
