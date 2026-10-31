ALTER TYPE "OrderPaymentMethod" ADD VALUE 'STRIPE';

ALTER TABLE "ConciergeOrderPayment"
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripePaymentIntentId" TEXT;

CREATE UNIQUE INDEX "ConciergeOrderPayment_stripeCheckoutSessionId_key"
ON "ConciergeOrderPayment"("stripeCheckoutSessionId");

CREATE UNIQUE INDEX "ConciergeOrderPayment_stripePaymentIntentId_key"
ON "ConciergeOrderPayment"("stripePaymentIntentId");
