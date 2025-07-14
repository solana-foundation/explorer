export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  try {
    const res = await fetch(url);
    const json = await res.json();
    return Response.json(json);
  } catch (err) {
    return new Response("Failed to fetch metadata", { status: 500 });
  }
}