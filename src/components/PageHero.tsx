import Image from "next/image";
import type { PageHeroConfig } from "@/lib/page-heroes";

export function PageHero({
  title,
  image,
  alt,
  sectionLabel,
  tabLabel,
}: PageHeroConfig) {
  return (
    <section
      className="relative isolate w-full overflow-hidden bg-ink"
      aria-label={title}
    >
      <Image
        src={image}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/50 to-ink/70"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-52 flex-col items-center justify-center px-4 py-12 text-center sm:min-h-60 sm:py-14 md:min-h-64">
        <h1 className="text-3xl font-black tracking-[0.04em] text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex min-h-10 items-center rounded-full bg-ink/85 px-4 text-sm font-semibold text-white">
            {sectionLabel}
          </span>
          {tabLabel && (
            <span className="inline-flex min-h-10 items-center rounded-full bg-ink/85 px-4 text-sm font-semibold text-white">
              {tabLabel}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
