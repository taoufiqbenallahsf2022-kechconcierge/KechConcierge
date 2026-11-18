import Link from "next/link";
import { Fragment } from "react";

// Render only links to existing public routes. No HTML or external URLs from
// generated messages can become executable markup.
export function ChatMessageText({ message }: { message: string }) {
  const parts = message.split(/(\[[^\]\n]+\]\([^\s)]+\))/g);
  return <>{parts.map((part, index) => {
    const link = /^\[([^\]\n]+)\]\(([^\s)]+)\)$/.exec(part);
    const allowed = link && /^\/(?:(?:fr|de|it|es|pt)\/)?(?:contact|(?:villas|transportation|beachclubs|nightclubs|experiences|restaurants)\/[^/?#\\]+)$/.test(link[2]);
    return allowed
      ? <Link key={index} href={link[2]} target={link[2].endsWith("/contact") ? undefined : "_blank"} rel={link[2].endsWith("/contact") ? undefined : "noopener noreferrer"} className="underline underline-offset-2">{link[1]}</Link>
      : <Fragment key={index}>{part}</Fragment>;
  })}</>;
}
