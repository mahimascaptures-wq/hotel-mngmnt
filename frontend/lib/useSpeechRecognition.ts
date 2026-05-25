'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Lang = 'en-IN' | 'en-US' | 'hi-IN';

interface UseSpeechRecognitionOptions {
  lang?: Lang;
  continuous?: boolean;
  interim?: boolean;
}

interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(
  opts: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionResult {
  const { lang = 'en-IN', continuous = true, interim = true } = opts;
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interim;

    recognition.onresult = (event: any) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalRef.current += (finalRef.current ? ' ' : '') + text.trim();
          setTranscript(finalRef.current);
          setInterimTranscript('');
        } else {
          interimText += text;
        }
      }
      if (interimText) setInterimTranscript(interimText);
    };

    recognition.onerror = (e: any) => {
      setError(e.error || 'Speech recognition error');
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [lang, continuous, interim]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    finalRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e: any) {
      setError(e?.message || 'Could not start');
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    supported,
    listening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}
