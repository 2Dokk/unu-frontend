import { NextRequest, NextResponse } from "next/server";

export async function requireManager(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const authCheck = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity-participants`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!authCheck.ok) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return null;
}
