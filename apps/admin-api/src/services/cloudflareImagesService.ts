const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw Object.assign(new Error(`${name} is not configured on the administration API.`), { status: 503 });
  return value;
};

export async function createCloudflareDirectUpload(input: { filename?: unknown; contentType?: unknown; productId?: unknown }) {
  const accountId = required("CLOUDFLARE_ACCOUNT_ID");
  const token = required("CLOUDFLARE_IMAGES_API_TOKEN");
  const deliveryHash = required("CLOUDFLARE_IMAGES_DELIVERY_HASH");
  const variant = process.env.CLOUDFLARE_IMAGES_VARIANT?.trim() || "public";
  const filename = String(input.filename ?? "").trim();
  const contentType = String(input.contentType ?? "").trim().toLowerCase();
  if (!filename || filename.length > 255) throw Object.assign(new Error("A valid image filename is required."), { status: 400 });
  if (!contentType.startsWith("image/")) throw Object.assign(new Error(`${filename} is not an image file.`), { status: 400 });

  const form = new FormData();
  form.set("requireSignedURLs", "false");
  form.set("metadata", JSON.stringify({ source: "moorish-admin", filename, productId: input.productId || null }));
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal: AbortSignal.timeout(15_000),
  });
  const responseText = await response.text();
  let payload: any;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw Object.assign(new Error(`Cloudflare returned an invalid response (${response.status}).`), { status: 502 });
  }
  if (!response.ok || !payload?.success || !payload?.result?.id || !payload?.result?.uploadURL) {
    const cloudflareErrors = [...(Array.isArray(payload?.errors) ? payload.errors : []), ...(Array.isArray(payload?.messages) ? payload.messages : [])]
      .map((entry: any) => {
        const code = entry?.code == null ? "" : `CF-${entry.code}: `;
        return `${code}${String(entry?.message || "Unknown Cloudflare error")}`;
      });
    const cloudflareMessage = cloudflareErrors.join("; ");
    const authenticationFailure = /authentication|authorization|permission/i.test(cloudflareMessage);
    const message = authenticationFailure
      ? `Cloudflare rejected the Images credentials (${cloudflareMessage || `HTTP ${response.status}`}). Confirm the token has Account > Images > Write (also shown as Cloudflare Images > Edit), is owned by the same account as CLOUDFLARE_ACCOUNT_ID, has no incompatible IP restriction, and restart admin-api.`
      : cloudflareMessage || `Cloudflare rejected the upload request (${response.status}).`;
    throw Object.assign(new Error(message), { status: authenticationFailure ? 502 : response.status >= 400 && response.status < 500 ? 400 : 502 });
  }
  const id = String(payload.result.id);
  return {
    id,
    uploadURL: String(payload.result.uploadURL),
    deliveryURL: `https://imagedelivery.net/${deliveryHash}/${id}/${variant}`,
  };
}
