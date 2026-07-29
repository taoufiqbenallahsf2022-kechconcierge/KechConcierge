import type { AutomationScheduleType } from "../../../../packages/database/generated/prisma/client.js";

export type ScheduleConfig = {
  scheduleType: AutomationScheduleType;
  scheduleMinute: number;
  scheduleHour: number | null;
  scheduleDayOfWeek: number | null;
  scheduleDayOfMonth: number | null;
  scheduleTimezone: string;
  scheduleStartAt: Date | null;
  scheduleEndAt: Date | null;
};

const parts = (date: Date, timeZone: string) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

const weekdays: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export function nextRunAt(config: ScheduleConfig, from = new Date()) {
  if (config.scheduleType === "MANUAL") return null;
  const start = config.scheduleStartAt;
  if (!start)
    throw Object.assign(new Error("A schedule start date and time is required"), { status: 400 });
  if (config.scheduleEndAt && config.scheduleEndAt <= start)
    throw Object.assign(new Error("End date must be later than the start date"), { status: 400 });
  if (config.scheduleType === "HOURLY") {
    const elapsed = from < start ? 0 : Math.floor((from.getTime() - start.getTime()) / 3_600_000) + 1;
    const next = new Date(start.getTime() + elapsed * 3_600_000);
    return config.scheduleEndAt && next > config.scheduleEndAt ? null : next;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: config.scheduleTimezone });
  } catch {
    throw Object.assign(new Error("Schedule timezone is invalid"), { status: 400 });
  }
  const cursor = new Date(from < start ? start.getTime() - 60_000 : from);
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  for (let i = 0; i < 60 * 24 * 40; i++, cursor.setUTCMinutes(cursor.getUTCMinutes() + 1)) {
    const local = parts(cursor, config.scheduleTimezone);
    const minute = Number(local.minute);
    const hour = Number(local.hour);
    const day = Number(local.day);
    const weekday = weekdays[String(local.weekday)]!;
    const matches =
      minute === config.scheduleMinute &&
      hour === config.scheduleHour &&
      (config.scheduleType === "DAILY" ||
        (config.scheduleType === "WEEKLY" && weekday === config.scheduleDayOfWeek) ||
        (config.scheduleType === "MONTHLY" && day === config.scheduleDayOfMonth));
    if (matches) {
      const next = new Date(cursor);
      return config.scheduleEndAt && next > config.scheduleEndAt ? null : next;
    }
  }
  throw new Error("Could not calculate the next scheduled run");
}

export function scheduleData(body: any): ScheduleConfig {
  const scheduleType = String(body.scheduleType ?? "MANUAL") as AutomationScheduleType;
  if (!["MANUAL", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"].includes(scheduleType))
    throw Object.assign(new Error("Invalid schedule frequency"), { status: 400 });
  const integer = (value: unknown, fallback: number, min: number, max: number) => {
    const parsed = value === "" || value == null ? fallback : Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max)
      throw Object.assign(new Error(`Schedule value must be between ${min} and ${max}`), { status: 400 });
    return parsed;
  };
  const parseDate = (value: unknown, label: string) => {
    const date = typeof value === "string" ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime()))
      throw Object.assign(new Error(`${label} date and time is invalid`), { status: 400 });
    return date;
  };
  const scheduleStartAt = scheduleType === "MANUAL" ? null : parseDate(body.scheduleStartAt, "Schedule start");
  const scheduleEndAt = scheduleType === "MANUAL" || !body.scheduleEndAt ? null : parseDate(body.scheduleEndAt, "Schedule end");
  const scheduleTimezone = String(body.scheduleTimezone || "Africa/Casablanca");
  const startParts = scheduleStartAt ? parts(scheduleStartAt, scheduleTimezone) : {};
  return {
    scheduleType,
    scheduleMinute: scheduleStartAt ? Number(startParts.minute) : integer(body.scheduleMinute, 0, 0, 59),
    scheduleHour: scheduleType === "HOURLY" || scheduleType === "MANUAL" ? null : Number(startParts.hour),
    scheduleDayOfWeek: scheduleType === "WEEKLY" ? weekdays[String(startParts.weekday)]! : null,
    scheduleDayOfMonth: scheduleType === "MONTHLY" ? Number(startParts.day) : null,
    scheduleTimezone,
    scheduleStartAt,
    scheduleEndAt,
  };
}
