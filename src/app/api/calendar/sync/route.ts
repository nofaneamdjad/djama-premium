import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/* ═══════════════════════════════════════════════════
   POST /api/calendar/sync
   — Exporte les agenda_events des 60 prochains jours
     vers Google Calendar (upsert par gcal_event_id)
   — Importe les événements Google du même périmètre
     non encore présents dans agenda_events
═══════════════════════════════════════════════════ */

type GCalEvent = {
  id: string;
  summary?: string;
  description?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  status?: string;
};

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function POST(req: NextRequest) {
  /* Auth utilisateur */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /* Récupérer les tokens stockés */
  const { data: tokenRow } = await supabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!tokenRow) {
    return NextResponse.json(
      { error: "Google Calendar non connecté — veuillez d'abord autoriser l'accès." },
      { status: 403 }
    );
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  let accessToken: string = tokenRow.access_token;

  /* Rafraîchir si expiré */
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) <= new Date()) {
    if (!tokenRow.refresh_token) {
      return NextResponse.json(
        { error: "Token expiré et aucun refresh_token disponible. Reconnectez Google Calendar." },
        { status: 403 }
      );
    }
    const refreshed = await refreshAccessToken(
      tokenRow.refresh_token,
      clientId,
      clientSecret
    );
    if (!refreshed) {
      return NextResponse.json(
        { error: "Impossible de rafraîchir le token Google Calendar." },
        { status: 403 }
      );
    }
    accessToken = refreshed.access_token;
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await supabase
      .from("google_calendar_tokens")
      .update({ access_token: accessToken, expires_at: newExpiry, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  }

  const calendarId = tokenRow.calendar_id ?? "primary";

  /* Périmètre : aujourd'hui → +90 jours */
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  /* ── Export : agenda_events → Google Calendar ── */
  const { data: localEvents } = await supabase
    .from("agenda_events")
    .select("*")
    .eq("user_id", user.id)
    .gte("event_date", timeMin.slice(0, 10))
    .lte("event_date", timeMax.slice(0, 10));

  let exported = 0;
  let errors   = 0;

  for (const ev of (localEvents ?? [])) {
    const startDate   = ev.event_date as string;
    const startTime   = ev.event_time as string | null;
    const gcalEventId = ev.gcal_event_id as string | null;

    const gcalBody = {
      summary:     ev.title,
      description: ev.description ?? "",
      start: startTime
        ? { dateTime: `${startDate}T${startTime}:00`, timeZone: "Europe/Paris" }
        : { date: startDate },
      end: startTime
        ? { dateTime: `${startDate}T${startTime}:00`, timeZone: "Europe/Paris" }
        : { date: startDate },
    };

    let gcalRes: Response;

    if (gcalEventId) {
      /* UPDATE */
      gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${gcalEventId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gcalBody),
        }
      );
    } else {
      /* CREATE */
      gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gcalBody),
        }
      );
    }

    if (gcalRes.ok) {
      const created = (await gcalRes.json()) as GCalEvent;
      if (!gcalEventId) {
        /* Sauvegarder l'ID Google pour les futures syncs */
        await supabase
          .from("agenda_events")
          .update({ gcal_event_id: created.id })
          .eq("id", ev.id);
      }
      exported++;
    } else {
      errors++;
    }
  }

  /* ── Import : Google Calendar → agenda_events ── */
  const listRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      }),
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  let imported = 0;

  if (listRes.ok) {
    const listData = (await listRes.json()) as { items?: GCalEvent[] };
    const gcalItems = listData.items ?? [];

    /* IDs Google déjà présents dans Supabase */
    const { data: existingRows } = await supabase
      .from("agenda_events")
      .select("gcal_event_id")
      .eq("user_id", user.id)
      .not("gcal_event_id", "is", null);

    const existingGcalIds = new Set(
      (existingRows ?? []).map((r: { gcal_event_id: string }) => r.gcal_event_id)
    );

    for (const item of gcalItems) {
      if (item.status === "cancelled") continue;
      if (existingGcalIds.has(item.id)) continue; // déjà synced

      const rawDate =
        item.start?.date ?? item.start?.dateTime?.slice(0, 10) ?? null;
      if (!rawDate) continue;

      const rawTime = item.start?.dateTime
        ? item.start.dateTime.slice(11, 16)
        : null;

      await supabase.from("agenda_events").insert({
        user_id:      user.id,
        title:        item.summary ?? "(Sans titre)",
        description:  item.description ?? "",
        event_date:   rawDate,
        event_time:   rawTime,
        category:     "autre",
        gcal_event_id: item.id,
      });
      imported++;
    }
  }

  /* Mettre à jour last_sync_at */
  await supabase
    .from("google_calendar_tokens")
    .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return NextResponse.json({
    ok: true,
    exported,
    imported,
    errors,
    synced_at: new Date().toISOString(),
  });
}

/* ── DELETE /api/calendar/sync — Déconnecter Google Calendar ── */
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("google_calendar_tokens").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

/* ── GET /api/calendar/sync — Vérifier si connecté ── */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ connected: false });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("google_calendar_tokens")
    .select("last_sync_at, expires_at")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    connected:    !!data,
    last_sync_at: data?.last_sync_at ?? null,
    expires_at:   data?.expires_at ?? null,
  });
}
