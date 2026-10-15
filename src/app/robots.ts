import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: [
        "/dashboard",
        "/requests",
        "/users",
        "/audit-log",
        "/change-password",
        "/login",
        "/styleguide",
        "/api/",
        "/reports",
        "/settings",
      ],
    },
  };
}
