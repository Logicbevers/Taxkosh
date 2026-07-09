export function LegalHeader({ title, updated }: { title: string; updated: string }) {
    return (
        <header className="mb-8 pb-6 border-b">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-2">Last updated: {updated}</p>
        </header>
    );
}
