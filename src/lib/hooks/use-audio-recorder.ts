'use client'

import { useState, useRef, useCallback } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resolveRef = useRef<((blob: Blob) => void) | null>(null)
  const rejectRef = useRef<((err: Error) => void) | null>(null)

  const startRecording = useCallback(async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/ogg'

    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      if (resolveRef.current) resolveRef.current(blob)
      resolveRef.current = null
      rejectRef.current = null
    }

    recorder.onerror = (e) => {
      if (rejectRef.current) rejectRef.current(new Error(String(e)))
      resolveRef.current = null
      rejectRef.current = null
    }

    recorder.start(250) // collect data every 250ms
    setIsRecording(true)
    setDuration(0)

    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)
  }, [])

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve
      rejectRef.current = reject

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setIsRecording(false)
      setDuration(0)

      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop()
      }

      // Release the mic
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    })
  }, [])

  return { isRecording, duration, startRecording, stopRecording }
}
