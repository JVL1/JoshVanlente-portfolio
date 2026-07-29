import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";
import { normalizeOgTitle } from "@/lib/og-title";

export const runtime = "edge";

const interFont = fetch(
  new URL("../../../public/fonts/Inter.ttf", import.meta.url),
).then((response) => response.arrayBuffer());

export async function GET(request: Request) {
  const title = normalizeOgTitle(
    new URL(request.url).searchParams.get("title"),
  );
  const fontData = await interFont;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "#0a0b0b",
          color: "#eceeec",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter",
          height: "100%",
          justifyContent: "center",
          padding: 160,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 112,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            maxWidth: 1600,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 96,
          }}
        >
          <div style={{ display: "flex", fontSize: 48, lineHeight: 1.2 }}>
            {profile.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              lineHeight: 1.3,
              marginTop: 16,
            }}
          >
            {profile.role}
          </div>
        </div>
      </div>
    ),
    {
      width: 1920,
      height: 1080,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          style: "normal",
        },
      ],
    },
  );
}
