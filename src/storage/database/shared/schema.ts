import { pgTable, serial, timestamp, varchar, text, boolean, integer, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// System table - DO NOT DELETE
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 意图分类体系 - Intent Types
export const intentTypes = pgTable(
	"intent_types",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 100 }).notNull(),
		code: varchar("code", { length: 50 }).notNull().unique(),
		description: text("description"),
		icon: varchar("icon", { length: 50 }),
		color: varchar("color", { length: 20 }),
		parent_id: varchar("parent_id", { length: 36 }),
		level: integer("level").default(1).notNull(),
		sort_order: integer("sort_order").default(0).notNull(),
		is_builtin: boolean("is_builtin").default(false).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("intent_types_code_idx").on(table.code),
		index("intent_types_parent_id_idx").on(table.parent_id),
		index("intent_types_level_idx").on(table.level),
	]
);

// 意图表 - Intents
export const intents = pgTable(
	"intents",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 200 }).notNull(),
		query: varchar("query", { length: 500 }),
		intent_type_id: varchar("intent_type_id", { length: 36 }).references(() => intentTypes.id),
		level: integer("level").default(1).notNull(),
		parent_id: varchar("parent_id", { length: 36 }),
		keywords: jsonb("keywords").default([]),
		priority: integer("priority").default(0).notNull(),
		tags: jsonb("tags").default([]),
		source: varchar("source", { length: 50 }).default("manual").notNull(),
		status: varchar("status", { length: 20 }).default("active").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("intents_intent_type_id_idx").on(table.intent_type_id),
		index("intents_parent_id_idx").on(table.parent_id),
		index("intents_status_idx").on(table.status),
		index("intents_created_at_idx").on(table.created_at),
	]
);

// 生成内容表 - Generated Content
export const generatedContents = pgTable(
	"generated_contents",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		title: varchar("title", { length: 500 }),
		content: text("content").notNull(),
		content_type: varchar("content_type", { length: 50 }),
		intent_ids: jsonb("intent_ids").default([]),
		style: varchar("style", { length: 50 }),
		model_id: varchar("model_id", { length: 100 }),
		quality_score: integer("quality_score"),
		version: integer("version").default(1).notNull(),
		status: varchar("status", { length: 20 }).default("draft").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("generated_contents_status_idx").on(table.status),
		index("generated_contents_style_idx").on(table.style),
		index("generated_contents_created_at_idx").on(table.created_at),
	]
);

// 模型配置表 - Model Configuration
export const modelConfigs = pgTable(
	"model_configs",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		provider: varchar("provider", { length: 50 }).notNull().unique(),
		api_key: text("api_key"),
		model: varchar("model", { length: 100 }).notNull(),
		base_url: varchar("base_url", { length: 500 }),
		// Thinking Mode (DeepSeek)
		thinking_enabled: boolean("thinking_enabled").default(false).notNull(),
		reasoning_effort: varchar("reasoning_effort", { length: 20 }),
		// Common model params
		temperature: integer("temperature"),
		max_tokens: integer("max_tokens"),
		top_p: integer("top_p"),
		frequency_penalty: integer("frequency_penalty"),
		presence_penalty: integer("presence_penalty"),
		// Priority: lower = higher priority
		priority: integer("priority").default(1).notNull(),
		enabled: boolean("enabled").default(true).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("model_configs_provider_idx").on(table.provider),
		index("model_configs_priority_idx").on(table.priority),
	]
);
