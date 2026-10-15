/* @jsxImportSource @gpuix/react */
import { render } from '@gpuix/react';

import { App } from './App';

// Same retained tree and Rust/GPUI renderer as desktop; no gateway or OAuth code.
render(<App />, { title: 'TLO Workspace · GPUIX · DEMO' });
