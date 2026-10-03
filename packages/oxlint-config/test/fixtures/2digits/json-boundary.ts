interface User {
  id: string;
}

export function parse(raw: string): User {
  return JSON.parse(raw) as User;
}

export async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
