import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: import('next').NextConfig = {
    output: 'standalone',
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },
};

export default withNextIntl(nextConfig);
