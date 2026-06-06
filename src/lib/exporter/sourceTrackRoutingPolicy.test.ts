import { describe, expect, it } from "vitest";
import { resolveSourceTrackRoutingPolicy } from "./sourceTrackRoutingPolicy";

describe("resolveSourceTrackRoutingPolicy", () => {
	it("prioritizes system+mic sidecars and mutes embedded preview", () => {
		const policy = resolveSourceTrackRoutingPolicy("/tmp/recording.mp4", [
			"/tmp/recording.mp4",
			"/tmp/recording.system.wav",
			"/tmp/recording.mic.wav",
			"/tmp/recording.mixed.wav",
		]);

		expect(policy.playbackPaths).toEqual([
			"/tmp/recording.system.wav",
			"/tmp/recording.mic.wav",
		]);
		expect(policy.muteEmbeddedPreview).toBe(true);
		expect(policy.includeEmbeddedInExport).toBe(false);
	});

	it("falls back to mixed when dedicated tracks are absent", () => {
		const policy = resolveSourceTrackRoutingPolicy("/tmp/recording.mp4", [
			"/tmp/recording.mixed.wav",
		]);

		expect(policy.playbackPaths).toEqual(["/tmp/recording.mixed.wav"]);
		expect(policy.muteEmbeddedPreview).toBe(false);
		expect(policy.includeEmbeddedInExport).toBe(false);
	});

	it("mutes embedded audio when a mic sidecar duplicates the inline track", () => {
		// Native macOS bakes the mic into the .mp4 when only the mic is captured and
		// also writes a .mic sidecar. Listing the video itself marks it as having
		// embedded audio, so the embedded track must be dropped to avoid echo.
		const policy = resolveSourceTrackRoutingPolicy("/tmp/recording.mp4", [
			"/tmp/recording.mp4",
			"/tmp/recording.mic.wav",
		]);

		expect(policy.playbackPaths).toEqual(["/tmp/recording.mic.wav"]);
		expect(policy.muteEmbeddedPreview).toBe(true);
		expect(policy.includeEmbeddedInExport).toBe(false);
	});

	it("keeps mic sidecar mix for legacy recordings without embedded audio", () => {
		// Legacy macOS recordings have no inline audio track (the video is not
		// listed as a source), so the mic sidecar must still be mixed in.
		const policy = resolveSourceTrackRoutingPolicy("/tmp/recording.mp4", [
			"/tmp/recording.mic.wav",
		]);

		expect(policy.playbackPaths).toEqual(["/tmp/recording.mic.wav"]);
		expect(policy.muteEmbeddedPreview).toBe(false);
		expect(policy.includeEmbeddedInExport).toBe(true);
	});
});
