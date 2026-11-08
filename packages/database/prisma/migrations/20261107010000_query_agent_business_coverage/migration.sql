CREATE SCHEMA IF NOT EXISTS query_agent;

-- Business entities retain their original names and columns. Credentials are excluded.

CREATE OR REPLACE VIEW query_agent."WebsiteConfiguration" AS SELECT "id", "heroSlides", "productCtas", "updatedAt", "updatedBy" FROM public."WebsiteConfiguration";

CREATE OR REPLACE VIEW query_agent."EmailVerificationToken" AS SELECT "id", "email", "expiresAt", "used", "createdAt", "updatedAt" FROM public."EmailVerificationToken";

CREATE OR REPLACE VIEW query_agent."Segment" AS SELECT "id", "name", "description", "sourceObject", "definition", "isActive", "createdDate", "createdBy", "updatedDate", "updatedBy" FROM public."Segment";

CREATE OR REPLACE VIEW query_agent."SenderEmail" AS SELECT "id", "name", "email", "replyTo", "isActive", "createdDate", "updatedDate" FROM public."SenderEmail";

CREATE OR REPLACE VIEW query_agent."EmailTemplate" AS SELECT "id", "name", "description", "defaultSubject", "defaultHtml", "languageBlocks", "isActive", "createdDate", "updatedDate" FROM public."EmailTemplate";

CREATE OR REPLACE VIEW query_agent."AudienceAutomation" AS SELECT "id", "name", "description", "sqlQuery", "subscriberKeyField", "emailField", "languageField", "senderEmailId", "emailTemplateId", "isActive", "scheduleType", "scheduleMinute", "scheduleHour", "scheduleDayOfWeek", "scheduleDayOfMonth", "scheduleTimezone", "scheduleStartAt", "scheduleEndAt", "nextRunAt", "lastRunAt", "createdDate", "updatedDate" FROM public."AudienceAutomation";

CREATE OR REPLACE VIEW query_agent."AutomationRun" AS SELECT "id", "automationId", "status", "audienceCount", "deliveredCount", "failedCount", "dryRun", "error", "startedDate", "completedDate", "startedBy" FROM public."AutomationRun";

CREATE OR REPLACE VIEW query_agent."EmailMessage" AS SELECT "id", "resendEmailId", "messageId", "recipientEmail", "senderEmail", "subject", "category", "lastEvent", "sentAt", "lastEventAt", "createdDate", "updatedDate" FROM public."EmailMessage";

CREATE OR REPLACE VIEW query_agent."EmailEvent" AS SELECT "id", "webhookEventId", "resendEmailId", "type", "recipientEmail", "occurredAt", "link", "bounceType", "createdDate" FROM public."EmailEvent";

CREATE OR REPLACE VIEW query_agent."RecordFlow" AS SELECT "id", "name", "description", "sourceEntity", "trigger", "condition", "isActive", "lastRunDate", "lastError", "currentVersion", "createdDate", "updatedDate" FROM public."RecordFlow";

CREATE OR REPLACE VIEW query_agent."RecordFlowVersion" AS SELECT "id", "flowId", "version", "name", "description", "sourceEntity", "trigger", "condition", "status", "createdDate", "updatedDate" FROM public."RecordFlowVersion";

CREATE OR REPLACE VIEW query_agent."RecordFlowRun" AS SELECT "id", "flowId", "flowVersionId", "triggerRecordId", "status", "error", "startedDate", "completedDate" FROM public."RecordFlowRun";

CREATE OR REPLACE VIEW query_agent."RecordFlowActivityRun" AS SELECT "id", "runId", "activityId", "activityType", "status", "inputCount", "outputCount", "affectedCount", "objectName", "affectedId", "filterSummary", "summary", "error", "startedDate", "completedDate" FROM public."RecordFlowActivityRun";

