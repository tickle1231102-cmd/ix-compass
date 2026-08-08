export function DashboardHero() {
  return (
    <section
      className="relative isolate w-full overflow-hidden bg-ink"
      aria-label="대시보드"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover object-center"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      >
        <source src="/heroes/dashboard.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink/35 via-ink/30 to-ink/60"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-52 flex-col items-center justify-center px-4 py-12 text-center sm:min-h-60 sm:py-14 md:min-h-64">
        <h1 className="text-3xl font-black tracking-[0.04em] text-white sm:text-4xl md:text-5xl">
          다시 제조, 다시 대한민국
        </h1>
      </div>
    </section>
  );
}
