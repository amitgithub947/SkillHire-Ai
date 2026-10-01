import axios from 'axios'
import { api } from './api'

export interface DownloadedFile {
  blob: Blob
  fileName: string
}

/**
 * Downloads a protected file. A plain <a href> can't send our JWT, so the file
 * is fetched with Axios and handed to the browser as a blob.
 */
export async function fetchFile(url: string, fallbackName: string): Promise<DownloadedFile> {
  try {
    const response = await api.get<Blob>(url, { responseType: 'blob' })
    return { blob: response.data, fileName: fileNameFrom(response.headers['content-disposition']) ?? fallbackName }
  } catch (error) {
    // Error bodies also arrive as a Blob; turn them back into JSON so
    // parseApiError can show the server's message.
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text())
      } catch {
        // Not JSON: keep the generic message.
      }
    }
    throw error
  }
}
function fileNameFrom(header: string | undefined): string | null {
  if (!header) return null
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8) return decodeURIComponent(utf8[1])
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain ? plain[1] : null
}
