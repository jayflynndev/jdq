export type HostSlidesConfigStatus = "configured" | "missing";

export type HostSlidesConfigItem = {
  name: string;
  status: HostSlidesConfigStatus;
  value?: string;
  secret: boolean;
};

export type HostSlidesServiceConfig = {
  id: "openai" | "brave" | "supabase" | "vercel";
  title: string;
  usedFor: string[];
  items: HostSlidesConfigItem[];
  links: Array<{
    label: string;
    href: string;
  }>;
};

export type HostSlidesLimitsConfig = {
  services: HostSlidesServiceConfig[];
  notes: string[];
};

type EnvMap = Record<string, string | undefined>;

function cleanValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function configured(value: string | undefined): HostSlidesConfigStatus {
  return cleanValue(value) ? "configured" : "missing";
}

function secretItem(env: EnvMap, name: string): HostSlidesConfigItem {
  return {
    name,
    status: configured(env[name]),
    secret: true,
  };
}

function valueItem(env: EnvMap, name: string): HostSlidesConfigItem {
  const value = cleanValue(env[name]);
  return {
    name,
    status: configured(value),
    ...(value ? { value } : {}),
    secret: false,
  };
}

function oneOfSecretItem(
  env: EnvMap,
  names: readonly string[],
): HostSlidesConfigItem {
  const configuredName = names.find((name) => cleanValue(env[name]));
  return {
    name: names.join(" or "),
    status: configuredName ? "configured" : "missing",
    secret: true,
  };
}

export function getHostSlidesLimitsConfig(
  env: EnvMap = process.env,
): HostSlidesLimitsConfig {
  const timeout = cleanValue(env.OPENAI_REVIEW_TIMEOUT_MS);
  return {
    notes: [
      "This page does not currently fetch live usage limits.",
      "Use the links to check live billing/usage dashboards.",
      "After changing environment variables, redeploy/restart the app.",
    ],
    services: [
      {
        id: "openai",
        title: "OpenAI",
        usedFor: [
          "AI Language Review",
          "AI Fact Review",
          "AI Image Search Term Suggestions",
          "AI Connection Review",
        ],
        items: [
          secretItem(env, "OPENAI_API_KEY"),
          valueItem(env, "OPENAI_LANGUAGE_REVIEW_MODEL"),
          valueItem(env, "OPENAI_FACT_REVIEW_MODEL"),
          valueItem(env, "OPENAI_IMAGE_SUGGESTION_MODEL"),
          valueItem(env, "OPENAI_CONNECTION_REVIEW_MODEL"),
          {
            name: "OPENAI_REVIEW_TIMEOUT_MS",
            status: timeout ? "configured" : "missing",
            value: timeout ?? "Default: 25000",
            secret: false,
          },
        ],
        links: [
          { label: "OpenAI Dashboard", href: "https://platform.openai.com/" },
          {
            label: "OpenAI API Keys",
            href: "https://platform.openai.com/api-keys",
          },
          {
            label: "OpenAI Usage / Billing",
            href: "https://platform.openai.com/usage",
          },
        ],
      },
      {
        id: "brave",
        title: "Brave Search",
        usedFor: ["Image candidate search"],
        items: [
          valueItem(env, "HOST_SLIDES_IMAGE_SEARCH_PROVIDER"),
          secretItem(env, "HOST_SLIDES_IMAGE_SEARCH_API_KEY"),
        ],
        links: [
          {
            label: "Brave Search API Dashboard",
            href: "https://api-dashboard.search.brave.com/",
          },
          {
            label: "Brave Search API Usage / Plans",
            href: "https://api.search.brave.com/app/subscriptions",
          },
          {
            label: "Brave Image Search API Docs",
            href: "https://api-dashboard.search.brave.com/app/documentation/image-search/get-started",
          },
        ],
      },
      {
        id: "supabase",
        title: "Supabase",
        usedFor: [
          "Host Slide decks",
          "quiz-images bucket",
          "Quiz Recap publishing",
        ],
        items: [
          valueItem(env, "NEXT_PUBLIC_SUPABASE_URL"),
          secretItem(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
          oneOfSecretItem(env, [
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_SERVICE_KEY",
          ]),
        ],
        links: [
          { label: "Supabase Dashboard", href: "https://supabase.com/dashboard" },
          {
            label: "Supabase Storage",
            href: "https://supabase.com/dashboard/project/_/storage/buckets",
          },
          {
            label: "Supabase SQL Editor",
            href: "https://supabase.com/dashboard/project/_/sql",
          },
        ],
      },
      {
        id: "vercel",
        title: "Vercel",
        usedFor: ["Deployment", "API route timeouts"],
        items: [
          valueItem(env, "VERCEL_ENV"),
          valueItem(env, "VERCEL_URL"),
          {
            name: "OPENAI_REVIEW_TIMEOUT_MS",
            status: timeout ? "configured" : "missing",
            value: timeout ?? "Default: 25000",
            secret: false,
          },
        ],
        links: [
          { label: "Vercel Dashboard", href: "https://vercel.com/dashboard" },
          {
            label: "Project Functions / Logs",
            href: "https://vercel.com/dashboard",
          },
          {
            label: "Environment Variables",
            href: "https://vercel.com/dashboard",
          },
        ],
      },
    ],
  };
}
