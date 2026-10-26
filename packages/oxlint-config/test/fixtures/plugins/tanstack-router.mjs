import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  loader: () => 1,
  beforeLoad: () => 2,
});
