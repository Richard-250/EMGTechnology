'use server';

import { mutate, query } from '@/lib/vendure/api';
import { AddToCartMutation } from '@/lib/vendure/mutations';
import { GetProductDetailQuery } from '@/lib/vendure/queries';
import { updateTag } from 'next/cache';
import { setAuthToken } from '@/lib/auth';
import { getActiveCurrencyCode } from '@/lib/currency-server';
import { getLocale, getTranslations } from 'next-intl/server';
import { resolveProductCarouselImages } from '@/lib/product-images';

export async function addToCart(variantId: string, quantity: number = 1) {
  const locale = await getLocale();
  const currencyCode = await getActiveCurrencyCode();
  const t = await getTranslations({locale, namespace: 'Errors'});

  try {
    const result = await mutate(AddToCartMutation, { variantId, quantity }, { useAuthToken: true, currencyCode });

    if (result.token) {
      await setAuthToken(result.token);
    }

    if (result.data.addItemToOrder.__typename === 'Order') {
      // Revalidate cart data across all pages
      updateTag('cart');
      updateTag('active-order');
      return { success: true, order: result.data.addItemToOrder };
    } else {
      return { success: false, error: result.data.addItemToOrder.message };
    }
  } catch {
    return { success: false, error: t('failedAddToCart') };
  }
}

export async function fetchProductDetail(slug: string) {
  const locale = await getLocale();
  const currencyCode = await getActiveCurrencyCode();

  try {
    const result = await query(GetProductDetailQuery, { slug }, { languageCode: locale, currencyCode });
    const product = result.data.product;
    if (!product) return null;

    const carouselImages = resolveProductCarouselImages(product.assets, slug);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      images: carouselImages,
      variants: product.variants,
      optionGroups: product.optionGroups,
      currencyCode,
    };
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return null;
  }
}

