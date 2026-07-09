import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // pdfkit ships font-metrics (.afm) data files it loads via relative paths at
    // runtime. Bundling it breaks that resolution, so keep it external to the
    // server bundle and let it require its data files from node_modules normally.
    serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
