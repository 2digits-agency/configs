/* @jsxImportSource @gpuix/react */
import { render } from '@gpuix/react';

import { App } from './App';
import { createGatewayReader } from './gateway';

render(<App reader={process.argv.includes('--live') ? createGatewayReader() : undefined} />, {
  title: 'TLO Workspace · GPUIX · DEMO',
  width: 1440,
  height: 900,
  focus: process.env.GPUIX_BACKGROUND !== '1',
});
