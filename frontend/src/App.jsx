import { useEffect, useMemo, useRef, useState } from 'react';
import { providers, detectProviderByHostname } from './data/providers';
import { getAllEndpoints, getCategoryDisplayName } from './data/endpoints';
import { exportReport } from './utils/exportReport';

export default function App() {
  const [rounds, setRounds] = useState(3);
  const [delay, setDelay] = useState(2);
  const [selectedProviders, setSelectedProviders] = useState(
    providers.map((provider) => provider.id)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Idle');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const endpoints = useMemo(() => getAllEndpoints(), []);
  const currentProviderId =
    detectProviderByHostname(window.location.hostname) || providers[0].id;
  const activeProviders = useMemo(() => {
    const filtered = providers.filter((provider) => selectedProviders.includes(provider.id));
    return filtered.length > 0 ? filtered : providers;
  }, [selectedProviders]);

  const statusLookup = useMemo(() => buildStatusLookup(results), [results]);
  const scores = useMemo(
    () => computeScores(endpoints, activeProviders, statusLookup),
    [endpoints, activeProviders, statusLookup]
  );
  const issues = useMemo(() => detectIssues(scores, activeProviders), [scores, activeProviders]);

  const closeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  useEffect(() => () => closeStream(), []);

  const handleStart = () => {
    closeStream();
    setError(null);

    if (activeProviders.length === 0) {
      setError('Please select at least one provider to test.');
      setStatus('❌ Test run failed');
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setStatus('🔄 Running tests on server...');

    const params = new URLSearchParams({
      rounds: String(rounds),
      delay: String(delay),
      providers: activeProviders.map((provider) => provider.id).join(',')
    });

    const stream = new EventSource(`/tests/run/stream?${params.toString()}`);
    eventSourceRef.current = stream;

    stream.addEventListener('progress', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.total) {
          const percent = Math.round((payload.completed / payload.total) * 100);
          setProgress(Number.isFinite(percent) ? percent : 0);
          setStatus(`🔄 ${payload.completed}/${payload.total} tests...`);
        }
        if (payload.result) {
          setResults((prev) => [...prev, payload.result]);
        }
      } catch (err) {
        console.error('Failed to parse progress event', err);
      }
    });

    stream.addEventListener('complete', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setResults(payload.results || []);
      } catch (err) {
        console.error('Failed to parse complete event', err);
      }
      setProgress(100);
      setStatus('✅ All tests completed!');
      setIsRunning(false);
      closeStream();
    });

    stream.addEventListener('error', (event) => {
      let message = 'Stream connection failed';
      try {
        if (event.data) {
          const payload = JSON.parse(event.data);
          if (payload?.error) {
            message = payload.error;
          }
        }
      } catch {
        // ignore parse errors
      }
      setError(message);
      setStatus('❌ Test run failed');
      setIsRunning(false);
      closeStream();
    });
  };

  const handleReset = () => {
    closeStream();
    setIsRunning(false);
    setResults([]);
    setError(null);
    setProgress(0);
    setStatus('Idle');
  };

  const handleExport = () => {
    exportReport({ results, providers: activeProviders, endpoints, currentProviderId });
  };

  return (
    <div className="app-shell">
      <div className="container">
        <div className="header">
          <h1>🚀 CDN Functionality Tester</h1>
          <p>Test all VergeCloud and ArvanCloud features with one click</p>
        </div>

        <div className="main-grid">
          <div className="card">
            <h2>⚙️ Test Configuration</h2>
            <div className="control-panel">
              <div className="form-group">
                <label htmlFor="rounds">Number of Rounds</label>
                <input
                  id="rounds"
                  type="number"
                  value={rounds}
                  min={1}
                  max={10}
                  onChange={(e) => setRounds(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="delay">Delay Between Tests (seconds)</label>
                <input
                  id="delay"
                  type="number"
                  value={delay}
                  min={0}
                  max={10}
                  step={0.5}
                  onChange={(e) => setDelay(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Providers to Test</label>
                <div className="provider-options">
                  {providers.map((provider) => (
                    <label key={provider.id} className="provider-option">
                      <input
                        type="checkbox"
                        checked={selectedProviders.includes(provider.id)}
                        onChange={() =>
                          toggleProviderSelection(provider.id, selectedProviders, setSelectedProviders)
                        }
                      />
                      <span>{provider.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="test-description">
                <h3>🧪 Complete CDN Functionality Test</h3>
                <p>This comprehensive test evaluates all aspects of CDN providers:</p>
                <div className="test-features">
                  <Feature icon="⚡" label="Frontend Performance" />
                  <Feature icon="🛡️" label="Security & WAF" />
                  <Feature icon="🔌" label="API Functionality" />
                  <Feature icon="📊" label="Feature Comparison" />
                </div>
                <p>
                  <strong>
                    Tests both VergeCloud and ArvanCloud to determine which features each provider
                    actually supports.
                  </strong>
                </p>
              </div>

              <button className="btn btn-primary" onClick={handleStart} disabled={isRunning}>
                {isRunning ? 'Running...' : '▶️ START TESTS'}
              </button>
            </div>
          </div>

          <div className="card">
            <h2>📊 Results</h2>
            {isRunning && (
              <div className="progress-container">
                <div className="progress-label">
                  <span className="label-text">Testing Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <div className="status-box">
                  <p className="status-text">{status}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="status-box error">
                <p className="status-text">Error: {error}</p>
              </div>
            )}

            <div className="results-section active">
              <div className="summary-cards">
                {activeProviders.map((provider) => (
                  <ScoreCard key={provider.id} provider={provider} score={scores[provider.id]} />
                ))}
              </div>

              <Legend />

              <table className="results-table">
                <thead>
                  <tr>
                    <th>Test Category</th>
                    {activeProviders.map((provider) => (
                      <th key={provider.id} style={{ textAlign: 'center' }}>
                        {provider.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renderResultsRows(endpoints, activeProviders, statusLookup)}
                </tbody>
              </table>

              <IssuesList issues={issues} />

              <div className="action-buttons">
                <button className="btn btn-primary" onClick={handleStart} disabled={isRunning}>
                  🔄 {isRunning ? 'Running...' : 'Test Again'}
                </button>
                <button className="btn btn-info" onClick={handleExport} disabled={results.length === 0}>
                  📊 Export Report
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                  ◀ Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', color: 'white' }}>
          <p>
            📖{' '}
            <a href="/tests/manual.html" style={{ color: 'white', textDecoration: 'underline' }}>
              Manual Testing Guide
            </a>{' '}
            • 📚{' '}
            <a href="/tests/auto.html" style={{ color: 'white', textDecoration: 'underline' }}>
              Advanced Test Runner
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }) {
  return (
    <div className="feature-item">
      <span className="feature-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function ScoreCard({ provider, score }) {
  const totalText = score?.total ?? 0;
  const passedText = score?.passed ?? 0;
  return (
    <div className={`summary-card ${provider.id === 'verge' ? 'verge' : 'arvan'}`}>
      <div className="emoji">{provider.emoji}</div>
      <div className="provider-name">{provider.name}</div>
      <div className="score">
        {passedText}/{totalText}
      </div>
      <div className="score-label">Features Working</div>
    </div>
  );
}

function Legend() {
  const items = [
    { className: 'success', label: '✅ Working' },
    { className: 'security', label: '🛡️ Security Blocked (Good!)' },
    { className: 'warning', label: '⚠️ Issues' },
    { className: 'error', label: '❌ Failing' },
    { className: 'loading', label: '⏳ Testing' }
  ];

  return (
    <div className="legend">
      <h4>Status Indicators:</h4>
      <div className="legend-items">
        {items.map((item) => (
          <div className="legend-item" key={item.label}>
            <div className={`legend-box ${item.className}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IssuesList({ issues }) {
  if (!issues.length) return null;
  return (
    <div className="issues-section active">
      <h4>⚠️ Issues Found:</h4>
      <ul className="issues-list">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}

function renderResultsRows(endpoints, providers, statusLookup) {
  let currentCategory = '';
  const rows = [];

  endpoints.forEach((endpoint) => {
    if (endpoint.category !== currentCategory) {
      currentCategory = endpoint.category;
      rows.push(
        <tr key={`category-${endpoint.category}`} className="category-row">
          <td className="category-header" colSpan={providers.length + 1}>
            <strong>{getCategoryDisplayName(endpoint.category)}</strong>
          </td>
        </tr>
      );
    }

    rows.push(
      <tr key={endpoint.id}>
        <td className="endpoint">{endpoint.name}</td>
        {providers.map((provider) => (
          <td className="status" key={`${provider.id}-${endpoint.id}`}>
            {renderStatusIndicator(endpoint, provider, statusLookup)}
          </td>
        ))}
      </tr>
    );
  });

  return rows;
}

function renderStatusIndicator(endpoint, provider, statusLookup) {
  const providerStatuses = statusLookup[provider.id] || {};
  const result = providerStatuses[endpoint.id];

  if (!result && endpoint.category === 'api') {
    return <span className="status-indicator warning">—</span>;
  }

  if (!result) {
    return <span className="status-indicator loading">⏳</span>;
  }

  if (result.blockedBySecurity) {
    return <span className="status-indicator security">🛡️</span>;
  }

  if (result.success) {
    return <span className="status-indicator success">✅</span>;
  }

  return <span className="status-indicator error">❌</span>;
}

function buildStatusLookup(results) {
  const lookup = {};
  results.forEach((result) => {
    if (result.isApiTest) {
      result.apiResults?.forEach((apiResult) => {
        lookup[apiResult.providerId] = lookup[apiResult.providerId] || {};
        lookup[apiResult.providerId][result.endpointId] = {
          success: apiResult.success,
          status: apiResult.status,
          error: apiResult.error
        };
      });
      return;
    }

    lookup[result.providerId] = lookup[result.providerId] || {};
    lookup[result.providerId][result.endpointId] = result;
  });
  return lookup;
}

function computeScores(endpoints, providers, statusLookup) {
  const scores = {};
  providers.forEach((provider) => {
    let total = 0;
    let passed = 0;
    endpoints.forEach((endpoint) => {
      const providerStatuses = statusLookup[provider.id] || {};
      if (endpoint.category === 'api' && !providerStatuses[endpoint.id]) {
        return;
      }
      total += 1;
      const result = providerStatuses[endpoint.id];
      if (result?.success || result?.blockedBySecurity) {
        passed += 1;
      }
    });
    scores[provider.id] = { passed, total };
  });
  return scores;
}

function detectIssues(scores, providers) {
  const providerLookup = providers.reduce((acc, provider) => {
    acc[provider.id] = provider.name;
    return acc;
  }, {});

  return Object.entries(scores)
    .filter(([, score]) => score.total > 0 && score.passed < score.total * 0.7)
    .map(
      ([providerId]) =>
        `${providerLookup[providerId] || providerId}: Multiple tests failing - check configuration`
    );
}

function toggleProviderSelection(id, selected, setSelected) {
  if (selected.includes(id)) {
    if (selected.length === 1) {
      return;
    }
    setSelected(selected.filter((providerId) => providerId !== id));
  } else {
    setSelected([...selected, id]);
  }
}

