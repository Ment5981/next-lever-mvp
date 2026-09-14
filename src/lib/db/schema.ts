import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();

/** Next Level 的业务库边界。知乎 OAuth 只提供身份来源，不承载这些业务表。 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const zhihuAccounts = pgTable("zhihu_accounts", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  uid: varchar("uid", { length: 160 }).notNull(),
  hashId: varchar("hash_id", { length: 160 }).notNull().default(""),
  fullname: varchar("fullname", { length: 160 }).notNull(),
  headline: text("headline").notNull().default(""),
  avatarPath: text("avatar_path").notNull().default(""),
  profileUrl: text("profile_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [uniqueIndex("zhihu_accounts_uid_idx").on(table.uid)]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 24 }).notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: createdAt(),
}, (table) => [index("sessions_user_idx").on(table.userId), index("sessions_expires_idx").on(table.expiresAt)]);

export const candidateProfiles = pgTable("candidate_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 80 }).notNull(),
  targetRole: varchar("target_role", { length: 120 }).notNull(),
  resumeText: text("resume_text").notNull().default(""),
  projectText: text("project_text").notNull().default(""),
  portfolio: jsonb("portfolio").notNull().default([]),
  evidence: jsonb("evidence").notNull().default([]),
  materialsConfirmed: boolean("materials_confirmed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const employerProfiles = pgTable("employer_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  companyName: varchar("company_name", { length: 160 }).notNull(),
  companyProfileUrl: text("company_profile_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const jobVersions = pgTable("job_versions", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull(),
  version: integer("version").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  rawInput: text("raw_input").notNull().default(""),
  payload: jsonb("payload").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  published: boolean("published").notNull().default(false),
  hiringStatus: varchar("hiring_status", { length: 24 }).notNull().default("hiring"),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("job_versions_job_version_idx").on(table.jobId, table.version), index("job_versions_owner_idx").on(table.ownerUserId)]);

export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 24 }).notNull(),
  sourceId: text("source_id").notNull(),
  card: jsonb("card").notNull(),
  memoryPolicy: varchar("memory_policy", { length: 64 }).notNull().default("confirmed_only"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [uniqueIndex("agents_owner_role_source_idx").on(table.ownerUserId, table.role, table.sourceId)]);

export const marketplacePosts = pgTable("marketplace_posts", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 24 }).notNull(),
  payload: jsonb("payload").notNull(),
  published: boolean("published").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [index("marketplace_posts_role_published_idx").on(table.role, table.published)]);

export const authorizations = pgTable("authorizations", {
  id: text("id").primaryKey(),
  candidateUserId: text("candidate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  candidateAgentId: text("candidate_agent_id").notNull().references(() => agents.id),
  jobVersionIds: jsonb("job_version_ids").notNull(),
  disclosureSnapshot: jsonb("disclosure_snapshot").notNull(),
  createdAt: createdAt(),
});

export const applications = pgTable("applications", {
  id: text("id").primaryKey(),
  authorizationId: text("authorization_id").notNull().references(() => authorizations.id),
  candidateUserId: text("candidate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobVersionId: text("job_version_id").notNull().references(() => jobVersions.id),
  state: varchar("state", { length: 48 }).notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [index("applications_candidate_idx").on(table.candidateUserId), index("applications_job_idx").on(table.jobVersionId)]);

export const a2aTasks = pgTable("a2a_tasks", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  contextId: text("context_id").notNull(),
  candidateAgentId: text("candidate_agent_id").notNull().references(() => agents.id),
  jobAgentId: text("job_agent_id").notNull().references(() => agents.id),
  state: varchar("state", { length: 64 }).notNull(),
  transport: varchar("transport", { length: 120 }).notNull(),
  protocolVersion: varchar("protocol_version", { length: 32 }).notNull(),
  clarificationRounds: integer("clarification_rounds").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [index("a2a_tasks_application_idx").on(table.applicationId), index("a2a_tasks_state_idx").on(table.state)]);

export const a2aMessages = pgTable("a2a_messages", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => a2aTasks.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  receiver: text("receiver").notNull(),
  messageType: varchar("message_type", { length: 64 }).notNull(),
  body: text("body").notNull(),
  envelope: jsonb("envelope").notNull(),
  createdAt: createdAt(),
}, (table) => [index("a2a_messages_task_idx").on(table.taskId, table.createdAt)]);

export const a2aArtifacts = pgTable("a2a_artifacts", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => a2aTasks.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull().default(""),
  payload: jsonb("payload").notNull(),
  createdAt: createdAt(),
}, (table) => [index("a2a_artifacts_task_idx").on(table.taskId, table.createdAt)]);

export const a2aStateEvents = pgTable("a2a_state_events", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => a2aTasks.id, { onDelete: "cascade" }),
  state: varchar("state", { length: 64 }).notNull(),
  note: text("note").notNull().default(""),
  createdAt: createdAt(),
}, (table) => [index("a2a_state_events_task_idx").on(table.taskId, table.createdAt)]);

export const assessments = pgTable("assessments", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => a2aTasks.id, { onDelete: "cascade" }),
  jobVersionId: text("job_version_id").notNull().references(() => jobVersions.id),
  payload: jsonb("payload").notNull(),
  createdAt: createdAt(),
});

export const employerDecisions = pgTable("employer_decisions", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => a2aTasks.id, { onDelete: "cascade" }),
  employerUserId: text("employer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  decision: varchar("decision", { length: 64 }).notNull(),
  reason: text("reason").notNull(),
  overrodeAgent: boolean("overrode_agent").notNull().default(false),
  overrideReason: text("override_reason").notNull().default(""),
  createdAt: createdAt(),
});

export const growthReports = pgTable("growth_reports", {
  id: text("id").primaryKey(),
  candidateUserId: text("candidate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  candidateAgentId: text("candidate_agent_id").notNull().references(() => agents.id),
  payload: jsonb("payload").notNull(),
  createdAt: createdAt(),
}, (table) => [index("growth_reports_candidate_idx").on(table.candidateUserId, table.createdAt)]);

export const providerCache = pgTable("provider_cache", {
  cacheKey: text("cache_key").primaryKey(),
  provider: varchar("provider", { length: 64 }).notNull(),
  schemaVersion: varchar("schema_version", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  payload: jsonb("payload").notNull(),
  fetchedAt: createdAt(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
}, (table) => [index("provider_cache_expiry_idx").on(table.expiresAt)]);

export const providerUsage = pgTable("provider_usage", {
  day: varchar("day", { length: 10 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  appKey: varchar("app_key", { length: 160 }).notNull(),
  userId: text("user_id").notNull().default(""),
  taskId: text("task_id").notNull().default(""),
  calls: integer("calls").notNull().default(0),
}, (table) => [primaryKey({ columns: [table.day, table.provider, table.appKey, table.userId, table.taskId] }), index("provider_usage_day_idx").on(table.day, table.provider)]);

export const userRelations = relations(users, ({ one, many }) => ({
  zhihuAccount: one(zhihuAccounts),
  session: many(sessions),
  candidateProfile: one(candidateProfiles),
  employerProfile: one(employerProfiles),
  jobs: many(jobVersions),
  agents: many(agents),
}));

export const taskRelations = relations(a2aTasks, ({ many }) => ({
  messages: many(a2aMessages),
  artifacts: many(a2aArtifacts),
  stateEvents: many(a2aStateEvents),
  assessments: many(assessments),
}));
