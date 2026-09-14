CREATE TABLE "a2a_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "a2a_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"sender" text NOT NULL,
	"receiver" text NOT NULL,
	"message_type" varchar(64) NOT NULL,
	"body" text NOT NULL,
	"envelope" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "a2a_state_events" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"state" varchar(64) NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "a2a_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"context_id" text NOT NULL,
	"candidate_agent_id" text NOT NULL,
	"job_agent_id" text NOT NULL,
	"state" varchar(64) NOT NULL,
	"transport" varchar(120) NOT NULL,
	"protocol_version" varchar(32) NOT NULL,
	"clarification_rounds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"role" varchar(24) NOT NULL,
	"source_id" text NOT NULL,
	"card" jsonb NOT NULL,
	"memory_policy" varchar(64) DEFAULT 'confirmed_only' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"authorization_id" text NOT NULL,
	"candidate_user_id" text NOT NULL,
	"job_version_id" text NOT NULL,
	"state" varchar(48) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"job_version_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authorizations" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_user_id" text NOT NULL,
	"candidate_agent_id" text NOT NULL,
	"job_version_ids" jsonb NOT NULL,
	"disclosure_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"target_role" varchar(120) NOT NULL,
	"resume_text" text DEFAULT '' NOT NULL,
	"project_text" text DEFAULT '' NOT NULL,
	"portfolio" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"materials_confirmed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employer_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"employer_user_id" text NOT NULL,
	"decision" varchar(64) NOT NULL,
	"reason" text NOT NULL,
	"overrode_agent" boolean DEFAULT false NOT NULL,
	"override_reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employer_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"company_name" varchar(160) NOT NULL,
	"company_profile_url" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_user_id" text NOT NULL,
	"candidate_agent_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"job_id" text NOT NULL,
	"version" integer NOT NULL,
	"title" varchar(160) NOT NULL,
	"raw_input" text DEFAULT '' NOT NULL,
	"payload" jsonb NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"hiring_status" varchar(24) DEFAULT 'hiring' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"role" varchar(24) NOT NULL,
	"payload" jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_cache" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"provider" varchar(64) NOT NULL,
	"schema_version" varchar(32) NOT NULL,
	"status" varchar(32) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_usage" (
	"day" varchar(10) NOT NULL,
	"provider" varchar(64) NOT NULL,
	"app_key" varchar(160) NOT NULL,
	"user_id" text,
	"task_id" text,
	"calls" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "provider_usage_day_provider_app_key_user_id_task_id_pk" PRIMARY KEY("day","provider","app_key","user_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(24) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zhihu_accounts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"uid" varchar(160) NOT NULL,
	"hash_id" varchar(160) DEFAULT '' NOT NULL,
	"fullname" varchar(160) NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"avatar_path" text DEFAULT '' NOT NULL,
	"profile_url" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "a2a_artifacts" ADD CONSTRAINT "a2a_artifacts_task_id_a2a_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."a2a_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "a2a_messages" ADD CONSTRAINT "a2a_messages_task_id_a2a_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."a2a_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "a2a_state_events" ADD CONSTRAINT "a2a_state_events_task_id_a2a_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."a2a_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "a2a_tasks" ADD CONSTRAINT "a2a_tasks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "a2a_tasks" ADD CONSTRAINT "a2a_tasks_candidate_agent_id_agents_id_fk" FOREIGN KEY ("candidate_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "a2a_tasks" ADD CONSTRAINT "a2a_tasks_job_agent_id_agents_id_fk" FOREIGN KEY ("job_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_authorization_id_authorizations_id_fk" FOREIGN KEY ("authorization_id") REFERENCES "public"."authorizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_version_id_job_versions_id_fk" FOREIGN KEY ("job_version_id") REFERENCES "public"."job_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_task_id_a2a_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."a2a_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_job_version_id_job_versions_id_fk" FOREIGN KEY ("job_version_id") REFERENCES "public"."job_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorizations" ADD CONSTRAINT "authorizations_candidate_agent_id_agents_id_fk" FOREIGN KEY ("candidate_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_decisions" ADD CONSTRAINT "employer_decisions_task_id_a2a_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."a2a_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_decisions" ADD CONSTRAINT "employer_decisions_employer_user_id_users_id_fk" FOREIGN KEY ("employer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_reports" ADD CONSTRAINT "growth_reports_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_reports" ADD CONSTRAINT "growth_reports_candidate_agent_id_agents_id_fk" FOREIGN KEY ("candidate_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_versions" ADD CONSTRAINT "job_versions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_posts" ADD CONSTRAINT "marketplace_posts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zhihu_accounts" ADD CONSTRAINT "zhihu_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "a2a_artifacts_task_idx" ON "a2a_artifacts" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE INDEX "a2a_messages_task_idx" ON "a2a_messages" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE INDEX "a2a_state_events_task_idx" ON "a2a_state_events" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE INDEX "a2a_tasks_application_idx" ON "a2a_tasks" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "a2a_tasks_state_idx" ON "a2a_tasks" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_owner_role_source_idx" ON "agents" USING btree ("owner_user_id","role","source_id");--> statement-breakpoint
CREATE INDEX "applications_candidate_idx" ON "applications" USING btree ("candidate_user_id");--> statement-breakpoint
CREATE INDEX "applications_job_idx" ON "applications" USING btree ("job_version_id");--> statement-breakpoint
CREATE INDEX "growth_reports_candidate_idx" ON "growth_reports" USING btree ("candidate_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "job_versions_job_version_idx" ON "job_versions" USING btree ("job_id","version");--> statement-breakpoint
CREATE INDEX "job_versions_owner_idx" ON "job_versions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "marketplace_posts_role_published_idx" ON "marketplace_posts" USING btree ("role","published");--> statement-breakpoint
CREATE INDEX "provider_cache_expiry_idx" ON "provider_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "provider_usage_day_idx" ON "provider_usage" USING btree ("day","provider");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "zhihu_accounts_uid_idx" ON "zhihu_accounts" USING btree ("uid");