/**
 * "How it works" — three steps, start to acknowledgement.
 * Replaces the earlier testimonial section: we don't publish customer quotes
 * until we have real, consented ones (Consumer Protection Act / ASCI rules).
 */
const steps = [
    {
        n: 1,
        title: "Choose your service",
        description:
            "Pick from ITR, GST, TDS or registration — the full fixed price is shown up front, before you pay.",
    },
    {
        n: 2,
        title: "Upload documents",
        description:
            "Drop them into your secure vault on your own time. We tell you exactly what's needed for your service.",
    },
    {
        n: 3,
        title: "A CA files it",
        description:
            "An ICAI-registered CA reviews and files your return — you get the government acknowledgement in your dashboard.",
    },
];

export function Testimonials() {
    return (
        <section id="how-it-works" className="relative overflow-hidden bg-[oklch(0.94_0.03_165)] dark:bg-[oklch(0.22_0.03_165)]">
            <div className="pointer-events-none absolute -top-28 right-16 h-72 w-72 rounded-full bg-accent-strong/20 blur-xl" />
            <div className="relative mx-auto max-w-7xl px-4 py-24">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                    How it works
                </p>
                <h2 className="mb-12 font-serif text-4xl sm:text-5xl text-foreground">
                    Three steps, start to acknowledgement.
                </h2>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {steps.map((s) => (
                        <div
                            key={s.n}
                            className="flex flex-col gap-3.5 rounded-2xl bg-card p-7 shadow-[0_12px_28px_oklch(0.21_0.015_90/0.06)]"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-[17px] font-extrabold text-primary-foreground">
                                {s.n}
                            </div>
                            <h3 className="text-[17px] font-extrabold text-foreground">{s.title}</h3>
                            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                                {s.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
