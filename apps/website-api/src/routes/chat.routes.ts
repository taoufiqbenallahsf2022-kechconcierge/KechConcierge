import { Router, type Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma";
import {
  claimVisitorJourney,
  ensureVisitorJourney,
} from "../services/visitor-journey.service";
import { notifyAdminsOfChatMessage } from "../services/admin-push.service";

const router = Router();
const ADVISOR_EMAIL = "mounadi0711@gmail.com";
const LANGUAGES = new Set(["en", "fr", "es", "pt", "it", "de"]);
const AUTOMATIC_REPLY_DELAY_MS = 2800;
const FIRST_MESSAGE_ACKNOWLEDGEMENT: Record<string, string> = {
  en: "Thank you for your message. Your personal advisor, Asmaa Mounadi, will take care of your request and get back to you shortly. In the meantime, feel free to share any useful details here.",
  fr: "Merci pour votre message. Votre conseillère personnelle, Asmaa Mounadi, prendra en charge votre demande et vous répondra prochainement. En attendant, n’hésitez pas à partager ici toute information utile.",
  es: "Gracias por tu mensaje. Tu asesora personal, Asmaa Mounadi, se encargará de tu solicitud y se pondrá en contacto contigo en breve. Mientras tanto, puedes compartir aquí cualquier información útil.",
  pt: "Obrigado pela sua mensagem. A sua consultora pessoal, Asmaa Mounadi, irá acompanhar o seu pedido e responderá em breve. Entretanto, pode partilhar aqui qualquer informação útil.",
  it: "Grazie per il messaggio. La tua consulente personale, Asmaa Mounadi, si occuperà della richiesta e ti risponderà al più presto. Nel frattempo, puoi condividere qui qualsiasi informazione utile.",
  de: "Vielen Dank für Ihre Nachricht. Ihre persönliche Beraterin, Asmaa Mounadi, kümmert sich um Ihre Anfrage und meldet sich in Kürze bei Ihnen. In der Zwischenzeit können Sie hier gerne weitere hilfreiche Informationen mitteilen.",
};

type Identity =
  | {
      kind: "individual";
      individualId: string;
      visitorId: string;
      journeyId: string;
    }
  | { kind: "visitor"; visitorId: string; journeyId: string };

function identity(req: Request): Identity {
  const visitorId = req.header("x-visitor-id")?.trim();
  const journeyId = req.header("x-journey-id")?.trim();
  if (!visitorId || visitorId.length < 16 || visitorId.length > 100)
    throw Object.assign(new Error("A valid visitor ID is required"), {
      status: 400,
    });
  if (!journeyId || journeyId.length < 16 || journeyId.length > 100)
    throw Object.assign(new Error("A valid journey ID is required"), {
      status: 400,
    });
  const authorization = req.headers.authorization;
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token)
      throw Object.assign(new Error("Invalid access token"), { status: 401 });
    const secret = process.env.JWT_SECRET;
    if (!secret)
      throw Object.assign(new Error("Authentication is unavailable"), {
        status: 503,
      });
    try {
      const decoded = jwt.verify(token, secret) as JwtPayload & {
        individualId?: string;
        id?: string;
      };
      const individualId =
        decoded.individualId ??
        decoded.id ??
        (typeof decoded.sub === "string" ? decoded.sub : undefined);
      if (!individualId) throw new Error("Missing Individual ID");
      return { kind: "individual", individualId, visitorId, journeyId };
    } catch {
      throw Object.assign(new Error("Invalid or expired access token"), {
        status: 401,
      });
    }
  }

  return { kind: "visitor", visitorId, journeyId };
}

function ownerWhere(owner: Identity) {
  return owner.kind === "individual"
    ? { individualId: owner.individualId }
    : { journeyId: owner.journeyId, individualId: null };
}

async function ownedChat(id: string, owner: Identity) {
  const chat = await prisma.chat.findFirst({
    where: { id, ...ownerWhere(owner) },
    include: { individual: { select: { firstName: true, lastName: true } } },
  });
  if (!chat)
    throw Object.assign(new Error("Conversation not found"), { status: 404 });
  return chat;
}

function publicChat(chat: any) {
  const visibleMessages = Array.isArray(chat.messages)
    ? chat.messages.filter((message: any) => new Date(message.sendTime).getTime() <= Date.now())
    : chat.messages;
  const advisorName = chat.advisor
    ? `${chat.advisor.firstName} ${chat.advisor.lastName}`.trim()
    : null;
  return {
    ...chat,
    messages: visibleMessages,
    title: advisorName || "Moorish Concierge",
    unread:
      typeof chat._count?.messages === "number"
        ? chat._count.messages > 0
        : Array.isArray(visibleMessages)
          ? visibleMessages.some(
              (message: any) =>
                ["ADVISOR", "AI"].includes(message.senderType) &&
                !message.isRead,
            )
          : false,
    advisorTyping:
      !!chat.advisorTypingUntil &&
      new Date(chat.advisorTypingUntil).getTime() > Date.now(),
  };
}

