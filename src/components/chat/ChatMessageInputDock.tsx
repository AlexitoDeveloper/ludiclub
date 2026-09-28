import { useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Form } from '../ui/form'

interface ChatMessageInputDockProps {
  onSendMessage: (content: string) => Promise<boolean>
  sending: boolean
  disabled?: boolean
}

export function ChatMessageInputDock({
  onSendMessage,
  sending,
  disabled = false
}: ChatMessageInputDockProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending || disabled) return

    const success = await onSendMessage(trimmed)
    if (success) {
      setText('')
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const canSubmit = Boolean(text.trim()) && !sending && !disabled

  return (
    <div className="sticky bottom-0 z-20 p-2.5 sm:p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-border/30 bg-card/95 backdrop-blur-md shrink-0 shadow-xs">
      <Form onSubmit={handleSubmit} className="flex gap-2 items-center max-w-4xl mx-auto">
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('chats.writeMessagePlaceholder', 'Escribe un mensaje en la mesa...')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={400}
          disabled={disabled || sending}
          className="flex-1 h-11 text-xs sm:text-sm font-medium rounded-xl bg-background/60 border-border/40 focus-visible:bg-background shadow-none"
        />

        <Button
          type="submit"
          disabled={!canSubmit}
          loading={sending}
          icon={Send}
          size="icon"
          aria-label={t('chats.sendMessage', 'Enviar mensaje')}
          title={t('chats.sendMessage', 'Enviar mensaje')}
          className="h-11 w-11 rounded-xl shrink-0 shadow-xs transition-all duration-200 active:scale-95"
        />
      </Form>
    </div>
  )
}
