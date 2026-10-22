import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deviceFrom } from "./device";

const ua = (s: string) => ({ "user-agent": s });

describe("deviceFrom", () => {
  it("Android Chrome phone", () => {
    assert.deepEqual(
      deviceFrom(ua("Mozilla/5.0 (Linux; Android 15; X6880) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36")),
      { type: "mobile", os: "Android", browser: "Chrome" },
    );
  });

  it("iPhone Safari", () => {
    assert.deepEqual(
      deviceFrom(ua("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")),
      { type: "mobile", os: "iOS", browser: "Safari" },
    );
  });

  it("Android tablet", () => {
    assert.equal(
      deviceFrom(ua("Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")).type,
      "tablet",
    );
  });

  it("Windows Edge desktop", () => {
    assert.deepEqual(
      deviceFrom(ua("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0")),
      { type: "desktop", os: "Windows", browser: "Edge" },
    );
  });

  it("Linux Firefox desktop", () => {
    assert.deepEqual(
      deviceFrom(ua("Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0")),
      { type: "desktop", os: "Linux", browser: "Firefox" },
    );
  });

  it("prefers client hints over a desktop-mode UA", () => {
    const d = deviceFrom({
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
    });
    assert.deepEqual(d, { type: "mobile", os: "Android", browser: "Chrome" });
  });

  it("missing headers", () => {
    assert.deepEqual(deviceFrom({}), { type: "desktop", os: "Other", browser: "Other" });
  });
});
