import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://taxkosh.in";
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
