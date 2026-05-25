'use client';

import { useEffect, useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  value: string;
  onChange: (next: string) => void;
  lang?: 'en-IN' | 'en-US' | 'hi-IN';
  /** "replace" overwrites field, "append" adds to existing text */
  mode?: 'replace' | 'append';
  className?: string;
  title?: string;
}

export function VoiceInput({
  value,
  onChange,
  lang = 'en-IN',
  mode = 'append',
  className,
  title = 'Speak to fill this field',
}: VoiceInputProps) {
  const { supported, listening, transcript, interimTranscript, error, start, stop } =
    useSpeechRecognition({ lang, continuous: true, interim: true });
  const [baseValue, setBaseValue] = useState('');

  useEffect(() => {
    if (!error) return;
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      toast.error(
        'Microphone blocked. Click the 🔒 lock icon in your browser URL bar → Site Settings → Microphone → Allow, then refresh.',
        { duration: 8000 }
      );
    } else if (error === 'no-speech') {
      toast.error('No speech detected. Please try again and speak louder.');
    } else if (error === 'audio-capture') {
      toast.error('No microphone found. Please connect a mic and try again.');
    } else if (error === 'network') {
      toast.error('Speech recognition needs internet. Please check your connection.');
    } else {
      toast.error(`Microphone error: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (!listening) return;
    const live = (transcript + ' ' + interimTranscript).trim();
    if (mode === 'replace') {
      onChange(live);
    } else {
      const sep = baseValue && live ? ' ' : '';
      onChange(`${baseValue}${sep}${live}`.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, interimTranscript, listening]);

  if (!supported) {
    return (
      <button
        type="button"
        title="Voice input not supported in this browser. Try Chrome or Edge."
        disabled
        className={cn(
          'grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-300',
          className
        )}
      >
        <MicOff className="h-4 w-4" />
      </button>
    );
  }

  const toggle = async () => {
    if (listening) {
      stop();
      return;
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (e: any) {
      if (e?.name === 'NotAllowedError') {
        toast.error(
          'Microphone blocked. Click the 🔒 lock icon in your browser URL bar → Site Settings → Microphone → Allow, then refresh.',
          { duration: 8000 }
        );
        return;
      }
      if (e?.name === 'NotFoundError') {
        toast.error('No microphone found on this device.');
        return;
      }
    }
    setBaseValue(value || '');
    start();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Stop listening' : title}
      className={cn(
        'relative grid h-9 w-9 place-items-center rounded-lg border transition',
        listening
          ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-sm'
          : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600',
        className
      )}
    >
      {listening ? (
        <>
          <Mic className="h-4 w-4" />
          <span className="absolute inset-0 -z-10 animate-ping rounded-lg bg-rose-300/50" />
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}

export function VoiceInputCompact({
  value,
  onChange,
  lang = 'en-IN',
  mode = 'append',
}: Omit<VoiceInputProps, 'className' | 'title'>) {
  return (
    <VoiceInput
      value={value}
      onChange={onChange}
      lang={lang}
      mode={mode}
      className="!h-8 !w-8"
    />
  );
}
