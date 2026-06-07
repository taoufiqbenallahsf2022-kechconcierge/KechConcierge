import crypto from "crypto";

export function generateIndividualId(): string {
  return (
    "00I" +
    crypto
      .randomBytes(8)
      .toString("hex")
      .toUpperCase()
      .substring(0, 15)
  );
}

export function generateLeadId(): string {
  return (
    "00L" +
    crypto
      .randomBytes(8)
      .toString("hex")
      .toUpperCase()
      .substring(0, 15)
  );
}