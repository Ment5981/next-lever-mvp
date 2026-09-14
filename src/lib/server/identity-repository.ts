import { users, zhihuAccounts } from "@/lib/db/schema";
import { getDatabase } from "@/lib/db/client";
import type { ZhihuUserProfile } from "@/lib/server/zhihu-oauth";

/**
 * 将知乎作为身份来源映射到 Next Level 用户表。
 * 数据库未配置时返回 null，让零密钥 Demo 保持可用。
 */
export async function upsertZhihuIdentity(profile: ZhihuUserProfile) {
  const db = getDatabase();
  if (!db) return null;
  const userId = `zhihu:${profile.uid}`;
  const at = new Date();
  await db.insert(users).values({ id: userId, createdAt: at, updatedAt: at }).onConflictDoUpdate({
    target: users.id,
    set: { updatedAt: at },
  });
  await db.insert(zhihuAccounts).values({
    userId,
    uid: profile.uid,
    hashId: profile.hash_id,
    fullname: profile.fullname,
    headline: profile.headline,
    avatarPath: profile.avatar_path,
    profileUrl: profile.url,
    updatedAt: at,
  }).onConflictDoUpdate({
    target: zhihuAccounts.userId,
    set: {
      uid: profile.uid,
      hashId: profile.hash_id,
      fullname: profile.fullname,
      headline: profile.headline,
      avatarPath: profile.avatar_path,
      profileUrl: profile.url,
      updatedAt: at,
    },
  });
  return userId;
}

