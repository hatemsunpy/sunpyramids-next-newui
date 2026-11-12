import { getEgyptWeather, WEATHER_REVALIDATE_SECONDS } from "@/lib/weather";

export async function GET() {
  const snapshot = await getEgyptWeather();
  if (!snapshot) {
    return Response.json(
      { error: "weather-unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(snapshot, {
    status: 200,
    headers: {
      "Cache-Control": `public, s-maxage=${WEATHER_REVALIDATE_SECONDS}, stale-while-revalidate=${WEATHER_REVALIDATE_SECONDS * 2}`,
    },
  });
}
