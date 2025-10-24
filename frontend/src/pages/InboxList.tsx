import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface EmailItem {
  id: string;
  subject: string;
  from: string;
  date: string;
  category?: string;
}

export default function InboxList() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [query, setQuery] = useState('');
  const [account, setAccount] = useState('');
  const [folder, setFolder] = useState('');
  const [category, setCategory] = useState('');

  async function load() {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (account) params.set('account', account);
    if (folder) params.set('folder', folder);
    if (category) params.set('category', category);
    const res = await fetch(`/api/emails?${params.toString()}`);
    const json = await res.json();
    setEmails(json.items || []);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="inbox">
      <div className="filters">
        <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input placeholder="Account" value={account} onChange={(e) => setAccount(e.target.value)} />
        <input placeholder="Folder" value={folder} onChange={(e) => setFolder(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All</option>
          <option>Interested</option>
          <option>Meeting Booked</option>
          <option>Not Interested</option>
          <option>Spam</option>
          <option>Out of Office</option>
        </select>
        <button onClick={load}>Search</button>
      </div>
      <ul>
        {emails.map((e) => (
          <li key={e.id}>
            <Link to={`/email/${encodeURIComponent(e.id)}`}>
              <strong>{e.subject}</strong> — {e.from} — {new Date(e.date).toLocaleString()} — <em>{e.category || 'Uncategorized'}</em>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