router.get("/", async (req, res, next) => {
  try {
    const owner = identity(req);
    const chats = await prisma.chat.findMany({
      where: ownerWhere(owner),
      orderBy: { updatedDate: "desc" },
      include: {
        individual: {
          select: { firstName: true, lastName: true },
        },
        advisor: {
          select: { firstName: true, lastName: true },
        },
        messages: {
          where: { sendTime: { lte: new Date() } },
          orderBy: { sendTime: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderType: { in: ["ADVISOR", "AI"] },
                sendTime: { lte: new Date() },
              },
            },
          },
        },
      },
    });
    res.json({ chats: chats.map(publicChat) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const owner = identity(req);
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const requestedLanguage =
      typeof req.body?.language === "string"
        ? req.body.language.toLowerCase()
        : "en";
    const language = LANGUAGES.has(requestedLanguage)
      ? requestedLanguage
      : "en";
    if (!message)
      return res.status(400).json({ message: "Message is required" });
    if (message.length > 5000)
      return res.status(400).json({ message: "Message is too long" });

    const journey = await ensureVisitorJourney(
      owner.visitorId,
      owner.journeyId,
    );
    if (
      journey.individualId &&
      (owner.kind !== "individual" ||
        journey.individualId !== owner.individualId)
    )
      throw Object.assign(new Error("Journey belongs to another Individual"), {
        status: 409,
      });
    if (owner.kind === "individual" && !journey.individualId)
      await claimVisitorJourney(
        owner.visitorId,
        owner.journeyId,
        owner.individualId,
      );

    const advisor = await prisma.user.findFirst({
      where: {
        email: { equals: ADVISOR_EMAIL, mode: "insensitive" },
        isActive: true,
      },
      select: { id: true },
    });
    if (!advisor) {
      throw Object.assign(new Error("The configured advisor is unavailable"), {
        status: 503,
      });
    }

    const now = new Date();
    const automaticReplyAt = new Date(now.getTime() + AUTOMATIC_REPLY_DELAY_MS);
    const chat = await prisma.chat.create({
      data: {
        advisorId: advisor.id,
        language,
        managedBy: "MANUAL",
        status: "WAITING_FOR_ADVISOR",
        advisorTypingUntil: automaticReplyAt,
        participantStage:
          owner.kind === "individual" ? "INDIVIDUAL" : "VISITOR",
        individualId:
          owner.kind === "individual" ? owner.individualId : undefined,
        visitorId: owner.visitorId,
        journeyId: owner.journeyId,
        messages: {
          create: [{
            senderType: owner.kind === "individual" ? "INDIVIDUAL" : "VISITOR",
            senderId:
              owner.kind === "individual"
                ? owner.individualId
                : owner.visitorId,
            message,
            sendTime: now,
          }, {
            senderType: "AI",
            senderId: advisor.id,
            message: FIRST_MESSAGE_ACKNOWLEDGEMENT[language] ?? FIRST_MESSAGE_ACKNOWLEDGEMENT.en,
            sendTime: automaticReplyAt,
          }],
        },
      } as any,
      include: {
        individual: { select: { firstName: true, lastName: true } },
        advisor: { select: { firstName: true, lastName: true } },
        messages: {
          where: { sendTime: { lte: now } },
          orderBy: { sendTime: "asc" },
        },
      },
    });
    const participantName = chat.individual
      ? `${chat.individual.firstName} ${chat.individual.lastName}`.trim()
      : "Website visitor";
    void notifyAdminsOfChatMessage({ chatId: chat.id, participantName, message }).catch((error) =>
      console.error("Unable to prepare admin chat notification", error),
    );
    res.status(201).json({ chat: publicChat(chat) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const owner = identity(req);
    await ownedChat(req.params.id, owner);
    await prisma.chatMessage.updateMany({
      where: {
        chatId: req.params.id,
        senderType: { in: ["ADVISOR", "AI"] },
        isRead: false,
        sendTime: { lte: new Date() },
      },
      data: { isRead: true },
    });
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      include: {
        individual: { select: { firstName: true, lastName: true } },
        advisor: { select: { firstName: true, lastName: true } },
        messages: {
          where: { sendTime: { lte: new Date() } },
          orderBy: { sendTime: "asc" },
        },
      },
    });
    res.json({ chat: publicChat(chat) });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/messages", async (req, res, next) => {
  try {
    const owner = identity(req);
    const chat = await ownedChat(req.params.id, owner);
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message)
      return res.status(400).json({ message: "Message is required" });
    if (message.length > 5000)
      return res.status(400).json({ message: "Message is too long" });

    const [created] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          chatId: req.params.id,
          senderType: owner.kind === "individual" ? "INDIVIDUAL" : "VISITOR",
          senderId:
            owner.kind === "individual" ? owner.individualId : owner.visitorId,
          message,
        } as any,
      }),
      prisma.chat.update({
        where: { id: req.params.id },
        data: {
          status: "WAITING_FOR_ADVISOR",
          endUserTypingUntil: null,
        } as any,
      }),
    ]);
    const participantName = chat.individual
      ? `${chat.individual.firstName} ${chat.individual.lastName}`.trim()
      : "Website visitor";
    void notifyAdminsOfChatMessage({ chatId: chat.id, participantName, message }).catch((error) =>
      console.error("Unable to prepare admin chat notification", error),
    );
    res.status(201).json({ message: created });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/typing", async (req, res, next) => {
  try {
    const owner = identity(req);
    await ownedChat(req.params.id, owner);
    await prisma.chat.update({
      where: { id: req.params.id },
      data: {
        endUserTypingUntil:
          req.body?.typing === true ? new Date(Date.now() + 5000) : null,
      } as any,
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
