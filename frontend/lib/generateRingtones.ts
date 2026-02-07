/**
 * Generate simple ringtone audio using Web Audio API
 * This creates a basic tone pattern that can be used as a fallback
 */

export const generateRingtone = (type: 'incoming' | 'outgoing'): string => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const duration = type === 'incoming' ? 2 : 1.5 // seconds
    const sampleRate = audioContext.sampleRate
    const numSamples = duration * sampleRate
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
    const channelData = buffer.getChannelData(0)

    // Generate tone pattern
    if (type === 'incoming') {
      // Incoming: Two-tone pattern (higher pitch, more urgent)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const freq1 = 800 // Hz
        const freq2 = 1000 // Hz
        const pattern = Math.floor(t * 4) % 2 // Alternating pattern
        const freq = pattern === 0 ? freq1 : freq2
        channelData[i] = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.exp(-t * 0.5)
      }
    } else {
      // Outgoing: Single tone pattern (lower pitch, calmer)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const freq = 440 // Hz (A4 note)
        channelData[i] = Math.sin(2 * Math.PI * freq * t) * 0.2 * Math.exp(-t * 0.8)
      }
    }

    // Convert buffer to WAV blob URL
    const wavBlob = bufferToWave(buffer, numSamples)
    return URL.createObjectURL(wavBlob)
  } catch (error) {
    console.error('Failed to generate ringtone:', error)
    return ''
  }
}

// Convert AudioBuffer to WAV Blob
function bufferToWave(buffer: AudioBuffer, len: number): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  const data = new Float32Array(len)
  buffer.copyFromChannel(data, 0, 0)

  const dataLength = len * numChannels * bytesPerSample
  const bufferLength = 44 + dataLength
  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  // Write audio data
  let offset = 44
  for (let i = 0; i < len; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
