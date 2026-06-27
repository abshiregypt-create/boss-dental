import { test, expect } from "@playwright/test";

/**
 * Exercises the REAL WhatsApp booking agent through the local simulator
 * (no Meta credentials needed). A full conversation drives the date/time
 * parsers, the state machine, conversation persistence, and booking creation.
 */
const phone = "+201000000777";

async function say(request, text) {
  const res = await request.post("/api/whatsapp/simulate", { data: { phone, text } });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

test("full WhatsApp booking conversation creates a pending appointment", async ({ request }) => {
  // greet -> service menu
  let r = await say(request, "حجز");
  expect(r.replies.join("\n")).toContain("اختر الخدمة");

  // choose service #1 (Check-up) -> asks for date
  r = await say(request, "1");
  expect(r.replies.join("\n")).toMatch(/التاريخ|يوم/);

  // date "tomorrow" -> asks for time
  r = await say(request, "بكرة");
  expect(r.replies.join("\n")).toMatch(/وقت|١٢|12/);

  // time "5 مساءً" -> asks for name
  r = await say(request, "5 مساءً");
  expect(r.replies.join("\n")).toContain("اسمك");

  // name -> confirmation summary
  r = await say(request, "أحمد كمال");
  expect(r.replies.join("\n")).toMatch(/تأكيد|أحمد كمال/);

  // confirm -> booking created with a tracking code
  r = await say(request, "تأكيد");
  expect(r.bookingCode).toBeTruthy();
  expect(r.replies.join("\n")).toContain(r.bookingCode);

  // the booking is real and visible on the public tracker as pending
  const track = await request.get(`/api/track/${r.bookingCode}`);
  expect(track.ok()).toBeTruthy();
  const data = await track.json();
  expect(data.stage).toBe("pending");
});

test("agent rejects Fridays and out-of-hours, and cancels on request", async ({ request }) => {
  const p2 = "+201000000888";
  const say2 = async (text) =>
    (await request.post("/api/whatsapp/simulate", { data: { phone: p2, text } })).json();

  await say2("حجز");
  await say2("2"); // a service
  // Friday 2026-07-03 is a Friday -> should be rejected
  let r = await say2("3/7/2026");
  expect(r.replies.join("\n")).toMatch(/الجمعة|Friday/);

  // a valid upcoming day, then an out-of-hours time
  await say2("بعد بكرة");
  r = await say2("8 صباحًا"); // 08:00, before noon opening
  expect(r.replies.join("\n")).toMatch(/مواعيد العمل|hours/);

  // cancel resets the flow
  r = await say2("إلغاء");
  expect(r.replies.join("\n")).toMatch(/إلغاء|cancel/i);
});
