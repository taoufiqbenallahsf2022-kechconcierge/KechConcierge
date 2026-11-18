# Mobile chat experience

The chat header opens the existing conversation list on screens below 1024px. It uses the same API and visitor/auth identity as desktop, with no new database tables. Anonymous history belongs to that browser's existing visitor identifier; signing in uses the existing account access rules. Other people's conversations are not exposed.

The invitation appears on desktop and mobile after 3 seconds on an eligible discovery page, once per visitor across browsing sessions using that browser’s persistent visitor ID. The mobile white panel fills the viewport width and touches the bottom edge; safe-area spacing is inside the white panel. Desktop uses a compact bottom-right card. Clearing site storage or switching browsers creates a different anonymous visitor. The previous session marker is migrated to the persistent cap. It uses the current page category and language (EN/FR/ES/IT/DE/PT). Forms, chat, account and payment pages are excluded. Open menus/dialogs, hidden tabs and focused inputs defer it. Close, Maybe later, Escape and the shaded backdrop dismiss it. The white card has explicit colours so the nightclub theme cannot make its text unreadable.

The quiet two-note notification plays only if the browser has allowed an AudioContext following a click or key gesture. The invitation still appears silently when audio is unavailable or blocked. There are no new environment variables, permissions, AI requests or database migrations. Social-platform integrations remain for later.

## Portrait

Asset: `public/chat/cecile.png`, displayed through Next Image at avatar sizes. Fictional adult character, generated with the built-in imagegen tool. That tool does not expose a model selector; no claim is made that Astra 6-2 produced it.

Generation prompt: “Use case: photorealistic-natural. Asset type: square professional concierge avatar for a website chat assistant named Cécile. Create a fictional beautiful adult French-Moroccan woman around 30, warm friendly natural smile, dark brown wavy hair, brown eyes, elegant cream blouse, understated earrings. Head and shoulders portrait, looking directly at camera, centered face with sufficient room for circular avatar crop. Soft natural daylight, realistic skin texture, softly blurred warm Marrakech courtyard background. Approachable polished hospitality photograph. No text, no watermark, no logos. This is a fictional AI assistant character, not a real person's likeness.”

## Checking on a phone

Use the development website over the same Wi-Fi as the computer. Open chat, use **Chats** (or **Discussions** in French) to reopen a previous conversation, or choose **New conversation**. To test another invitation category after one already appeared, use a separate test visitor/browser or clear only that test browser’s site data. A new session alone no longer resets the invitation. Audio can be blocked by the browser or the device's silent mode.

### Office-background revision

The active portrait was revised with built-in imagegen, preserving Cécile's face and replacing the courtyard with an imagined branded Moorish Concierge office. The office is concept imagery, not an existing business address. Asmaa's actual photo remains a future addition.

Edit prompt: “Edit the provided portrait. Preserve exactly the same fictional adult Cécile character, facial identity, hair, friendly warm smile, cream blouse, natural skin texture, and professional photographic quality. Replace the Marrakech courtyard background with an imagined elegant Moorish Concierge office: warm contemporary Moroccan hospitality design, cream plaster, walnut wood, tasteful Moroccan geometric details, a tidy concierge desk, soft daylight. Place refined readable signage 'Moorish Concierge' on the office wall behind her. The office must feel like a polished concierge workspace, not a hotel lobby. Slightly widen the head-and-shoulders framing only if needed to show the office and branding, keeping her face centered for circular avatar use. Square portrait, natural photography. This office is fictional concept imagery, not documentary photography of a real location. No extra people, no watermark. Do not change Cécile into another person.”

### Final modern-office revision (active asset)

The active `public/chat/cecile.png` now uses a modern corporate office with glass partitions, white desks, neutral walls and simple Moorish Concierge signage. It replaces the traditional-office variant above. Generated using the built-in imagegen edit tool.

Final edit prompt: “Edit this portrait by changing ONLY the office background. Preserve the exact same woman, facial identity, hair, smile, clothing, skin texture and photographic realism. REQUIRED BACKGROUND: a genuinely MODERN contemporary corporate concierge office, with straight floor-to-ceiling glass partitions, slim black window frames, a sleek white desk with a computer monitor, modern ergonomic office chair, clean white/light-gray walls, understated recessed linear lighting and large daylight windows. Simple contemporary sans-serif wall signage reading exactly 'Moorish Concierge', no decorative emblem. Realistic professional workplace photograph, not a hotel lobby or a themed set. Strictly NO Moroccan/traditional decoration: NO arches, NO carved wood, NO geometric lattice, NO lanterns, NO ornate tiles, NO patterned pottery, NO arabesques. Neutral minimalist corporate interior. Keep subject centered, square head-and-shoulders composition with office visible around her. No additional people, no watermark. Office is fictional concept imagery.”


### User-selected portrait (current)

The shared Cécile avatar now uses the image supplied by the user: https://imagedelivery.net/qcrNy2QA3vt3EbTLsOQBpA/5b445fa7-6859-4ac0-6585-84cd621b6400/public . This supersedes the generated local portrait above in the invitation and AI-owned chat headers/history. The existing Next Image Cloudflare allowlist already covers this URL. No new environment variable is needed.
