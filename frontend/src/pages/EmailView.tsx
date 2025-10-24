import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  bodyText?: string;
  bodyHtml?: string;
  category?: string;
}

export default function EmailView() {
  const { id } = useParams();
  const [email, setEmail] = useState<Email | null>(null);
  const [suggested, setSuggested] = useState<string>('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/emails/${id}`);
      if (res.ok) setEmail(await res.json());
    })();
  }, [id]);

  async function suggestReply() {
    const res = await fetch('/api/replies/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId: id, tone: 'friendly', maxTokens: 200 })
    });
    const json = await res.json();
    setSuggested(json.reply || '');
  }

  if (!email) return <div>Loading...</div>;
  return (
    <div>
      <h2>{email.subject}</h2>
      <div>From: {email.from}</div>
      <div>Date: {new Date(email.date).toLocaleString()}</div>
      <div>Category: {email.category || 'Uncategorized'}</div>
      <hr />
      <pre style={{ whiteSpace: 'pre-wrap' }}>{email.bodyText || ''}</pre>
      <button onClick={suggestReply}>Suggest Reply</button>
      {suggested && (
        <div>
          <h3>Suggested Reply</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{suggested}</pre>
        </div>
      )}
    </div>
  );
}
