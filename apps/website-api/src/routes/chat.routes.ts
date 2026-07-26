import { Router, type Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma";
import {
  claimVisitorJourney,
  ensureVisitorJourney,
} from "../services/visitor-journey.service";

const router = Router();
const ADVISOR_EMAIL = "mounadi0711@gmail.com";
const LANGUAGES = new Set(["en", "fr", "es", "pt", "it", "de"]);

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
  });
  if (!chat)
    throw Object.assign(new Error("Conversation not found"), { status: 404 });
  return chat;
}

function publicChat(chat: any) {
  const individualName = chat.individual
    ? `${chat.individual.firstName} ${chat.individual.lastName}`.trim()
    : null;
  return {
    ...chat,
    title: individualName
      ? `${individualName} - Assistant`
      : "Visitor - Assistant",
    unread:
      typeof chat._count?.messages === "number"
        ? chat._count.messages > 0
        : Array.isArray(chat.messages)
          ? chat.messages.some(
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
          orderBy: { sendTime: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderType: { in: ["ADVISOR", "AI"] },
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

    const chat = await prisma.chat.create({
      data: {
        advisorId: advisor.id,
        language,
        managedBy: "MANUAL",
        status: "WAITING_FOR_ADVISOR",
        participantStage:
          owner.kind === "individual" ? "INDIVIDUAL" : "VISITOR",
        individualId:
          owner.kind === "individual" ? owner.individualId : undefined,
        visitorId: owner.visitorId,
        journeyId: owner.journeyId,
        messages: {
          create: {
            senderType: owner.kind === "individual" ? "INDIVIDUAL" : "VISITOR",
            senderId:
              owner.kind === "individual"
                ? owner.individualId
                : owner.visitorId,
            message,
          },
        },
      } as any,
      include: {
        individual: { select: { firstName: true, lastName: true } },
        advisor: { select: { firstName: true, lastName: true } },
        messages: { orderBy: { sendTime: "asc" } },
      },
    });
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
      },
      data: { isRead: true },
    });
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      include: {
        individual: { select: { firstName: true, lastName: true } },
        advisor: { select: { firstName: true, lastName: true } },
        messages: { orderBy: { sendTime: "asc" } },
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
    await ownedChat(req.params.id, owner);
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
