'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'
import { useState } from 'react'

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const TextEditor = ({ value, onChange, placeholder }: TextEditorProps) => {
  const [text, setText] = useState(value)

  const handleChange = (newValue: string) => {
    setText(newValue)
    onChange(newValue)
  }

  const addFormatting = (format: string) => {
    const textarea = document.querySelector('textarea')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = text.substring(start, end)
    let newText = text

    switch (format) {
      case 'bold':
        newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end)
        break
      case 'italic':
        newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end)
        break
      case 'bullet':
        newText = text.substring(0, start) + `\n• ${selectedText}` + text.substring(end)
        break
      case 'numbered':
        newText = text.substring(0, start) + `\n1. ${selectedText}` + text.substring(end)
        break
    }

    handleChange(newText)
  }

  return (
    <div className='border rounded-lg'>
      <div className='border-b p-2 flex flex-wrap gap-2'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => addFormatting('bold')}
        >
          <Bold className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => addFormatting('italic')}
        >
          <Italic className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => addFormatting('bullet')}
        >
          <List className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => addFormatting('numbered')}
        >
          <ListOrdered className='h-4 w-4' />
        </Button>
      </div>
      <Textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || 'Start writing...'}
        className='min-h-[200px] p-4 resize-none'
      />
    </div>
  )
}

export default TextEditor 