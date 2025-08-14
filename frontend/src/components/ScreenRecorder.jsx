import { useRef, useState } from 'react'

export default function ScreenRecorder() {
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const audioTrackRef = useRef(null)
  const timerRef = useRef(null)

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })

      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ])

      streamRef.current = combinedStream
      audioTrackRef.current = audioStream.getAudioTracks()[0]
      chunksRef.current = []

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: 5_000_000,
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'recording.webm'
        a.click()
        URL.revokeObjectURL(url)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setIsPaused(false)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
    setRecordingTime(0)
    setIsRecording(false)
    setIsPaused(false)
  }

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause()
    setIsPaused(true)
  }

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume()
    setIsPaused(false)
  }

  const toggleMic = () => {
    if (audioTrackRef.current) {
      const enabled = audioTrackRef.current.enabled
      audioTrackRef.current.enabled = !enabled
      setIsMicMuted(enabled)
    }
  }

  const formatTime = (time) => {
    const m = Math.floor(time / 60)
    const s = time % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="text-white bg-gray-900 min-h-screen flex flex-col items-center justify-center gap-2 p-2">
      <p className="text-lg font-mono">⏱ {formatTime(recordingTime)}</p>
      <div className="flex gap-2">
        {!isRecording && (
          <button onClick={startRecording} className="bg-green-600 px-3 py-1 rounded">Start</button>
        )}
        {isRecording && (
          <>
            {!isPaused ? (
              <button onClick={pauseRecording} className="bg-yellow-500 px-3 py-1 rounded">Pause</button>
            ) : (
              <button onClick={resumeRecording} className="bg-blue-500 px-3 py-1 rounded">Resume</button>
            )}
            <button onClick={stopRecording} className="bg-red-600 px-3 py-1 rounded">Stop</button>
            <button onClick={toggleMic} className="bg-gray-700 px-3 py-1 rounded">
              {isMicMuted ? 'Mic Off' : 'Mic On'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}