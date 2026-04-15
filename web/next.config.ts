import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const USER_API = process.env.USER_API_URL || 'http://localhost:4001';
const SEARCH_API = process.env.SEARCH_API_URL || 'http://localhost:4002';
const BOOKING_API = process.env.BOOKING_API_URL || 'http://localhost:4003';
const PAYMENT_API = process.env.PAYMENT_API_URL || 'http://localhost:4004';
const TICKET_API = process.env.TICKET_API_URL || 'http://localhost:4005';
const OPERATOR_API = process.env.OPERATOR_API_URL || 'http://localhost:4007';
const REVIEW_API = process.env.REVIEW_API_URL || 'http://localhost:4008';
const WAITLIST_API = process.env.WAITLIST_API_URL || 'http://localhost:4009';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      { source: '/api/v1/users/:path*', destination: `${USER_API}/api/v1/users/:path*` },
      { source: '/api/v1/search/:path*', destination: `${SEARCH_API}/api/v1/search/:path*` },
      { source: '/api/v1/bookings/:path*', destination: `${BOOKING_API}/api/v1/bookings/:path*` },
      { source: '/api/v1/payments/:path*', destination: `${PAYMENT_API}/api/v1/payments/:path*` },
      { source: '/api/v1/tickets/:path*', destination: `${TICKET_API}/api/v1/tickets/:path*` },
      { source: '/api/v1/operator/:path*', destination: `${OPERATOR_API}/api/v1/operator/:path*` },
      { source: '/api/v1/reviews/:path*', destination: `${REVIEW_API}/api/v1/reviews/:path*` },
      { source: '/api/v1/reviews', destination: `${REVIEW_API}/api/v1/reviews` },
      { source: '/api/v1/waitlist/:path*', destination: `${WAITLIST_API}/api/v1/waitlist/:path*` },
      { source: '/api/v1/waitlist', destination: `${WAITLIST_API}/api/v1/waitlist` },
    ];
  },
};

export default withNextIntl(nextConfig);
