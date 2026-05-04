import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#faf9f5",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo wordmark */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#a16207",
            display: "flex",
          }}
        >
          Epigram
        </div>

        {/* Main copy */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "60px",
              fontWeight: 700,
              color: "#141310",
              lineHeight: 1.1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Quant Interview Prep,</span>
            <span>Restructured.</span>
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#4a4a42",
              marginTop: "28px",
              display: "flex",
            }}
          >
            4-week curriculum · Human-verified problems · Top firm strategies
          </div>
        </div>

        {/* Domain */}
        <div style={{ fontSize: "20px", color: "#a16207", display: "flex" }}>
          epi-gram.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
