import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express from "express";
import { trustProxy } from "./config";

describe("trustProxy", () => {
  it("parses booleans, hop counts and address lists", () => {
    assert.equal(trustProxy(undefined), "loopback");
    assert.equal(trustProxy(""), "loopback");
    assert.equal(trustProxy("true"), true);
    assert.equal(trustProxy(" TRUE "), true);
    assert.equal(trustProxy("false"), false);
    assert.equal(trustProxy("2"), 2);
    assert.equal(trustProxy("loopback, 10.0.0.0/8"), "loopback, 10.0.0.0/8");
  });

  it("is accepted by Express for every supported form", () => {
    for (const raw of [undefined, "true", "false", "2", "loopback, 10.0.0.0/8"]) {
      assert.doesNotThrow(() => express().set("trust proxy", trustProxy(raw)), `TRUST_PROXY=${raw}`);
    }
  });
});
