-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('OPTIN', 'UNKNOWN', 'OPTOUT');

-- CreateEnum
CREATE TYPE "ConsentChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'PHONE');

-- CreateEnum
CREATE TYPE "VisitorStage" AS ENUM ('LEAD', 'PROSPECT', 'ACCOUNT', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('GENERAL', 'VILLA', 'APARTMENT', 'ACTIVITY', 'TRANSPORTATION', 'SPA', 'RESTAURANT', 'RESERVATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactRequesterStage" AS ENUM ('VISITOR', 'LEAD', 'PROSPECT', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "ChatManagedBy" AS ENUM ('AI', 'MANUAL');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('OPEN', 'CLOSED', 'WAITING_FOR_VISITOR', 'WAITING_FOR_ADVISOR');

-- CreateEnum
CREATE TYPE "ChatParticipantStage" AS ENUM ('VISITOR', 'LEAD', 'PROSPECT', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "ChatSenderType" AS ENUM ('VISITOR', 'LEAD', 'PROSPECT', 'ACCOUNT', 'ADVISOR', 'AI');

-- CreateEnum
CREATE TYPE "WhatsAppManagedBy" AS ENUM ('AI', 'MANUAL');

-- CreateEnum
CREATE TYPE "WhatsAppMessageSender" AS ENUM ('CUSTOMER', 'ADVISOR', 'AI');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('VILLA', 'APARTMENT', 'SPA', 'RESTAURANT', 'ACTIVITY', 'TRANSPORTATION');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "priceEuro" DOUBLE PRECISION,
    "order" INTEGER,
    "thumbnail" TEXT NOT NULL,
    "titleFR" TEXT,
    "titleEN" TEXT,
    "titleDE" TEXT,
    "titleIT" TEXT,
    "titlePT" TEXT,
    "titleES" TEXT,
    "subtitleFR" TEXT,
    "subtitleEN" TEXT,
    "subtitleDE" TEXT,
    "subtitleIT" TEXT,
    "subtitlePT" TEXT,
    "subtitleES" TEXT,
    "priceTitleFR" TEXT,
    "priceTitleEN" TEXT,
    "priceTitleDE" TEXT,
    "priceTitleIT" TEXT,
    "priceTitlePT" TEXT,
    "priceTitleES" TEXT,
    "descriptionFR" TEXT,
    "descriptionEN" TEXT,
    "descriptionDE" TEXT,
    "descriptionIT" TEXT,
    "descriptionPT" TEXT,
    "descriptionES" TEXT,
    "addressFR" TEXT,
    "addressEN" TEXT,
    "addressDE" TEXT,
    "addressIT" TEXT,
    "addressPT" TEXT,
    "addressES" TEXT,
    "tagsFR" JSONB,
    "tagsEN" JSONB,
    "tagsDE" JSONB,
    "tagsIT" JSONB,
    "tagsPT" JSONB,
    "tagsES" JSONB,
    "detailsFR" JSONB,
    "detailsEN" JSONB,
    "detailsDE" JSONB,
    "detailsIT" JSONB,
    "detailsPT" JSONB,
    "detailsES" JSONB,
    "image1" TEXT,
    "image2" TEXT,
    "image3" TEXT,
    "image4" TEXT,
    "image5" TEXT,
    "image6" TEXT,
    "image7" TEXT,
    "image8" TEXT,
    "image9" TEXT,
    "image10" TEXT,
    "image11" TEXT,
    "image12" TEXT,
    "image13" TEXT,
    "image14" TEXT,
    "image15" TEXT,
    "image16" TEXT,
    "image17" TEXT,
    "image18" TEXT,
    "image19" TEXT,
    "image20" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "image21" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConversation" (
    "id" TEXT NOT NULL,
    "whatsappPhone" TEXT,
    "whatsappUserId" TEXT,
    "displayName" TEXT,
    "managedBy" "WhatsAppManagedBy" NOT NULL DEFAULT 'AI',
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sender" "WhatsAppMessageSender" NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "externalMessageId" TEXT,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Individual" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "mobilePhone" TEXT,
    "address" TEXT,
    "birthdate" TIMESTAMP(3),
    "country" TEXT,
    "language" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "password" TEXT,

    CONSTRAINT "Individual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "mobilePhone" TEXT,
    "address" TEXT,
    "birthdate" TIMESTAMP(3),
    "country" TEXT,
    "language" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "statusDescription" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "individualId" TEXT NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "mobilePhone" TEXT,
    "address" TEXT,
    "birthdate" TIMESTAMP(3),
    "country" TEXT,
    "language" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "statusDescription" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "individualId" TEXT NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "mobilePhone" TEXT,
    "address" TEXT,
    "birthdate" TIMESTAMP(3),
    "country" TEXT,
    "language" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "statusDescription" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "individualId" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "individualId" TEXT NOT NULL,
    "channel" "ConsentChannel" NOT NULL,
    "channelStatus" "ChannelStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageVisit" (
    "id" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "pageName" TEXT,
    "visitorStage" "VisitorStage" NOT NULL,
    "leadId" TEXT,
    "prospectId" TEXT,
    "accountId" TEXT,
    "individualId" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobilePhone" TEXT,
    "requestType" "RequestType" NOT NULL,
    "subject" TEXT,
    "comment" TEXT NOT NULL,
    "requesterStage" "ContactRequesterStage" NOT NULL DEFAULT 'VISITOR',
    "individualId" TEXT,
    "leadId" TEXT,
    "prospectId" TEXT,
    "accountId" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT,
    "sessionId" TEXT,
    "leadId" TEXT,
    "prospectId" TEXT,
    "accountId" TEXT,
    "individualId" TEXT,
    "advisorId" TEXT,
    "participantStage" "ChatParticipantStage" NOT NULL DEFAULT 'VISITOR',
    "managedBy" "ChatManagedBy" NOT NULL DEFAULT 'AI',
    "status" "ChatStatus" NOT NULL DEFAULT 'OPEN',
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderType" "ChatSenderType" NOT NULL,
    "senderId" TEXT,
    "message" TEXT NOT NULL,
    "sendTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mobilePhone" TEXT,
    "role" TEXT NOT NULL,
    "lastLoginDate" TIMESTAMP(3),
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_uniqueCode_key" ON "Product"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_individualId_fkey" FOREIGN KEY ("individualId") REFERENCES "Individual"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
