import { relations } from "drizzle-orm/relations";
import { intentTypes, intents, generatedContents } from "./schema";

export const intentTypesRelations = relations(intentTypes, ({ many }) => ({
  children: many(intentTypes, { relationName: "parent_child" }),
  intents: many(intents),
}));

export const intentTypesParentRelations = relations(intentTypes, ({ one }) => ({
  parent: one(intentTypes, {
    fields: [intentTypes.parent_id],
    references: [intentTypes.id],
    relationName: "parent_child",
  }),
}));

export const intentsRelations = relations(intents, ({ one }) => ({
  intentType: one(intentTypes, {
    fields: [intents.intent_type_id],
    references: [intentTypes.id],
  }),
  parent: one(intents, {
    fields: [intents.parent_id],
    references: [intents.id],
    relationName: "intent_parent_child",
  }),
}));

export const generatedContentsRelations = relations(generatedContents, ({ many }) => ({}));
