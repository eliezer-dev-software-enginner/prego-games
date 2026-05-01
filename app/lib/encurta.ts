// app/lib/encurta.ts

export async function encurtarUrl(
  url: string,
  alias: string,
): Promise<string | null> {
  const apiKey = process.env.ENCURTA_NET_API_KEY;
  if (!apiKey) {
    console.warn("[encurta] ENCURTA_NET_API_KEY não definida");
    return null;
  }

  const params = new URLSearchParams({
    api: apiKey,
    url,
  });

  const fullUrl = `https://encurta.net/api?${params.toString()}`;
  console.log("[encurta] Chamando:", fullUrl);

  try {
    const res = await fetch(fullUrl);
    const text = await res.text();
    console.log("[encurta] Status:", res.status);
    console.log("[encurta] Resposta raw:", text);

    if (!res.ok) {
      console.error("[encurta] HTTP error:", res.status);
      return null;
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("[encurta] Resposta não é JSON válido:", text);
      return null;
    }

    if (data.status !== "success") {
      console.error("[encurta] API error:", data.message);
      return null;
    }

    return data.shortenedUrl as string;
  } catch (err) {
    console.error("[encurta] Falha ao encurtar URL:", err);
    return null;
  }
}
