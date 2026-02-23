import { describe, it, expect } from "vitest";
import {
  validateAbsolutePath,
  validateBundleId,
  validateSafeName,
  ValidationError,
} from "../../src/utils/validation.js";

describe("validateAbsolutePath", () => {
  it("accepts absolute paths", () => {
    expect(validateAbsolutePath("/usr/bin/test")).toBe("/usr/bin/test");
    expect(validateAbsolutePath("/Applications/Xcode.app")).toBe("/Applications/Xcode.app");
  });

  it("rejects relative paths", () => {
    expect(() => validateAbsolutePath("relative/path")).toThrow(ValidationError);
    expect(() => validateAbsolutePath("./path")).toThrow(ValidationError);
  });

  it("rejects empty paths", () => {
    expect(() => validateAbsolutePath("")).toThrow(ValidationError);
  });
});

describe("validateBundleId", () => {
  it("accepts valid bundle IDs", () => {
    expect(validateBundleId("com.example.app")).toBe("com.example.app");
    expect(validateBundleId("com.apple.Safari")).toBe("com.apple.Safari");
    expect(validateBundleId("org.swift.package-manager")).toBe("org.swift.package-manager");
  });

  it("rejects invalid bundle IDs", () => {
    expect(() => validateBundleId("")).toThrow(ValidationError);
    expect(() => validateBundleId("noperiods")).toThrow(ValidationError);
    expect(() => validateBundleId("123.invalid")).toThrow(ValidationError);
  });
});

describe("validateSafeName", () => {
  it("accepts valid names", () => {
    expect(validateSafeName("MyApp")).toBe("MyApp");
    expect(validateSafeName("my-app")).toBe("my-app");
    expect(validateSafeName("my_app_2")).toBe("my_app_2");
  });

  it("rejects invalid names", () => {
    expect(() => validateSafeName("")).toThrow(ValidationError);
    expect(() => validateSafeName("123start")).toThrow(ValidationError);
    expect(() => validateSafeName("has spaces")).toThrow(ValidationError);
    expect(() => validateSafeName("has.dots")).toThrow(ValidationError);
  });
});