CREATE OR REPLACE VIEW query_agent."Product" AS SELECT "id", "uniqueCode", "type", "priceEuro", "order", "thumbnail", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES", "priceTitleFR", "priceTitleEN", "priceTitleDE", "priceTitleIT", "priceTitlePT", "priceTitleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "addressFR", "addressEN", "addressDE", "addressIT", "addressPT", "addressES", "tagsFR", "tagsEN", "tagsDE", "tagsIT", "tagsPT", "tagsES", "detailsFR", "detailsEN", "detailsDE", "detailsIT", "detailsPT", "detailsES", "image1", "image2", "image3", "image4", "image5", "image6", "image7", "image8", "image9", "image10", "image11", "image12", "image13", "image14", "image15", "image16", "image17", "image18", "image19", "image20", "image22", "image23", "image24", "image25", "image26", "image27", "image28", "image29", "image30", "image31", "image32", "image33", "image34", "image35", "image36", "image37", "image38", "image39", "image40", "image41", "image42", "image43", "image44", "image45", "image46", "image47", "image48", "image49", "image50", "imageAlts", "isActive", "createdAt", "updatedAt", "image21" FROM public."Product";

CREATE OR REPLACE VIEW query_agent."Villa" AS SELECT "id", "uniqueCode", "priceEuro", "priceWithDriverEuro", "order", "thumbnail", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES", "priceTitleFR", "priceTitleEN", "priceTitleDE", "priceTitleIT", "priceTitlePT", "priceTitleES", "priceWithDriverLabelFR", "priceWithDriverLabelEN", "priceWithDriverLabelDE", "priceWithDriverLabelIT", "priceWithDriverLabelPT", "priceWithDriverLabelES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "addressFR", "addressEN", "addressDE", "addressIT", "addressPT", "addressES", "tagsFR", "tagsEN", "tagsDE", "tagsIT", "tagsPT", "tagsES", "detailsFR", "detailsEN", "detailsDE", "detailsIT", "detailsPT", "detailsES", "imageAlts", "isActive", "createdAt", "updatedAt" FROM public."Villa";

CREATE OR REPLACE VIEW query_agent."VillaImage" AS SELECT "id", "villaId", "url", "order", "altFR", "altEN", "altDE", "altIT", "altPT", "altES" FROM public."VillaImage";

CREATE OR REPLACE VIEW query_agent."Restaurant" AS SELECT "id", "uniqueCode", "priceEuro", "order", "thumbnail", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES", "priceTitleFR", "priceTitleEN", "priceTitleDE", "priceTitleIT", "priceTitlePT", "priceTitleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "addressFR", "addressEN", "addressDE", "addressIT", "addressPT", "addressES", "tagsFR", "tagsEN", "tagsDE", "tagsIT", "tagsPT", "tagsES", "detailsFR", "detailsEN", "detailsDE", "detailsIT", "detailsPT", "detailsES", "imageAlts", "isActive", "createdAt", "updatedAt" FROM public."Restaurant";

CREATE OR REPLACE VIEW query_agent."RestaurantImage" AS SELECT "id", "restaurantId", "url", "order", "altFR", "altEN", "altDE", "altIT", "altPT", "altES" FROM public."RestaurantImage";

CREATE OR REPLACE VIEW query_agent."BeachClub" AS SELECT "id", "uniqueCode", "order", "thumbnail", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "locationFR", "locationEN", "locationDE", "locationIT", "locationPT", "locationES", "isActive", "createdAt", "updatedAt" FROM public."BeachClub";

CREATE OR REPLACE VIEW query_agent."BeachClubImage" AS SELECT "id", "beachClubId", "url", "order", "altFR", "altEN", "altDE", "altIT", "altPT", "altES" FROM public."BeachClubImage";

CREATE OR REPLACE VIEW query_agent."BeachClubPlan" AS SELECT "id", "beachClubId", "uniqueCode", "salePrice", "internalCost", "currency", "pricingUnit", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "createdAt", "updatedAt" FROM public."BeachClubPlan";

CREATE OR REPLACE VIEW query_agent."BeachClubPlanOption" AS SELECT "id", "planId", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES" FROM public."BeachClubPlanOption";

