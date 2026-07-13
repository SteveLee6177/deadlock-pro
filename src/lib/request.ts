export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function parseDateInput(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}
