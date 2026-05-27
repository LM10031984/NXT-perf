/**
 * pcm-processor.js — AudioWorklet pour la capture micro Gemini Live
 * Convertit le flux micro en frames Float32Array 16 kHz mono.
 * STUB Wave 0 — logique de resampling complète dans le plan 11-02.
 */
class PcmProcessor extends AudioWorkletProcessor {
  process(inputs, _outputs, _params) {
    const input = inputs[0];
    if (input && input[0]) {
      // Envoie les frames brutes au thread principal
      this.port.postMessage({ type: "audio", data: input[0] });
    }
    return true; // keep alive
  }
}

registerProcessor("pcm-processor", PcmProcessor);
