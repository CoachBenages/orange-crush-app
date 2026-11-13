// Orange Crush Lacrosse — live season calendar feed (iCalendar / .ics).
// Families subscribe once; cancellations and changes made in the app's Coach mode
// flow into their phone calendars on the next refresh.
//
// IMPORTANT: the season schedule below mirrors CONFIG / TEAMS / GAMES in index.html.
// When the schedule changes there, update it here too and redeploy.

const APP_URL = "https://coachbenages.github.io/orange-crush-app/";
const SEASON_START = "2027-04-08";
const PRACTICE_DAYS = [2, 4]; // Tue, Thu
const LOC = { name: "Naperville North HS · Turf Complex", addr: "899 N Mill St, Naperville, IL 60563" };
const GAME_ARRIVE_MIN = 20;

type Team = { id: string; prog: string; name: string; start: string; stop: string; last: string; days?: number[]; zone: string };
const TEAMS: Team[] = [
  { id: "prek", prog: "prek", name: "Pre-K Festival", start: "18:00", stop: "18:45", last: "2027-05-18", days: [2], zone: "Right field · stadium end" },
  { id: "u8b", prog: "boys", name: "U8 Boys", start: "18:00", stop: "19:00", last: "2027-05-20", zone: "Left field · stadium end" },
  { id: "u10b", prog: "boys", name: "U10 Boys", start: "18:00", stop: "19:15", last: "2027-05-20", zone: "Right field · middle" },
  { id: "u12b", prog: "boys", name: "U12 Boys", start: "19:00", stop: "20:30", last: "2027-05-20", zone: "Right field · stadium end" },
  { id: "u14b", prog: "boys", name: "U14 Boys", start: "19:00", stop: "20:30", last: "2027-05-20", zone: "Right field · bus-lot end" },
  { id: "u8g", prog: "girls", name: "U8 Girls", start: "18:00", stop: "19:00", last: "2027-05-20", zone: "Left field · bus-lot end" },
  { id: "u10g", prog: "girls", name: "U10 Girls", start: "18:00", stop: "19:15", last: "2027-05-20", zone: "Right field · bus-lot end" },
  { id: "u12g", prog: "girls", name: "U12 Girls", start: "19:00", stop: "20:30", last: "2027-05-20", zone: "Left field · stadium end" },
  { id: "u14g", prog: "girls", name: "U14 Girls", start: "19:00", stop: "20:30", last: "2027-05-20", zone: "Left field · bus-lot end" },
];
const TEAM: Record<string, Team> = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
const GAMES = [
  { key: "wk1", date: "2027-04-11", title: "Week 1" },
  { key: "wk2", date: "2027-04-18", title: "Week 2" },
  { key: "wk3", date: "2027-04-25", title: "Week 3" },
  { key: "wk4", date: "2027-05-09", title: "Week 4" },
  { key: "conf1", date: "2027-05-15", title: "Conference Playoffs" },
  { key: "conf2", date: "2027-05-16", title: "Conference Playoffs" },
  { key: "allstar", date: "2027-05-22", title: "All-Star Game" },
  { key: "state", date: "2027-05-23", title: "State Playoffs" },
];
const GAME_TEAMS = ["u8b", "u10b", "u12b", "u14b"];

type Ev = {
  id: string; type: string; teams: string[]; date: string; start: string; stop: string; title: string;
  locName: string; addr: string; zone: string; note: string; status: string; opp?: string; jersey?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
const parseD = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };

function baseEvents(): Ev[] {
  const out: Ev[] = [];
  for (const t of TEAMS) {
    for (let d = parseD(SEASON_START); d <= parseD(t.last); d.setUTCDate(d.getUTCDate() + 1)) {
      if (!(t.days || PRACTICE_DAYS).includes(d.getUTCDay())) continue;
      const ds = ymd(d);
      out.push({ id: "p-" + t.id + "-" + ds.replace(/-/g, ""), type: "practice", teams: [t.id], date: ds, start: t.start, stop: t.stop, title: "Practice", locName: LOC.name, addr: LOC.addr, zone: t.zone, note: "", status: "on" });
    }
  }
  for (const g of GAMES) for (const tid of GAME_TEAMS) {
    out.push({ id: "g-" + g.key + "-" + tid, type: "game", teams: [tid], date: g.date, start: "", stop: "", title: g.title, locName: "", addr: "", zone: "", note: "", status: "on" });
  }
  return out;
}

function matches(e: Ev, tid: string) {
  return e.teams.some((x) => x === tid || x === "all" || x === TEAM[tid].prog);
}

function esc(s: string) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function fold(line: string) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 74) return line;
  const parts: string[] = []; let cur = "";
  for (const ch of line) {
    if (enc.encode(cur + ch).length > 73) { parts.push(cur); cur = " " + ch; } else cur += ch;
  }
  parts.push(cur);
  return parts.join("\r\n");
}
const dt = (date: string, hm: string) => date.replace(/-/g, "") + "T" + hm.replace(":", "") + "00";
function addMin(hm: string, m: number) {
  const [h, mi] = hm.split(":").map(Number); let t = h * 60 + mi + m; t = (t + 1440) % 1440;
  return pad(Math.floor(t / 60)) + ":" + pad(t % 60);
}
function fmt12(hm: string) { let [h, m] = hm.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + pad(m) + " " + ap; }