CREATE OR REPLACE VIEW query_agent."NightClub" AS SELECT "id", "uniqueCode", "order", "thumbnail", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "locationFR", "locationEN", "locationDE", "locationIT", "locationPT", "locationES", "isActive", "createdAt", "updatedAt" FROM public."NightClub";

CREATE OR REPLACE VIEW query_agent."NightClubImage" AS SELECT "id", "nightClubId", "url", "order", "altFR", "altEN", "altDE", "altIT", "altPT", "altES" FROM public."NightClubImage";

CREATE OR REPLACE VIEW query_agent."NightClubPlan" AS SELECT "id", "nightClubId", "uniqueCode", "salePrice", "internalCost", "currency", "pricingUnit", "durationMinutes", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "createdAt", "updatedAt" FROM public."NightClubPlan";

CREATE OR REPLACE VIEW query_agent."NightClubPlanOption" AS SELECT "id", "planId", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES" FROM public."NightClubPlanOption";

CREATE OR REPLACE VIEW query_agent."Pack" AS SELECT "id", "uniqueCode", "order", "thumbnail", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "locationFR", "locationEN", "locationDE", "locationIT", "locationPT", "locationES", "isActive", "createdAt", "updatedAt" FROM public."Pack";

CREATE OR REPLACE VIEW query_agent."PackImage" AS SELECT "id", "packId", "url", "order", "altFR", "altEN", "altDE", "altIT", "altPT", "altES" FROM public."PackImage";

CREATE OR REPLACE VIEW query_agent."PackPlan" AS SELECT "id", "packId", "uniqueCode", "serviceType", "origin", "destination", "durationMinutes", "salePrice", "internalCost", "currency", "pricingUnit", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "createdAt", "updatedAt" FROM public."PackPlan";

CREATE OR REPLACE VIEW query_agent."PackPlanOption" AS SELECT "id", "planId", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES" FROM public."PackPlanOption";

CREATE OR REPLACE VIEW query_agent."Activity" AS SELECT "id", "uniqueCode", "order", "thumbnail", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "locationFR", "locationEN", "locationDE", "locationIT", "locationPT", "locationES", "isActive", "createdAt", "updatedAt" FROM public."Activity";

CREATE OR REPLACE VIEW query_agent."ActivityImage" AS SELECT "id", "activityId", "url", "order", "altFR", "altEN", "altDE", "altIT", "altPT", "altES" FROM public."ActivityImage";

CREATE OR REPLACE VIEW query_agent."ActivityPlan" AS SELECT "id", "activityId", "uniqueCode", "salePrice", "internalCost", "currency", "pricingUnit", "durationMinutes", "minimumGuests", "maximumGuests", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "createdAt", "updatedAt" FROM public."ActivityPlan";

CREATE OR REPLACE VIEW query_agent."ActivityPlanOption" AS SELECT "id", "planId", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES" FROM public."ActivityPlanOption";

CREATE OR REPLACE VIEW query_agent."Transportation" AS SELECT "id", "uniqueCode", "order", "thumbnail", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "subtitleFR", "subtitleEN", "subtitleDE", "subtitleIT", "subtitlePT", "subtitleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "locationFR", "locationEN", "locationDE", "locationIT", "locationPT", "locationES", "isActive", "createdAt", "updatedAt" FROM public."Transportation";

CREATE OR REPLACE VIEW query_agent."TransportationImage" AS SELECT "id", "transportationId", "url", "order", "altFR", "altEN", "altDE", "altIT", "altPT", "altES" FROM public."TransportationImage";

CREATE OR REPLACE VIEW query_agent."TransportationPlan" AS SELECT "id", "transportationId", "uniqueCode", "serviceType", "origin", "destination", "durationMinutes", "salePrice", "internalCost", "currency", "pricingUnit", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES", "descriptionFR", "descriptionEN", "descriptionDE", "descriptionIT", "descriptionPT", "descriptionES", "createdAt", "updatedAt" FROM public."TransportationPlan";

