import { describe, it, expect } from "vitest";
import { siteData, getSiteData } from "@/lib/site-data";

describe("siteData", () => {
  it("contient les infos de contact", () => {
    expect(siteData.contact.email).toContain("@");
    expect(siteData.contact.whatsapp).toMatch(/^\+\d+$/);
    expect(siteData.contact.phone).toMatch(/^\+\d+$/);
  });

  it("home.title n'est pas vide", () => {
    expect(siteData.home.title.length).toBeGreaterThan(0);
  });

  it("home.subtitle n'est pas vide", () => {
    expect(siteData.home.subtitle.length).toBeGreaterThan(0);
  });

  it("offers contient les 3 types", () => {
    expect(siteData.offers.abonnement).toBeDefined();
    expect(siteData.offers.coaching).toBeDefined();
    expect(siteData.offers.soutien).toBeDefined();
  });

  it("media.logo pointe vers une image", () => {
    expect(siteData.media.logo).toMatch(/\.(png|jpg|svg|webp)$/);
  });
});

describe("getSiteData", () => {
  it("retourne le même objet que siteData", () => {
    expect(getSiteData()).toBe(siteData);
  });
});
