import { connectDB } from "@/lib/db";
import { SiteConfig } from "@/lib/models/SiteConfig";

/**
 * Read a config value from MongoDB with a fallback.
 * Safe to call from Server Components and Route Handlers.
 */
export async function getSiteConfig(key: string, fallback = ""): Promise<string> {
  try {
    await connectDB();
    const cfg = await SiteConfig.findOne({ key }).lean() as { value: string } | null;
    return cfg?.value ?? fallback;
  } catch {
    return fallback;
  }
}
