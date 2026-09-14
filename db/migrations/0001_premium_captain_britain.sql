ALTER TABLE "provider_usage" ALTER COLUMN "user_id" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "provider_usage" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_usage" ALTER COLUMN "task_id" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "provider_usage" ALTER COLUMN "task_id" SET NOT NULL;