import webpush from "web-push";
import { prisma } from "../config/prisma";

let configured = false;

function configurePush() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:contact@moorishconcierge.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

async function sendAdminPush(input: { title: string; body: string; tag: string; url: string }) {
  if (!configurePush()) return;
  const subscriptions = await prisma.adminPushSubscription.findMany({
    where: { user: { isActive: true } },
  });
  const body = input.body.slice(0, 180);

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: input.title,
            body,
            tag: input.tag,
            url: input.url,
          }),
        );
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await prisma.adminPushSubscription.deleteMany({
            where: { endpoint: subscription.endpoint },
          });
          return;
        }
        console.error("Unable to send admin chat notification", error);
      }
    }),
  );
}

export function notifyAdminsOfChatMessage(input: { chatId: string; participantName: string; message: string }) {
  return sendAdminPush({
    title: "New website chat message",
    body: `${input.participantName}: ${input.message}`,
    tag: `website-chat-${input.chatId}`,
    url: `/chats/${input.chatId}`,
  });
}

export function notifyAdminsOfContactRequest(input: { requestId: string; participantName: string; requestType: string; subject?: string | null }) {
  return sendAdminPush({
    title: "New contact request",
    body: `${input.participantName} · ${input.subject || input.requestType}`,
    tag: `contact-request-${input.requestId}`,
    url: `/entities/contact-requests`,
  });
}
