import { Platform, Share } from 'react-native'

type ShareFn = (message: string) => Promise<'shared' | 'copied' | 'dismissed'>

/**
 * THE platform branch — the only one in the app.
 *
 * Web: the browser's share sheet (navigator.share), or the clipboard where
 * there isn't one. Native: React Native's Share, which opens the iOS/Android
 * sheet. Every web API (`navigator`) lives inside the web function, so the
 * native path never touches it — and Metro drops the unused branch from each
 * platform's bundle.
 */
export const shareProgress: ShareFn = Platform.select<ShareFn>({
  web: async (message) => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: message })
        return 'shared'
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return 'dismissed'
      }
    }
    await navigator.clipboard.writeText(message)
    return 'copied'
  },
  default: async (message) => {
    const result = await Share.share({ message })
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared'
  },
})
