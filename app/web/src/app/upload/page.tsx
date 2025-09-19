"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"

type SessionUserWithId = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

type SessionWithUserId = {
  user?: SessionUserWithId
} | null

export default function UploadPage() {
  const { data: session } = useSession() as { data: SessionWithUserId }
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!title || !file || !session?.user?.id) {
      console.log(title);
      console.log(session);
      console.log(session?.user?.name)
      
      
      toast( "Title, file, and login required" )
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      // 1. Create video
      const createRes = await apiFetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          ownerId: session.user.id,
        }),
      })
      const { videoId } = await createRes.json()

      // 2. Get presigned URL
      const presignRes = await apiFetch(`/api/videos/${videoId}/presign`, {
        method: "POST",
      })
      const { url, objectKey } = await presignRes.json()

      // 3. Upload with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("PUT", url)
        xhr.setRequestHeader("Content-Type", file.type)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setProgress(percent)
          }
        }

        xhr.onload = () => (xhr.status === 200 ? resolve() : reject(xhr.statusText))
        xhr.onerror = () => reject("Upload failed")
        xhr.send(file)
      })

      // 4. Call complete
      await apiFetch(`/api/videos/${videoId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectKey }),
      })

      toast( "Upload successful! Video is being processed." )
      // router.push(`/watch/${videoId}`)
    } catch (err: any) {
      console.error(err)
      toast( "Upload failed: " + err.message )
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <Card className="max-w-lg mx-auto mt-8">
      <CardContent className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Upload a Video</h2>
        <Input
          placeholder="Video title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {progress > 0 && <Progress value={progress} className="w-full" />}

        <Button onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload Video"}
        </Button>
      </CardContent>
    </Card>
  )
}