CREATE OR REPLACE VIEW query_agent."TransportationPlanOption" AS SELECT "id", "planId", "order", "isActive", "titleFR", "titleEN", "titleDE", "titleIT", "titlePT", "titleES" FROM public."TransportationPlanOption";

CREATE OR REPLACE VIEW query_agent."WhatsAppConversation" AS SELECT "id", "whatsappPhone", "whatsappUserId", "displayName", "managedBy", "createdDate", "updatedDate" FROM public."WhatsAppConversation";

CREATE OR REPLACE VIEW query_agent."WhatsAppMessage" AS SELECT "id", "conversationId", "sender", "message", "sentAt", "externalMessageId" FROM public."WhatsAppMessage";

CREATE OR REPLACE VIEW query_agent."Individual" AS SELECT "id", "firstName", "lastName", "email", "manualEmail", "mobilePhone", "googleId", "authProvider", "address", "birthdate", "country", "language", "source", "acquisitionSource", "isActive", "emailVerified", "createdDate", "createdBy", "updatedDate", "updatedBy", "lastSuccessfulLoginDate" FROM public."Individual";

CREATE OR REPLACE VIEW query_agent."Lead" AS SELECT "id", "firstName", "lastName", "email", "mobilePhone", "address", "birthdate", "country", "language", "source", "statusDescription", "createdDate", "createdBy", "updatedDate", "updatedBy", "individualId" FROM public."Lead";

CREATE OR REPLACE VIEW query_agent."Prospect" AS SELECT "id", "firstName", "lastName", "email", "mobilePhone", "address", "birthdate", "country", "language", "source", "statusDescription", "createdDate", "createdBy", "updatedDate", "updatedBy", "individualId" FROM public."Prospect";

CREATE OR REPLACE VIEW query_agent."Account" AS SELECT "id", "firstName", "lastName", "email", "mobilePhone", "address", "birthdate", "country", "language", "source", "statusDescription", "createdDate", "createdBy", "updatedDate", "updatedBy", "individualId" FROM public."Account";

CREATE OR REPLACE VIEW query_agent."Consent" AS SELECT "id", "individualId", "channel", "channelStatus", "createdDate", "createdBy", "updatedDate", "updatedBy" FROM public."Consent";

CREATE OR REPLACE VIEW query_agent."PageVisit" AS SELECT "id", "pageUrl", "source", "pageName", "visitorId", "journeyId", "visitorStage", "leadId", "prospectId", "accountId", "individualId", "visitDate", "referrer", "userAgent", "ipAddress", "sessionId" FROM public."PageVisit";

CREATE OR REPLACE VIEW query_agent."Visitor" AS SELECT "id", "firstName", "lastName", "email", "phone", "source", "lastSource", "landingPage", "referrer", "userAgent", "language", "deviceType", "utmCampaign", "utmMedium", "firstSeenAt", "lastSeenAt" FROM public."Visitor";

CREATE OR REPLACE VIEW query_agent."VisitorIdentity" AS SELECT "id", "visitorId", "individualId", "linkedAt" FROM public."VisitorIdentity";

CREATE OR REPLACE VIEW query_agent."AgentQuery" AS SELECT "id", "title", "prompt", "sql", "explanation", "model", "createdBy", "createdDate", "updatedDate" FROM public."AgentQuery";

CREATE OR REPLACE VIEW query_agent."AgentQueryExecution" AS SELECT "id", "queryId", "executedBy", "sql", "status", "rowCount", "durationMs", "error", "createdDate" FROM public."AgentQueryExecution";

CREATE OR REPLACE VIEW query_agent."ContactRequest" AS SELECT "id", "firstName", "lastName", "email", "mobilePhone", "requestType", "subject", "comment", "requesterStage", "visitorId", "individualId", "leadId", "prospectId", "accountId", "createdDate", "createdBy", "updatedDate", "updatedBy" FROM public."ContactRequest";

