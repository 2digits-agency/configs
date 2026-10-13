import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const config = {
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: process.env.PUBLIC_URL ? [new URL(process.env.PUBLIC_URL).hostname] : undefined,
};

export default withMDX(config);
