import type {ReactNode} from 'react';

export function LegalPage({
    title,
    effectiveDate,
    children,
}: {
    title: string;
    effectiveDate: string;
    children: ReactNode;
}) {
    return (
        <div className="container mx-auto px-4 py-12 md:py-16">
            <article className="mx-auto max-w-3xl">
                <header className="mb-10 space-y-3 border-b border-border pb-8">
                    <h1 className="font-display text-4xl md:text-5xl tracking-[0.03em] text-foreground">
                        {title}
                    </h1>
                    <p className="text-sm text-muted-foreground">Effective Date: {effectiveDate}</p>
                </header>
                <div className="legal-content space-y-8 text-[15px] leading-relaxed text-muted-foreground">
                    {children}
                </div>
            </article>
        </div>
    );
}

export function LegalSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-3">
            <h2 className="font-display text-xl tracking-[0.04em] text-foreground">{title}</h2>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

export function LegalList({items}: {items: string[]}) {
    return (
        <ul className="list-disc space-y-1.5 pl-5">
            {items.map(item => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}
