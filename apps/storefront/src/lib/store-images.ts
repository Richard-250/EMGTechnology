/**

 * Storefront images provided in /public/images (user uploads).

 */

export const STORE_IMAGES = {

    hero: '/images/hero-gym.jpg',

    cardio: '/images/cat-cardio.jpg',

    strength: '/images/cat-strength.jpg',

    homeGyms: '/images/cat-home-gyms.jpg',

    accessories: '/images/cat-accessories.jpg',

} as const;



/** Per-product image map — photos from /images/products/{slug}.jpg */

export const PRODUCT_IMAGE_BY_SLUG: Record<string, string> = {

    'emg-pro-elliptical': '/images/products/emg-pro-elliptical.jpg',

    'emg-recumbent-bike-x3': '/images/products/emg-recumbent-bike-x3.jpg',

    'emg-upright-bike-s2': '/images/products/emg-upright-bike-s2.jpg',

    'emg-studio-indoor-cycle': '/images/products/emg-studio-indoor-cycle.jpg',

    'emg-rowing-machine-r1': '/images/products/emg-rowing-machine-r1.jpg',

    'emg-power-rack-pro': '/images/products/emg-power-rack-pro.jpg',

    'emg-adjustable-dumbbells-40kg': '/images/products/emg-adjustable-dumbbells-40kg.jpg',

    'emg-olympic-barbell-20kg': '/images/products/emg-olympic-barbell-20kg.jpg',

    'emg-kettlebell-set': '/images/products/emg-kettlebell-set.jpg',

    'emg-functional-trainer': '/images/products/emg-functional-trainer.jpg',

    'emg-home-gym-station': '/images/products/emg-home-gym-station.jpg',

    'emg-yoga-mat-pro': '/images/products/emg-yoga-mat-pro.jpg',

    'emg-resistance-band-pack': '/images/products/emg-resistance-band-pack.jpg',

    'emg-ab-roller-kit': '/images/products/emg-ab-roller-kit.jpg',

    'emg-jump-rope-speed': '/images/products/emg-jump-rope-speed.jpg',

};



export function getStoreProductImage(slug: string): string {

    return PRODUCT_IMAGE_BY_SLUG[slug] ?? STORE_IMAGES.hero;

}


