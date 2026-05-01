// app/lib/shrinkearn.ts

export async function encurtarUrl(
  url: string,
  alias: string,
): Promise<string | null> {
  const apiKey = process.env.SHRINKEARN_API_KEY;
  if (!apiKey) {
    console.warn("[shrinkearn] SHRINKEARN_API_KEY não definida");
    return null;
  }

  const params = new URLSearchParams({
    api: apiKey,
    url,
  });

  const fullUrl = `https://shrinkearn.com/api?${params.toString()}`;
  console.log("[shrinkearn] Chamando:", fullUrl);

  try {
    const res = await fetch(fullUrl);
    const text = await res.text();
    console.log("[shrinkearn] Status:", res.status);
    console.log("[shrinkearn] Resposta raw:", text);

    if (!res.ok) {
      console.error("[shrinkearn] HTTP error:", res.status);
      return null;
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("[shrinkearn] Resposta não é JSON válido:", text);
      return null;
    }

    if (data.status !== "success") {
      console.error("[shrinkearn] API error:", data.message);
      return null;
    }

    return data.shortenedUrl as string;
  } catch (err) {
    console.error("[shrinkearn] Falha ao encurtar URL:", err);
    return null;
  }
}
