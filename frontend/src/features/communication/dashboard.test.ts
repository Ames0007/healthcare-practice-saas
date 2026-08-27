import { describe, expect, it } from "vitest";
import type { CommunicationMessage } from "@/components/domain/communication/types";
import { computeCommunicationKpis, getFailedMessageRows, getQueuedMessageRows, MESSAGE_VOLUME_WINDOW_DAYS } from "./dashboard";

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

describe("computeCommunicationKpis", () => {
  it("counts failed and queued messages independently of volume", () => {
    const messages = [
      buildMessage({ id: "a", status: "failed", failureReason: "x" }),
      buildMessage({ id: "b", status: "queued" }),
      buildMessage({ id: "c", status: "queued" }),
      buildMessage({ id: "d", status: "sent", sentAt: "2026-08-23T08:00:01" }),
    ];
    const kpis = computeCommunicationKpis(messages, "2026-08-23");
    expect(kpis.failedCount).toBe(1);
    expect(kpis.queuedCount).toBe(2);
  });

  it("counts sent/delivered messages within the volume window, inclusive of day 0", () => {
    const messages = [
      buildMessage({ id: "today", status: "sent", createdAt: "2026-08-23T08:00:00", sentAt: "2026-08-23T08:00:01" }),
      buildMessage({
        id: "edge",
        status: "delivered",
        createdAt: `2026-08-${23 - MESSAGE_VOLUME_WINDOW_DAYS}T08:00:00`,
        sentAt: "2026-08-16T08:00:01",
        deliveredAt: "2026-08-16T08:00:30",
      }),
      buildMessage({ id: "too-old", status: "delivered", createdAt: "2026-08-01T08:00:00", sentAt: "2026-08-01T08:00:01", deliveredAt: "2026-08-01T08:00:30" }),
      buildMessage({ id: "not-sent-yet", status: "queued", createdAt: "2026-08-23T08:00:00" }),
    ];
    const kpis = computeCommunicationKpis(messages, "2026-08-23");
    expect(kpis.recentVolumeCount).toBe(2);
  });

  it("excludes every message when businessDate is before any of them existed", () => {
    const messages = [buildMessage({ id: "a", status: "delivered", createdAt: "2026-08-20T08:00:00", sentAt: "2026-08-20T08:00:01", deliveredAt: "2026-08-20T08:00:30" })];
    expect(computeCommunicationKpis(messages, "2026-01-01").recentVolumeCount).toBe(0);
  });
});

describe("getFailedMessageRows / getQueuedMessageRows", () => {
  it("only returns rows of the matching status, newest first", () => {
    const messages = [
      buildMessage({ id: "old-failed", status: "failed", failureReason: "x", createdAt: "2026-08-01T08:00:00" }),
      buildMessage({ id: "new-failed", status: "failed", failureReason: "y", createdAt: "2026-08-23T08:00:00" }),
      buildMessage({ id: "queued-1", status: "queued", createdAt: "2026-08-20T08:00:00" }),
    ];
    const failedRows = getFailedMessageRows(messages, [], [], []);
    expect(failedRows.map((row) => row.message.id)).toEqual(["new-failed", "old-failed"]);

    const queuedRows = getQueuedMessageRows(messages, [], [], []);
    expect(queuedRows.map((row) => row.message.id)).toEqual(["queued-1"]);
  });
});
