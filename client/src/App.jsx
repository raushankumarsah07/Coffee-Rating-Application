import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function api(url, options) {
  const res = await fetch(`${API_BASE_URL}${url}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function Stars({ onPick, busy }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars" role="group" aria-label="Rate this coffee" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={busy}
          className={n <= hover ? 'on' : ''}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onPick(n)}
          aria-label={`Rate ${n} out of 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function CoffeeCard({ coffee, onVote, flash, busy }) {
  return (
    <article className="card">
      <div className="tags"><span>{coffee.origin}</span><span>{coffee.roast} roast</span></div>
      <h3>{coffee.name}</h3>
      <p className="score"><strong>{coffee.rating.toFixed(1)}</strong> / 5 <small>({coffee.votes} votes)</small></p>
      <Stars busy={busy} onPick={(n) => onVote(coffee.id, n)} />
      <p className="flash" aria-live="polite">{flash || 'Click a star to vote'}</p>
    </article>
  );
}

export default function App() {
  const [coffees, setCoffees] = useState([]);
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [flash, setFlash] = useState({});
  const [q, setQ] = useState('');
  const [roast, setRoast] = useState('');
  const [origin, setOrigin] = useState('');
  const [sort, setSort] = useState('rating');

  const loadTop = () => api('/api/leaderboard').then(setTop).catch(() => {});

  useEffect(() => {
    api('/api/coffees')
      .then(setCoffees)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    loadTop();
  }, []);

  async function vote(id, rating) {
    setBusyId(id);
    try {
      const updated = await api(`/api/coffees/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      setCoffees((list) => list.map((c) => (c.id === id ? updated : c))); // live update, no reload
      setFlash((f) => ({ ...f, [id]: `Thanks! You gave ${rating}★` }));
      loadTop();
    } catch (e) {
      setFlash((f) => ({ ...f, [id]: e.message }));
    } finally {
      setBusyId(null);
    }
  }

  const origins = useMemo(() => [...new Set(coffees.map((c) => c.origin))].sort(), [coffees]);
  const roasts = useMemo(() => [...new Set(coffees.map((c) => c.roast))], [coffees]);
  const totalVotes = coffees.reduce((s, c) => s + c.votes, 0);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return coffees
      .filter((c) => (!term || `${c.name} ${c.origin}`.toLowerCase().includes(term)) &&
        (!roast || c.roast === roast) && (!origin || c.origin === origin))
      .sort((a, b) =>
        sort === 'votes' ? b.votes - a.votes :
        sort === 'name' ? a.name.localeCompare(b.name, undefined, { numeric: true }) :
        b.rating - a.rating || b.votes - a.votes);
  }, [coffees, q, roast, origin, sort]);

  return (
    <div className="page">
      <header>
        <h1>Coffee Rating</h1>
        <p>{coffees.length} blends · {totalVotes.toLocaleString()} votes cast</p>
      </header>

      <div className="layout">
        <section>
          <div className="filters">
            <input type="search" placeholder="Search name or origin" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
            <select value={roast} onChange={(e) => setRoast(e.target.value)} aria-label="Roast">
              <option value="">All roasts</option>{roasts.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} aria-label="Origin">
              <option value="">All origins</option>{origins.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="rating">Top rated</option><option value="votes">Most votes</option><option value="name">Name</option>
            </select>
          </div>

          {loading && <p className="status">Loading coffees...</p>}
          {error && <p className="status error">{error}</p>}
          {!loading && !error && shown.length === 0 && <p className="status">No coffees match your filters.</p>}
          <div className="grid">
            {shown.map((c) => (
              <CoffeeCard key={c.id} coffee={c} onVote={vote} flash={flash[c.id]} busy={busyId === c.id} />
            ))}
          </div>
        </section>

        <aside className="board">
          <h2>Leaderboard</h2>
          <ol>
            {top.map((c, i) => (
              <li key={c.id}>
                <span className="rank">{i + 1}</span>
                <span className="name">{c.name}<small>{c.origin} · {c.roast}</small></span>
                <span className="pts">{c.rating.toFixed(1)}★<small>{c.votes}</small></span>
              </li>
            ))}
          </ol>
          <p className="hint">Top 5 by average rating (min. 10 votes)</p>
        </aside>
      </div>
    </div>
  );
}
