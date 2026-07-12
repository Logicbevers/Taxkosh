import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.taxkosh.com";
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/login", "/register", "/services"],
                disallow: ["/dashboard/", "/api/"],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
