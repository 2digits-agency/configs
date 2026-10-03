const vat: Record<string, string> = { DE: '7.4' };

export function vatCodeFor(country: string) {
  return vat[country] ?? '6';
}

export function guardedRead(country: string) {
  if (Object.hasOwn(vat, country)) {
    return vat[country] ?? '6';
  }
  return '6';
}

export function copy(input: Record<string, string>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = value;
  }
  return result;
}
