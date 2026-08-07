import { describe, it, expect, vi, afterEach } from "vitest";
import { createLogger } from "@/lib/logger";

describe("createLogger", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("info() formate le message avec module et niveau", () => {
    const spy = vi.spyOn(console, "log");
    createLogger("mon-module").info("test info");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatch(/\[INFO\] \[mon-module\] test info/);
  });

  it("info() inclut les données JSON si fournies", () => {
    const spy = vi.spyOn(console, "log");
    createLogger("m").info("msg", { count: 42 });
    expect(spy.mock.calls[0][0]).toContain('"count":42');
  });

  it("debug() appelle console.debug", () => {
    const spy = vi.spyOn(console, "debug");
    createLogger("m").debug("trace");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatch(/\[DEBUG\]/);
  });

  it("warn() appelle console.warn avec le bon format", () => {
    const spy = vi.spyOn(console, "warn");
    createLogger("svc").warn("attention");
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatch(/\[WARN\] \[svc\] attention/);
  });

  it("error() extrait le message d'une instance Error", () => {
    const spy = vi.spyOn(console, "error");
    createLogger("svc").error("crash", new Error("cause profonde"));
    expect(spy.mock.calls[0][0]).toContain("cause profonde");
  });

  it("error() fonctionne sans argument erreur", () => {
    const spy = vi.spyOn(console, "error");
    createLogger("svc").error("erreur simple");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("deux loggers isolent leur nom de module", () => {
    const spy = vi.spyOn(console, "log");
    createLogger("alpha").info("msg-a");
    createLogger("beta").info("msg-b");
    expect(spy.mock.calls[0][0]).toMatch(/\[alpha\]/);
    expect(spy.mock.calls[1][0]).toMatch(/\[beta\]/);
  });

  it("le message inclut un timestamp ISO 8601", () => {
    const spy = vi.spyOn(console, "log");
    createLogger("t").info("ts-test");
    expect(spy.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
