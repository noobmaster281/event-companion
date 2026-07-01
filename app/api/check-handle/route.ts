import { NextRequest, NextResponse } from "next/server";

// Validates that a social handle exists by checking the public profile URL.
// We hit each platform's public page and look for non-404/non-error responses.
// This is best-effort — platforms may rate-limit. Good enough for MVP.

async function checkInstagram(handle: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.instagram.com/${handle}/`, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function checkTikTok(handle: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.tiktok.com/@${handle}`, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function checkSnapchat(handle: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.snapchat.com/add/${handle}`, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { platform, handle } = await req.json();

    if (!platform || !handle || typeof handle !== "string") {
      return NextResponse.json(
        { error: "Missing platform or handle" },
        { status: 400 }
      );
    }

    // Strip leading @ if present
    const cleanHandle = handle.replace(/^@/, "").trim();
    if (!/^[a-zA-Z0-9._]+$/.test(cleanHandle)) {
      return NextResponse.json(
        { exists: false, error: "Invalid handle format" },
        { status: 200 }
      );
    }

    let exists = false;
    switch (platform) {
      case "instagram":
        exists = await checkInstagram(cleanHandle);
        break;
      case "tiktok":
        exists = await checkTikTok(cleanHandle);
        break;
      case "snapchat":
        exists = await checkSnapchat(cleanHandle);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown platform" },
          { status: 400 }
        );
    }

    return NextResponse.json({ exists, handle: cleanHandle });
  } catch (err) {
    console.error("[check-handle]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
