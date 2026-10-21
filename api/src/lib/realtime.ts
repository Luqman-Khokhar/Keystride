import * as Ably from "ably";
import { HttpError } from "./http";

/** Server-only channel: start/finish announcements. Players may only listen. */
export const raceChannel = (slug: string) => `race:${slug}`;
/** Player channel: progress pings and presence. */
export const raceLiveChannel = (slug: string) => `race-live:${slug}`;

const TOKEN_TTL_MS = 60 * 60 * 1000;

let client: Ably.Rest | null = null;

function ably(): Ably.Rest {
  const key = process.env.ABLY_API_KEY?.trim();
  if (!key) throw new HttpError(503, "Live races are unavailable right now");
  client ??= new Ably.Rest({ key });
  return client;
}

/** Capabilities for one player in one race. Ably pins every message they send to their clientId. */
export function raceCapability(slug: string): Record<string, Ably.capabilityOp[]> {
  return {
    [raceChannel(slug)]: ["subscribe"],
    [raceLiveChannel(slug)]: ["publish", "subscribe", "presence"],
  };
}

/** Signed token request the browser exchanges with Ably for a scoped token. */
export function raceTokenRequest(slug: string, uid: string): Promise<Ably.TokenRequest> {
  return ably().auth.createTokenRequest({
    clientId: uid,
    capability: raceCapability(slug),
    ttl: TOKEN_TTL_MS,
  });
}

/**
 * Announces a race event. The database is the source of truth, so a failed publish is
 * logged, not thrown: players still see the change on their next fetch.
 */
export async function publishRace(slug: string, name: string, data: unknown): Promise<void> {
  try {
    await ably().channels.get(raceChannel(slug)).publish(name, data);
  } catch (err) {
    console.error(`Race publish failed (${name} ${slug}):`, err);
  }
}