CREATE OR REPLACE VIEW query_agent."ConciergeOrder" AS SELECT "id", "orderNumber", "contactRequestId", "individualId", "clientFirstName", "clientLastName", "clientEmail", "clientPhone", "clientLanguage", "currency", "status", "paymentStatus", "totalAmount", "paidAmount", "remainingAmount", "notes", "createdDate", "createdBy", "updatedDate", "updatedBy" FROM public."ConciergeOrder";

CREATE OR REPLACE VIEW query_agent."ConciergeOrderItem" AS SELECT "id", "orderId", "productType", "productId", "productName", "planId", "planName", "optionId", "optionName", "startDate", "endDate", "unitPrice", "totalPrice", "notes", "createdDate", "updatedDate" FROM public."ConciergeOrderItem";

CREATE OR REPLACE VIEW query_agent."ConciergeOrderPayment" AS SELECT "id", "orderId", "amount", "currency", "method", "status", "paypalOrderId", "paypalCaptureId", "stripePaymentIntentId", "checkoutExpiresAt", "emailSentAt", "paidAt", "recordedBy", "notes", "createdDate", "updatedDate" FROM public."ConciergeOrderPayment";

CREATE OR REPLACE VIEW query_agent."TripCart" AS SELECT "id", "visitorId", "individualId", "status", "email", "contactRequestId", "submittedAt", "createdDate", "updatedDate" FROM public."TripCart";

CREATE OR REPLACE VIEW query_agent."TripCartItem" AS SELECT "id", "tripCartId", "productId", "productType", "productName", "category", "image", "plans", "planId", "planTitle", "startDate", "endDate", "createdDate", "updatedDate" FROM public."TripCartItem";

CREATE OR REPLACE VIEW query_agent."Chat" AS SELECT "id", "visitorId", "journeyId", "sessionId", "leadId", "prospectId", "accountId", "individualId", "advisorId", "participantStage", "managedBy", "status", "language", "endUserTypingUntil", "advisorTypingUntil", "createdDate", "createdBy", "updatedDate", "updatedBy" FROM public."Chat";

CREATE OR REPLACE VIEW query_agent."VisitorJourney" AS SELECT "id", "visitorId", "individualId", "startedAt", "claimedAt", "endedAt", "lastSeenAt" FROM public."VisitorJourney";

CREATE OR REPLACE VIEW query_agent."ChatMessage" AS SELECT "id", "chatId", "senderType", "senderId", "message", "sendTime", "isRead" FROM public."ChatMessage";

CREATE OR REPLACE VIEW query_agent."User" AS SELECT "id", "firstName", "lastName", "email", "mobilePhone", "role", "isActive", "lastLoginDate", "createdDate", "createdBy", "updatedDate", "updatedBy" FROM public."User";

CREATE OR REPLACE VIEW query_agent."AdminPushSubscription" AS SELECT "id", "userId", "userAgent", "createdAt", "updatedAt" FROM public."AdminPushSubscription";

CREATE OR REPLACE VIEW query_agent.reporting_visitors AS SELECT * FROM public.reporting_visitors;

CREATE OR REPLACE VIEW query_agent.reporting_visitor_identities AS SELECT * FROM public.reporting_visitor_identities;

CREATE OR REPLACE VIEW query_agent.reporting_individuals AS SELECT * FROM public.reporting_individuals;

CREATE OR REPLACE VIEW query_agent.reporting_page_visits AS SELECT * FROM public.reporting_page_visits;

CREATE OR REPLACE VIEW query_agent.reporting_contact_requests AS SELECT * FROM public.reporting_contact_requests;

CREATE OR REPLACE VIEW query_agent.reporting_chats AS SELECT * FROM public.reporting_chats;

CREATE OR REPLACE VIEW query_agent.reporting_customers AS SELECT * FROM public.reporting_customers;

CREATE OR REPLACE VIEW query_agent.reporting_orders AS SELECT * FROM public.reporting_orders;
