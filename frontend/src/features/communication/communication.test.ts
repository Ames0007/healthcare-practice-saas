import { describe, expect, it } from "vitest";
import type { CommunicationMessage } from "@/components/domain/communication/types";
import { isValidMessageStatusSemantics, matchesChannelFilter, matchesStatusFilter, sortMessagesDesc } from "./communication";

function buildMessage(overrides: Partial<CommunicationMessage> = {}): CommunicationMessage {
  return {
    id: "msg-x",
    channel: "whatsapp",
    purpose: "appointment_reminder",
    recipient: "06 00 00 00 00",
    resolvedBody: "Test",
    status: "queued",
    createdAt: "2026-08-23T08:00:00",
    ...overrides,
  };
}

describe("isValidMessageStatusSemantics", () => {
  it("accepts queued with no sentAt/deliveredAt", () => {
    expect(isValidMessageStatusSemantics(buildMessage({ status: "queued" }))).toBe(true);
  });

  it("rejects queued carrying a sentAt", () => {
    expect(isValidMessageStatusSemantics(buildMessage({ status: "queued", sentAt: "2026-08-23T08:01:00" }))).toBe(false);
  });

  it("accepts sent with sentAt and no deliveredAt", () => {
    expect(isValidMessageStatusSemantics(buildMessage({ status: "sent", sentAt: "2026-08-23T08:01:00" }))).toBe(true);
  });

  it("rejects sent without a sentAt", () => {
    expect(isValidMessageStatusSemantics(buildMessage({ status: "sent" }))).toBe(false);
  });

  it("rejects sent that already carries a deliveredAt", () => {
    expect(
      isValidMessageStatusSemantics(buildMessage({ status: "sent", sentAt: "2026-08-23T08:01:00", deliveredAt: "2026-08-23T08:02:00" })),
    ).toBe(false);
  });

  it("accepts delivered with sentAt <= deliveredAt", () => {
    expect(
      isValidMessageStatusSemantics(buildMessage({ status: "delivered", sentAt: "2026-08-23T08:01:00", deliveredAt: "2026-08-23T08:02:00" })),
    ).toBe(true);
  });

  it("rejects delivered without a sentAt", () => {
    expect(isValidMessageStatusSemantics(buildMessage({ status: "delivered", deliveredAt: "2026-08-23T08:02:00" }))).toBe(false);
  });

  it("rejects failed without a failureReason", () => {
    expect(isValidMessageStatusSemantics(buildMessage({ status: "failed" }))).toBe(false);
  });

  it("accepts failed with a non-empty failureReason and no sentAt", () => {
    expect(isValidMessageStatusSemantics(buildMessage({ status: "failed", failureReason: "Numéro invalide." }))).toBe(true);
  });

  it("accepts failed after being sent, with a failureReason", () => {
    expect(
      isValidMessageStatusSemantics(buildMessage({ status: "failed", sentAt: "2026-08-23T08:01:00", failureReason: "Provider indisponible." })),
    ).toBe(true);
  });
});

describe("matchesChannelFilter", () => {
  it("matches every channel when filter is all", () => {
    expect(matchesChannelFilter(buildMessage({ channel: "sms" }), "all")).toBe(true);
  });

  it("matches only the selected channel", () => {
    expect(matchesChannelFilter(buildMessage({ channel: "sms" }), "whatsapp")).toBe(false);
    expect(matchesChannelFilter(buildMessage({ channel: "sms" }), "sms")).toBe(true);
  });
});

describe("matchesStatusFilter", () => {
  it("matches every status when filter is all", () => {
    expect(matchesStatusFilter(buildMessage({ status: "failed", failureReason: "x" }), "all")).toBe(true);
  });

  it("matches only the selected status", () => {
    const message = buildMessage({ status: "delivered", sentAt: "2026-08-23T08:00:01", deliveredAt: "2026-08-23T08:00:30" });
    expect(matchesStatusFilter(message, "delivered")).toBe(true);
    expect(matchesStatusFilter(message, "sent")).toBe(false);
  });
});

describe("sortMessagesDesc", () => {
  it("orders newest createdAt first regardless of input order", () => {
    const oldest = buildMessage({ id: "a", createdAt: "2026-08-18T10:00:00" });
    const newest = buildMessage({ id: "b", createdAt: "2026-08-23T12:00:00" });
    const middle = buildMessage({ id: "c", createdAt: "2026-08-20T09:00:00" });

    const sorted = sortMessagesDesc([oldest, newest, middle]);

    expect(sorted.map((message) => message.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const messages = [buildMessage({ id: "a", createdAt: "2026-08-18T10:00:00" }), buildMessage({ id: "b", createdAt: "2026-08-23T12:00:00" })];
    const original = [...messages];

    sortMessagesDesc(messages);

    expect(messages).toEqual(original);
  });
});
