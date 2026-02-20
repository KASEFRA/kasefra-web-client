import { apiClient } from './client'

export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('audio', blob, 'recording.webm')
  const response = await apiClient.post<{ text: string }>('/audio/transcribe', formData, {
    headers: { 'Content-Type': undefined },
  })
  return response.data.text
}
