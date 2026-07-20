import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "How Tuff Is Your Car?",
    short_name: "HTIYC",
    description: "A just-for-fun car enthusiast rating and comparison project.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090b",
    theme_color: "#08090b",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
