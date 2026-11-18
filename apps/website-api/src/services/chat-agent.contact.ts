type HandoffContact = { firstName: string | null; lastName: string | null; email: string | null; phone: string | null };
const present = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function assertHandoffContact(contact: HandoffContact) {
  const missing: string[] = [];
  if (!present(contact.firstName) || !present(contact.lastName)) missing.push("full name (first and last name)");
  const emailValid = present(contact.email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim());
  const phone = present(contact.phone) ? contact.phone.trim() : "";
  const digits = phone.replace(/\D/g, "");
  const phoneValid = /^[+\d\s().-]+$/.test(phone) && digits.length >= 7 && digits.length <= 15;
  if (!emailValid && !phoneValid) missing.push("a valid email address OR phone number");
  if (missing.length) throw new Error("Before transferring to Asmaa, collect " + missing.join(" and ") + ". Ask only for missing details, explaining that Asmaa needs a way to reach the visitor if they leave the website. Keep Cécile assigned and do not prepare a contact request or email until these details and transfer consent are present.");
}
