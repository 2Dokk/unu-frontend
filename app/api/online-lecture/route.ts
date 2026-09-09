import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/);
const lectureSchema = z.string().trim().min(1).max(200);

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("bootstrap") }),
  z.object({ action: z.literal("my-reservations") }),
  z.object({
    action: z.literal("lecture-account"),
    lecture: lectureSchema,
    date: dateSchema,
  }),
  z.object({
    action: z.literal("save-cart"),
    items: z
      .array(
        z.object({
          lecture: lectureSchema,
          date: dateSchema,
          times: z.array(timeSchema).max(48),
          addTimes: z.array(timeSchema).max(48),
          removeTimes: z.array(timeSchema).max(48),
        }),
      )
      .min(1)
      .max(50),
  }),
  z.object({
    action: z.literal("cancel"),
    ids: z.array(z.number().int().positive()).min(1).max(200),
  }),
]);

interface LectureParticipant {
  status?: string;
  activity?: { activityType?: { code?: string } };
  user?: { studentId?: string; name?: string };
}

class RouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function backendApiUrl(request: NextRequest, path: string): string {
  const base =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080/api";
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = path.replace(/^\//, "");

  if (/^https?:\/\//.test(normalizedBase)) {
    return `${normalizedBase}/${normalizedPath}`;
  }
  return new URL(`${normalizedBase}/${normalizedPath}`, request.nextUrl.origin).toString();
}

async function getAuthenticatedLectureMember(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw new RouteError("UNAUTHORIZED", 401);

  const response = await fetch(
    backendApiUrl(request, "/activity-participants/me"),
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new RouteError(response.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", response.status === 401 ? 401 : 403);
  }

  const participations = (await response.json()) as LectureParticipant[];
  const participant = participations.find(
    (item) =>
      item.status === "APPROVED" &&
      item.activity?.activityType?.code === "LECTURE",
  );
  const studentId = participant?.user?.studentId?.trim();
  const name = participant?.user?.name?.trim();

  if (!studentId || !/^\d+$/.test(studentId) || !name) {
    throw new RouteError("NO_ENROLLMENT", 403);
  }
  return { studentId, name };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    const member = await getAuthenticatedLectureMember(request);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const accessCode = process.env.ONLINE_LECTURE_ACCESS_CODE;

    if (!supabaseUrl || !supabaseAnonKey || !accessCode) {
      throw new RouteError("SERVER_CONFIGURATION_ERROR", 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    const identity = {
      p_student_id: member.studentId,
      p_name: member.name,
      p_access_code: accessCode,
    };

    switch (parsed.data.action) {
      case "bootstrap": {
        const [lecturesResult, reservationsResult] = await Promise.all([
          supabase.rpc("get_lectures_for_member", identity),
          supabase.rpc("get_my_reservations", identity),
        ]);
        const error = lecturesResult.error ?? reservationsResult.error;
        if (error) throw new RouteError(error.message, 400);
        return NextResponse.json({
          data: {
            lectures: lecturesResult.data ?? [],
            reservations: reservationsResult.data ?? [],
          },
        });
      }
      case "my-reservations": {
        const { data, error } = await supabase.rpc("get_my_reservations", identity);
        if (error) throw new RouteError(error.message, 400);
        return NextResponse.json({ data: data ?? [] });
      }
      case "lecture-account": {
        const { data, error } = await supabase.rpc("get_lecture_account", {
          ...identity,
          p_lecture: parsed.data.lecture,
          p_date: parsed.data.date,
        });
        if (error) throw new RouteError(error.message, 400);
        return NextResponse.json({ data: data?.[0] ?? null });
      }
      case "save-cart": {
        const { error } = await supabase.rpc("save_reservation_cart", {
          ...identity,
          p_student_id: Number(member.studentId),
          p_items: parsed.data.items,
        });
        if (error) throw new RouteError(error.message, 400);
        return NextResponse.json({ data: null });
      }
      case "cancel": {
        const { data, error } = await supabase.rpc("cancel_reservations", {
          ...identity,
          p_student_id: Number(member.studentId),
          p_ids: parsed.data.ids,
        });
        if (error) throw new RouteError(error.message, 400);
        return NextResponse.json({ data: data ?? 0 });
      }
    }
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
