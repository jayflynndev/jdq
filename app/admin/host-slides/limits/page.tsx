import Link from "next/link";
import { FaExternalLinkAlt } from "react-icons/fa";
import { BrandButton } from "@/components/ui/BrandButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { getHostSlidesLimitsConfig } from "@/src/host-slides/limitsConfig";
import type {
  HostSlidesConfigItem,
  HostSlidesServiceConfig,
} from "@/src/host-slides/limitsConfig";

function StatusPill({ status }: { status: HostSlidesConfigItem["status"] }) {
  const classes =
    status === "configured"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : "border-rose-300 bg-rose-50 text-rose-800";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {status === "configured" ? "Configured" : "Missing"}
    </span>
  );
}

function ConfigItemRow({ item }: { item: HostSlidesConfigItem }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-purple-100 bg-white/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-mono text-xs font-semibold text-purple-950">
          {item.name}
        </div>
        <div className="mt-1 text-xs text-slate-600">
          {item.secret
            ? "Secret value hidden"
            : item.value ?? "No value configured"}
        </div>
      </div>
      <StatusPill status={item.status} />
    </div>
  );
}

function ServiceCard({ service }: { service: HostSlidesServiceConfig }) {
  return (
    <Card hover={false} className="h-full">
      <CardHeader>
        <CardTitle>{service.title}</CardTitle>
        <CardDescription>
          Used for: {service.usedFor.join(", ")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {service.items.map((item) => (
            <ConfigItemRow key={item.name} item={item} />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {service.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-purple-200 bg-white/70 px-3 text-sm font-medium text-purple-900 transition hover:bg-purple-50"
            >
              {link.label}
              <FaExternalLinkAlt className="ml-2 text-xs" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HostSlidesLimitsPage() {
  const config = getHostSlidesLimitsConfig();

  return (
    <main className="qhl-shell space-y-5">
      <section className="qhl-hero">
        <div className="qhl-kicker">Admin Tools</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Host Slides Check Limits
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/85 md:text-base">
          Check which service configuration values are present before running
          production reviews, image search, storage, and publishing tools.
        </p>
        <div className="mt-4">
          <BrandButton href="/admin/host-slides" variant="outline">
            Back to Host Slides
          </BrandButton>
        </div>
      </section>

      <Card hover={false}>
        <CardContent>
          <ul className="space-y-2 text-sm text-purple-950">
            {config.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        {config.services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </section>

      <p className="text-center text-sm text-violet-100/75">
        Need live usage figures?{" "}
        <Link className="font-semibold underline" href="/admin/host-slides">
          Return to Host Slides
        </Link>{" "}
        after checking the provider dashboards.
      </p>
    </main>
  );
}
