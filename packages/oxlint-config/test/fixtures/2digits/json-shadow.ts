interface Response {
  json: () => Promise<unknown>;
}

export async function custom(response: Response): Promise<{ id: string }> {
  return (await response.json()) as { id: string };
}
