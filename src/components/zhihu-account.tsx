"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { callApi } from "@/lib/client/api";

type Profile = { fullname: string; headline: string; avatar_path: string };

export function ZhihuAccount() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    void callApi<{ authenticated: boolean; profile: Profile | null }>("/api/auth/zhihu/me").then((result) => {
      if (active && result.ok && result.data.authenticated) setProfile(result.data.profile);
    });
    return () => { active = false; };
  }, []);

  if (!profile) {
    return <Link href="/api/auth/zhihu/start" className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-600">知乎登录</Link>;
  }

  return (
    <Link href="/account" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100">
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700" style={profile.avatar_path ? { backgroundImage: `url(${profile.avatar_path})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        {!profile.avatar_path && profile.fullname.slice(0, 1)}
      </span>
      <span className="hidden max-w-24 truncate text-xs font-medium text-slate-700 sm:block">{profile.fullname}</span>
    </Link>
  );
}
