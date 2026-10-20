// Client-safe voice-label accessor; never imports the server picker/dict so
// voice-copy stays out of the client bundle. Property-name fallback preserved.
export type VoiceLabels = Record<string, string>;

// Property-name fallback preserved from the original voiceCopy Proxy:
// a missing key resolves to the key name itself.
export function readVoiceLabels(labels: VoiceLabels): VoiceLabels {
  return new Proxy(labels, {
    get(target, property: string) {
      return target[property] ?? property;
    },
  });
}
