import { useState, type FormEvent } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/format';
import type { OrderNote } from '@/types/models';

export interface NotesPanelProps {
  notes: OrderNote[];
  isSubmitting: boolean;
  onAddNote: (text: string) => void;
}

export function NotesPanel({ notes, isSubmitting, onAddNote }: NotesPanelProps) {
  const [text, setText] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddNote(trimmed);
    setText('');
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          rows={3}
          placeholder="Add an internal note for the team…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!text.trim()}>
          Add note
        </Button>
      </form>

      <ul className="mt-5 space-y-3">
        {notes.length === 0 && <p className="text-sm text-muted">No internal notes yet.</p>}
        {notes.map((note) => (
          <li key={note.id} className="border border-border bg-surface/50 p-3 text-sm">
            <p className="text-text">{note.note_text}</p>
            <p className="mt-1 text-xs text-muted">{formatDateTime(note.created_at)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
