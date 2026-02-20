'use client'

import { useState } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder'
import { transcribeAudio } from '@/lib/api/audio'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInputButton({ onTranscript, disabled = false }: VoiceInputButtonProps) {
  const { isRecording, duration, startRecording, stopRecording } = useAudioRecorder()
  const [isTranscribing, setIsTranscribing] = useState(false)

  const handleClick = async () => {
    if (isTranscribing) return

    if (!isRecording) {
      try {
        await startRecording()
      } catch {
        toast.error('Microphone access denied. Please allow microphone permission and try again.')
      }
      return
    }

    try {
      const blob = await stopRecording()
      setIsTranscribing(true)
      const text = await transcribeAudio(blob)
      if (text.trim()) {
        onTranscript(text.trim())
      } else {
        toast.error('No speech detected. Please try again.')
      }
    } catch {
      toast.error('Transcription failed. Please try again.')
    } finally {
      setIsTranscribing(false)
    }
  }

  if (isTranscribing) {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled
        className="h-9 w-9 shrink-0 rounded-xl"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="sr-only">Transcribing…</span>
      </Button>
    )
  }

  if (isRecording) {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleClick}
        className={cn(
          'relative h-9 w-9 shrink-0 rounded-xl',
          'text-destructive hover:text-destructive hover:bg-destructive/10',
          'animate-pulse',
        )}
      >
        <Square className="h-4 w-4 fill-current" />
        {duration > 0 && (
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground tabular-nums">
            {duration}s
          </span>
        )}
        <span className="sr-only">Stop recording ({duration}s)</span>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={handleClick}
      disabled={disabled}
      className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
    >
      <Mic className="h-4 w-4" />
      <span className="sr-only">Start voice input</span>
    </Button>
  )
}
