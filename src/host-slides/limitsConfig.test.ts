import { describe, expect, it } from "vitest";
import { getHostSlidesLimitsConfig } from "@/src/host-slides/limitsConfig";

describe("Host Slides limits config", () => {
  it("redacts secret values", () => {
    const config = getHostSlidesLimitsConfig({
      OPENAI_API_KEY: "sk-secret",
      HOST_SLIDES_IMAGE_SEARCH_API_KEY: "brave-secret",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-secret",
      SUPABASE_SERVICE_ROLE_KEY: "service-secret",
    });

    expect(JSON.stringify(config)).not.toContain("sk-secret");
    expect(JSON.stringify(config)).not.toContain("brave-secret");
    expect(JSON.stringify(config)).not.toContain("anon-secret");
    expect(JSON.stringify(config)).not.toContain("service-secret");
  });

  it("shows safe non-secret values", () => {
    const config = getHostSlidesLimitsConfig({
      OPENAI_FACT_REVIEW_MODEL: "gpt-test",
      OPENAI_REVIEW_TIMEOUT_MS: "45000",
      HOST_SLIDES_IMAGE_SEARCH_PROVIDER: "brave",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      VERCEL_ENV: "production",
      VERCEL_URL: "example.vercel.app",
    });

    expect(JSON.stringify(config)).toContain("gpt-test");
    expect(JSON.stringify(config)).toContain("45000");
    expect(JSON.stringify(config)).toContain("brave");
    expect(JSON.stringify(config)).toContain("https://example.supabase.co");
    expect(JSON.stringify(config)).toContain("production");
    expect(JSON.stringify(config)).toContain("example.vercel.app");
  });

  it("marks missing and configured values without exposing keys", () => {
    const config = getHostSlidesLimitsConfig({
      OPENAI_API_KEY: "sk-secret",
      OPENAI_LANGUAGE_REVIEW_MODEL: "",
    });
    const openAi = config.services.find((service) => service.id === "openai");

    expect(openAi?.items).toContainEqual(
      expect.objectContaining({
        name: "OPENAI_API_KEY",
        status: "configured",
        secret: true,
      }),
    );
    expect(openAi?.items).toContainEqual(
      expect.objectContaining({
        name: "OPENAI_LANGUAGE_REVIEW_MODEL",
        status: "missing",
        secret: false,
      }),
    );
  });
});
