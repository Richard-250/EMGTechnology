"use client";

import {useMemo, useState} from "react";
import {FragmentOf, readFragment} from "@/graphql";
import {ProductCardFragment} from "@/lib/vendure/fragments";
import {ProductCard} from "@/components/commerce/product-card";
import {AllCategoriesMenu, type CategoryMenuItem} from "@/components/layout/all-categories-menu";
import type {SerializedProductCard} from '@/lib/product-price';
import {cn} from "@/lib/utils";

type CategoryKey = "all" | "cardio" | "strength" | "home-gyms" | "accessories";

interface CategoryProducts {
    slug: CategoryKey;
    label: string;
    products: FragmentOf<typeof ProductCardFragment>[];
}

interface HomeFitnessCatalogProps {
    categories: CategoryProducts[];
    categoryMenuItems: CategoryMenuItem[];
    categoryProducts: Record<string, SerializedProductCard[]>;
    categoryMenuLabels: {
        allCategories: string;
        shopAll: string;
        viewAll: string;
        recommended: string;
    };
    totalProducts: number;
    labels: {
        title: string;
        subtitle: string;
        all: string;
        showing: string;
    };
}

export function HomeFitnessCatalog({
    categories,
    categoryMenuItems,
    categoryProducts,
    categoryMenuLabels,
    totalProducts,
    labels,
}: HomeFitnessCatalogProps) {
    const [active, setActive] = useState<CategoryKey>("all");

    const activeProducts = useMemo(() => {
        if (active === "all") {
            const allCategory = categories.find(c => c.slug === "all");
            if (allCategory?.products.length) {
                return allCategory.products;
            }
            const seen = new Set<string>();
            const merged: FragmentOf<typeof ProductCardFragment>[] = [];
            for (const cat of categories) {
                if (cat.slug === "all") continue;
                for (const product of cat.products) {
                    const p = readFragment(ProductCardFragment, product);
                    if (!seen.has(p.productId)) {
                        seen.add(p.productId);
                        merged.push(product);
                    }
                }
            }
            return merged;
        }
        return categories.find(c => c.slug === active)?.products ?? [];
    }, [active, categories]);

    const filterChips = categories.filter(c => c.slug !== "all");

    return (
        <section className="bg-[#f5f5f5]">
            {/* Category filters — directly under header / promo */}
            <div className="border-b border-border/60 bg-background">
                <div className="container mx-auto px-3 md:px-4">
                    <div className="flex items-center gap-2 py-3">
                        <AllCategoriesMenu
                            categories={categoryMenuItems}
                            categoryProducts={categoryProducts}
                            labels={categoryMenuLabels}
                            className="rounded-full"
                        />
                        <div className="h-6 w-px shrink-0 bg-border/80" aria-hidden />
                        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setActive("all")}
                            className={cn(
                                "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                                active === "all"
                                    ? "bg-electric text-electric-foreground shadow-sm"
                                    : "bg-muted/40 text-foreground border border-border hover:border-electric/50",
                            )}
                        >
                            {labels.all}
                        </button>
                        {filterChips.map(cat => (
                            <button
                                key={cat.slug}
                                type="button"
                                onClick={() => setActive(cat.slug)}
                                className={cn(
                                    "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    active === cat.slug
                                        ? "bg-electric text-electric-foreground shadow-sm"
                                        : "bg-muted/40 text-foreground border border-border hover:border-electric/50",
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-6 md:py-10">
                <div className="container mx-auto px-3 md:px-4">
                    <div className="bg-white rounded-lg border border-border/60 shadow-sm overflow-hidden">
                        <div className="px-4 py-4 md:px-6 md:py-5 border-b border-border/60">
                            <h2 className="font-display text-2xl md:text-3xl tracking-[0.03em]">
                                {labels.title}
                            </h2>
                            <p className="mt-1 text-muted-foreground text-sm">
                                {labels.subtitle}
                            </p>
                        </div>

                        <div className="px-4 py-3 text-sm text-muted-foreground border-b border-border/30">
                        {labels.showing
                            .replace("{count}", String(activeProducts.length))
                            .replace("{total}", String(active === "all" ? totalProducts : activeProducts.length))}
                    </div>

                    {activeProducts.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            No products in this category yet.
                        </div>
                    ) : (
                        <div className="p-3 md:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                            {activeProducts.map((product, i) => (
                                <ProductCard key={`home-${active}-${i}`} product={product} variant="compact" />
                            ))}
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </section>
    );
}
