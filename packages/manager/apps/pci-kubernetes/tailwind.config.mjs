import config from '@ovh-ux/manager-tailwind-config';
import path from 'path';
import { createRequire } from 'node:module';
import odsPlugin from '@datatr-ux/ods-tailwind-config';

const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...config,
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    path.join(
      path.dirname(require.resolve('@ovh-ux/manager-react-components')),
      '**/*.{js,jsx,ts,tsx}',
    ),
    path.join(
      path.dirname(require.resolve('@ovh-ux/manager-pci-common')),
      '**/*.{js,jsx,ts,tsx}',
    ),
  ],
  corePlugins: {
    preflight: false,
  },
  plugins: [odsPlugin],
};
