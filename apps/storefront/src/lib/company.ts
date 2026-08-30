/**
 * Official EMG Technology Ltd business details for the storefront.
 */
export const COMPANY = {
    legalName: 'EMG Technology Ltd',
    shortName: 'EMG Technology',
    email: 'dusmanuel40@icloud.com',
    phone: '+250796345773',
    phoneDisplay: '+250 796 345 773',
    address: {
        road: 'KN 81 St',
        building: 'KCT Ground Floor',
        city: 'Kigali',
        country: 'Rwanda',
    },
    mapUrl: 'https://maps.app.goo.gl/tWVenRVjRNCRZVPUA?g_st=ic',
    social: {
        instagram: 'https://www.instagram.com/emgymtech?igsh=MXF6emxkc3cxY3Z1MQ%3D%3D&utm_source=qr',
        tiktok: 'https://www.tiktok.com/@emgymtechnologyltd',
    },
} as const;

export function formatCompanyAddress(): string {
    const {road, building, city, country} = COMPANY.address;
    return `${building}, ${road}, ${city}, ${country}`;
}
