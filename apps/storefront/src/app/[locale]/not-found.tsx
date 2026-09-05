import Image from 'next/image';
import { getRouteLocale } from '@/i18n/server';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Search, ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { getTopCollections } from '@/lib/vendure/cached';
import { SITE_LOGO_LIGHT, SITE_NAME } from '@/lib/metadata';

export default async function NotFound() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'NotFound'});
    let collections: { id: string; name: string; slug: string }[] = [];
    try {
        collections = await getTopCollections(locale);
    } catch {
        // Gracefully handle if collections can't be fetched
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-muted/30 via-background to-background">
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="mx-auto max-w-3xl rounded-3xl border border-border/70 bg-card shadow-xl overflow-hidden">
                    <div className="grid md:grid-cols-2">
                        <div className="bg-[#0C1210] text-white p-8 md:p-10 flex flex-col justify-between gap-8">
                            <div className="space-y-6">
                                <Image
                                    src={SITE_LOGO_LIGHT}
                                    alt={SITE_NAME}
                                    width={180}
                                    height={64}
                                    className="h-12 w-auto object-contain"
                                />
                                <div>
                                    <p className="text-6xl font-bold text-electric leading-none">404</p>
                                    <h1 className="mt-4 text-2xl font-semibold">{t('title')}</h1>
                                    <p className="mt-3 text-sm text-white/75 leading-relaxed">{t('message')}</p>
                                </div>
                            </div>
                            <p className="text-xs text-white/50">{t('helpHint')}</p>
                        </div>

                        <div className="p-8 md:p-10 space-y-6">
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">{t('tryThese')}</p>
                                <div className="grid gap-3">
                                    <Button nativeButton={false} render={<Link href="/" />} size="lg" className="justify-start">
                                        <Home className="mr-2 h-4 w-4" />
                                        {t('goHome')}
                                    </Button>
                                    <Button nativeButton={false} render={<Link href="/search" />} variant="outline" size="lg" className="justify-start">
                                        <ShoppingBag className="mr-2 h-4 w-4" />
                                        {t('browseProducts')}
                                    </Button>
                                    <Button nativeButton={false} render={<Link href="/search" />} variant="ghost" size="lg" className="justify-start">
                                        <Search className="mr-2 h-4 w-4" />
                                        {t('searchCatalog')}
                                    </Button>
                                </div>
                            </div>

                            {collections.length > 0 && (
                                <div className="pt-4 border-t border-border/70">
                                    <p className="text-sm font-medium text-muted-foreground mb-3">{t('popularCollections')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {collections.slice(0, 6).map((collection) => (
                                            <Button
                                                key={collection.id}
                                                render={<Link href={`/collection/${collection.slug}`} />}
                                                nativeButton={false}
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full"
                                            >
                                                {collection.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button nativeButton={false} render={<Link href="/" />} variant="link" className="px-0">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('backHome')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
