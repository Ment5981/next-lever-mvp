import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/candidate", destination: "/app/candidate", permanent: false },
      { source: "/candidate/materials", destination: "/app/candidate/resume", permanent: false },
      { source: "/candidate/manage", destination: "/app/candidate/agent", permanent: false },
      { source: "/candidate/agent", destination: "/app/candidate/agent", permanent: false },
      { source: "/candidate/publish", destination: "/app/candidate/agent", permanent: false },
      { source: "/candidate/workbench", destination: "/app/candidate", permanent: false },
      { source: "/employer", destination: "/app/employer", permanent: false },
      { source: "/employer/job", destination: "/app/employer/jobs", permanent: false },
      { source: "/employer/manage", destination: "/app/employer/jobs", permanent: false },
      { source: "/employer/inbox", destination: "/app/employer/conversations", permanent: false },
      { source: "/employer/workbench", destination: "/app/employer", permanent: false },
      { source: "/marketplace", destination: "/app/candidate/explore", permanent: false },
      { source: "/a2a", destination: "/app/candidate/applications", permanent: false },
      { source: "/coach", destination: "/app/candidate/path", permanent: false },
      { source: "/growth", destination: "/app/candidate/path", permanent: false },
    ];
  },
};

export default nextConfig;
