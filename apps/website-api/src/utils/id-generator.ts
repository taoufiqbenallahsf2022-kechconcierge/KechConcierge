import crypto from "crypto";

export function generateIndividualId(): string {
  return "00IW" + crypto.randomBytes(7).toString("hex").toUpperCase();
}

export function generateLeadId(): string {
  return (
    "00L" + crypto.randomBytes(8).toString("hex").toUpperCase().substring(0, 15)
  );
}
