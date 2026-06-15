import { useState, useEffect, useMemo } from 'react';

interface UseAudioWaveformParams {
  audioFileName: string | null;
  audioFileUrl: string | null;
  audioDuration: number;
  duration: number;
  currentTime: number;
}

export const useAudioWaveform = ({
  audioFileName,
  audioFileUrl,
  audioDuration,
  duration,
  currentTime,
}: UseAudioWaveformParams) => {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);

  useEffect(() => {
    if (!audioFileUrl) {
      setPeaks([]);
      setIsDecoding(false);
      return;
    }

    let isMonitorActive = true;
    setIsDecoding(true);

    const loadAndDecodeAudio = async () => {
      try {
        const response = await fetch(audioFileUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (!isMonitorActive) return;

        const channelData = audioBuffer.getChannelData(0);
        const sampleCount = channelData.length;
        const width = 300;
        const step = Math.floor(sampleCount / width);
        const newPeaks: number[] = [];

        for (let i = 0; i < width; i++) {
          const start = i * step;
          let max = 0;
          for (let j = 0; j < step; j++) {
            const val = Math.abs(channelData[start + j]);
            if (val > max) {
              max = val;
            }
          }
          newPeaks.push(max);
        }

        // Normalize
        const maxPeak = Math.max(...newPeaks);
        const normalizedPeaks = maxPeak > 0 ? newPeaks.map(p => p / maxPeak) : newPeaks;

        if (isMonitorActive) {
          setPeaks(normalizedPeaks);
          setIsDecoding(false);
        }
        
        audioCtx.close();
      } catch (err) {
        console.error("Error decoding audio for waveform:", err);
        if (isMonitorActive) {
          setIsDecoding(false);
        }
      }
    };

    loadAndDecodeAudio();

    return () => {
      isMonitorActive = false;
    };
  }, [audioFileUrl]);

  // Generate fallback organic digital waves
  const fallbackPeaks = useMemo(() => {
    const fallback: number[] = [];
    const width = 300;
    for (let i = 0; i < width; i++) {
      const progress = i / (width - 1);
      const envelope = Math.sin(progress * Math.PI);
      const wave = Math.sin(i * 0.08) * 0.45 + 
                   Math.sin(i * 0.18) * 0.25 + 
                   Math.sin(i * 0.03) * 0.2 + 
                   Math.cos(i * 0.35) * 0.1;
      const val = Math.abs(wave) * envelope;
      fallback.push(Math.max(0.04, Math.min(0.95, val)));
    }
    return fallback;
  }, []);

  const activePeaks = peaks.length > 0 ? peaks : fallbackPeaks;

  // Generate SVG path for waveform
  const pathD = useMemo(() => {
    if (activePeaks.length === 0) return '';
    const N = activePeaks.length;
    const centerY = 50;
    const maxAmplitude = 45;

    let topPath = '';
    let bottomPath = '';

    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * 1000;
      const amp = activePeaks[i] * maxAmplitude;
      const yTop = centerY - amp;
      const yBottom = centerY + amp;

      if (i === 0) {
        topPath += `M ${x.toFixed(1)} ${yTop.toFixed(1)}`;
        bottomPath = `L ${x.toFixed(1)} ${yBottom.toFixed(1)}` + bottomPath;
      } else {
        topPath += ` L ${x.toFixed(1)} ${yTop.toFixed(1)}`;
        bottomPath = ` L ${x.toFixed(1)} ${yBottom.toFixed(1)}` + bottomPath;
      }
    }

    return `${topPath} ${bottomPath} Z`;
  }, [activePeaks]);

  const waveformWidthPercent = duration > 0 ? Math.min(100, (audioDuration / duration) * 100) : 100;
  const playedPercent = audioFileName && audioDuration > 0
    ? Math.min(currentTime, audioDuration) / audioDuration
    : duration > 0 ? currentTime / duration : 0;
  const playedWidth = playedPercent * 1000;

  return {
    isDecoding,
    pathD,
    waveformWidthPercent,
    playedWidth,
  };
};
