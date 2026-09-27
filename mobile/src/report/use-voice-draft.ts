import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useState } from 'react';

import type { VoiceDraftResponse } from '../../../contract/types';
import { voiceDraft } from '../api';

type VoiceState = 'idle' | 'recording' | 'processing';

/**
 * Tap to record, tap again to send. Any failure (no permission, no service)
 * ends quietly with null — the user fills in the form by hand.
 */
export function useVoiceDraft(onResult: (draft: VoiceDraftResponse) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<VoiceState>('idle');

  async function start() {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');
    } catch {
      setState('idle');
    }
  }

  async function stop() {
    setState('processing');
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (recorder.uri) {
        const result = await voiceDraft(recorder.uri);
        if (result.transcript || result.category || result.affected_groups.length) onResult(result);
      }
    } catch {
      // quiet by design
    } finally {
      setState('idle');
    }
  }

  return {
    state,
    toggle: () => (state === 'recording' ? stop() : state === 'idle' ? start() : undefined),
  };
}
