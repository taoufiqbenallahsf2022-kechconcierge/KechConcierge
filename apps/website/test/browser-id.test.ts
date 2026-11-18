import assert from "node:assert/strict";
import test from "node:test";
import { createBrowserUUID } from "../src/lib/browser-id";

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
test("browser identifiers work with secure, HTTP-only and legacy crypto APIs", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  try {
    const native = "12345678-1234-4234-8234-123456789abc";
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: { randomUUID: () => native } });
    assert.equal(createBrowserUUID(), native);

    let calls = 0;
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: { getRandomValues: (bytes: Uint8Array) => { calls++; return bytes.fill(255); } } });
    assert.equal(createBrowserUUID(), "ffffffff-ffff-4fff-bfff-ffffffffffff");
    assert.equal(calls, 1);

    Object.defineProperty(globalThis, "crypto", { configurable: true, value: undefined });
    const identifiers = new Set(Array.from({ length: 100 }, createBrowserUUID));
    assert.equal(identifiers.size, 100);
    for (const id of identifiers) assert.match(id, uuidV4);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "crypto", descriptor);
    else Reflect.deleteProperty(globalThis, "crypto");
  }
});