const VTZ = [
  "BEGIN:VTIMEZONE", "TZID:America/Chicago",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:-0600", "TZOFFSETTO:-0500", "TZNAME:CDT", "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0600", "TZNAME:CST", "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "END:STANDARD",
  "END:VTIMEZONE",
];

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const want = (url.searchParams.get("teams") || "").split(/[,\-\s]+/).filter((x) => TEAM[x]);
  const teams = want.length ? want : TEAMS.map((t) => t.id);
  const only = url.searchParams.get("id") || "";

  let data: any = { overrides: {}, custom: [] }; let updated = new Date().toISOString();
  try {
    const r = await fetch(Deno.env.get("SUPABASE_URL") + "/rest/v1/crush_state?id=eq.1&select=data,updated_at", {
      headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY")!, Authorization: "Bearer " + Deno.env.get("SUPABASE_ANON_KEY") },
    });
    const j = await r.json();
    if (j && j[0]) { data = j[0].data || data; updated = j[0].updated_at || updated; }
  } catch (_) { /* fall back to the regular schedule */ }

  const overrides = data.overrides || {};
  const custom: Ev[] = (Array.isArray(data.custom) ? data.custom : []).map((c: any) => ({
    id: c.id, type: c.type || "event", teams: c.teams || [], date: c.date, start: c.start || "", stop: c.stop || "",
    title: c.title || "Event", locName: c.locName || (c.loc === "nnhs" ? LOC.name : ""), addr: c.addr || (c.loc === "nnhs" ? LOC.addr : ""),
    zone: c.zone || "", note: c.note || "", status: "on", opp: c.opp, jersey: c.jersey,
  }));

  const events = baseEvents().concat(custom).map((e) => {
    const o = overrides[e.id] || {};
    const ev: Ev = { ...e };
    if (o.status) ev.status = o.status;
    if (o.note != null) ev.note = o.note;
    if (o.start) ev.start = o.start;
    if (o.stop) ev.stop = o.stop;
    if (o.locName) { ev.locName = o.locName; ev.zone = ""; }
    if (o.addr) ev.addr = o.addr;
    if (o.zone) ev.zone = o.zone;
    if (o.opp) ev.opp = o.opp;
    if (o.jersey) ev.jersey = o.jersey;
    return ev;
  }).filter((e) => only ? e.id === only : teams.some((tid) => matches(e, tid)));

  const stamp = updated.replace(/[-:]/g, "").replace(/\.\d+/, "").replace(/\+00$|Z$/, "") .slice(0, 15) + "Z";
  const seq = Math.floor(new Date(updated).getTime() / 60000) % 2000000000;
  const calName = "Orange Crush · " + (want.length ? want.map((t) => TEAM[t].name).join(", ") : "All teams");

  const L: string[] = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Orange Crush Lacrosse//Parent Hub//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:" + esc(calName), "X-WR-TIMEZONE:America/Chicago",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H",
    ...VTZ,
  ];
  for (const e of events) {
    const who = e.teams.map((t) => TEAM[t] ? TEAM[t].name : t === "all" ? "All teams" : t === "boys" ? "All Boys" : t === "girls" ? "All Girls" : t).join(", ");
    let summary = who + " " + (e.type === "practice" ? "Practice" : e.title + (e.opp ? " vs " + e.opp : ""));
    if (e.status === "cancelled") summary = "CANCELLED: " + summary;
    else if (e.status === "moved") summary = "CHANGED: " + summary;
    const desc: string[] = [];
    if (e.status === "cancelled") desc.push("This has been cancelled.");
    if (e.note) desc.push(e.note);
    if (e.type === "game" && e.start) desc.push("Arrive by " + fmt12(addMin(e.start, -GAME_ARRIVE_MIN)) + " (" + GAME_ARRIVE_MIN + " minutes early).");
    if (e.jersey) desc.push("Wear: " + e.jersey);
    if (e.zone) desc.push("Field: " + e.zone);
    if (!e.start) desc.push("Time TBA");
    if (!e.addr) desc.push("Location TBA");
    desc.push("Orange Crush app: " + APP_URL);

    L.push("BEGIN:VEVENT", "UID:" + e.id + "@orangecrush.napervillelacrosse", "DTSTAMP:" + stamp, "LAST-MODIFIED:" + stamp, "SEQUENCE:" + seq);
    if (e.start) {
      L.push("DTSTART;TZID=America/Chicago:" + dt(e.date, e.start));
      L.push("DTEND;TZID=America/Chicago:" + dt(e.date, e.stop || addMin(e.start, 60)));
    } else {
      const n = parseD(e.date); n.setUTCDate(n.getUTCDate() + 1);
      L.push("DTSTART;VALUE=DATE:" + e.date.replace(/-/g, ""), "DTEND;VALUE=DATE:" + ymd(n).replace(/-/g, ""));
    }
    L.push("SUMMARY:" + esc(summary), "DESCRIPTION:" + esc(desc.join("\n")));
    if (e.addr) L.push("LOCATION:" + esc(e.locName + ", " + e.addr));
    L.push("STATUS:" + (e.status === "cancelled" ? "CANCELLED" : "CONFIRMED"), "URL:" + APP_URL, "END:VEVENT");
  }
  L.push("END:VCALENDAR");
  const body = L.map(fold).join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="orange-crush.ics"',
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
