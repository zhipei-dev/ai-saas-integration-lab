import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type SupportCase = {
  id: number;
  subject: string;
  customerEmail: string;
  description: string;
  status: string;
  createdAt: string;
};

type CaseDetail = SupportCase & {
  suggestion?: { suggestion: { priority: string; classification: string; draftReply: string; confidence: number } };
  timeline: Array<{ id: number; eventType: string; detail: string; createdAt: string }>;
};

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? 'Request failed');
  return body;
}

function App() {
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [selected, setSelected] = useState<CaseDetail | null>(null);
  const [error, setError] = useState('');

  const refresh = async (id?: number) => {
    try {
      setCases(await api<SupportCase[]>('/api/cases'));
      if (id) setSelected(await api<CaseDetail>(`/api/cases/${id}`));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed');
    }
  };

  useEffect(() => { void refresh(); }, []);

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const supportCase = await api<SupportCase>('/api/cases', {
        method: 'POST',
        body: JSON.stringify({
          subject: values.get('subject'),
          customerEmail: values.get('email'),
          description: values.get('description'),
        }),
      });
      form.reset();
      await refresh(supportCase.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed');
    }
  };

  const generate = async () => {
    if (!selected) return;
    try {
      await api(`/api/cases/${selected.id}/suggestion`, { method: 'POST' });
      await refresh(selected.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed');
    }
  };

  const decide = async (decision: 'approved' | 'rejected') => {
    if (!selected) return;
    try {
      await api(`/api/cases/${selected.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      await refresh(selected.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed');
    }
  };

  return (
    <main>
      <header>
        <h1>AI Support Workflow</h1>
        <p>Local-only demo: AI suggestions require human approval.</p>
      </header>
      {error && <p role="alert">{error}</p>}
      <section className="grid">
        <form onSubmit={create}>
          <h2>Create support case</h2>
          <label>Subject<input name="subject" required minLength={3} /></label>
          <label>Customer email<input name="email" type="email" required /></label>
          <label>Description<textarea name="description" required minLength={10} /></label>
          <button>Create case</button>
        </form>
        <section>
          <h2>Cases</h2>
          <ul>
            {cases.map((supportCase) => (
              <li key={supportCase.id}>
                <button className="case" onClick={() => void refresh(supportCase.id)}>
                  {supportCase.subject} <small>{supportCase.status}</small>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </section>
      {selected && (
        <section className="detail">
          <h2>{selected.subject}</h2>
          <p><b>Status:</b> <span data-testid="case-status">{selected.status}</span></p>
          <p>{selected.description}</p>
          {selected.suggestion ? (
            <article>
              <h3>AI suggestion</h3>
              <p><b>{selected.suggestion.suggestion.priority}</b> · {selected.suggestion.suggestion.classification} · {Math.round(selected.suggestion.suggestion.confidence * 100)}% confidence</p>
              <p>{selected.suggestion.suggestion.draftReply}</p>
              {selected.status === 'awaiting_approval' && (
                <>
                  <button onClick={() => void decide('approved')}>Approve suggestion</button>
                  <button className="secondary" onClick={() => void decide('rejected')}>Reject suggestion</button>
                </>
              )}
            </article>
          ) : (
            <button onClick={() => void generate()}>Generate AI suggestion</button>
          )}
          <h3>Audit timeline</h3>
          <ol aria-label="Audit timeline">
            {selected.timeline.map((event) => <li key={event.id}>{event.eventType}: {event.detail}</li>)}
          </ol>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
