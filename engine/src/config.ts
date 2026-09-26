export type EngineConfig = {
  port: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  webOrigins: string[];
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadConfig(): EngineConfig {
  const parsedPort = Number(process.env.PORT ?? 4100);
  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return {
    port: parsedPort,
    supabaseUrl: required("SUPABASE_URL"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    webOrigins: (process.env.WEB_ORIGIN ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
