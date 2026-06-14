import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { marketService, leagueService } from '../services/api';

export default function Market() {
  const [transfers, setTransfers] = useState([]);
  const [leagues, setLeagues]     = useState([]);
  const [leagueFilter, setFilter] = useState('');
  const [loading, setLoading]     = useState(true);

  const load = (lid) => {
    setLoading(true);
    const params = lid ? { league_id: lid } : {};
    marketService.history(params)
      .then(r => setTransfers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    leagueService.myLeagues().then(r => setLeagues(r.data));
    load('');
  }, []);

  const handleLeagueChange = (lid) => {
    setFilter(lid);
    load(lid);
  };

  const total = {
    buy:  transfers.filter(t => t.action === 'buy').reduce((acc, t) => acc + parseFloat(t.price), 0),
    sell: transfers.filter(t => t.action === 'sell').reduce((acc, t) => acc + parseFloat(t.price), 0),
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">💰 Marché</h1>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={leagueFilter} onChange={e => handleLeagueChange(e.target.value)}>
          <option value="">Toutes les ligues</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* STATS RAPIDES */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-icon">📥</span>
          <div>
            <p className="stat-label">Achats</p>
            <p className="stat-value">{transfers.filter(t => t.action === 'buy').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📤</span>
          <div>
            <p className="stat-label">Ventes</p>
            <p className="stat-value">{transfers.filter(t => t.action === 'sell').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💸</span>
          <div>
            <p className="stat-label">Dépensé</p>
            <p className="stat-value" style={{ fontSize: 20 }}>{total.buy.toFixed(1)} cr.</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💵</span>
          <div>
            <p className="stat-label">Récupéré</p>
            <p className="stat-value" style={{ fontSize: 20 }}>{total.sell.toFixed(1)} cr.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><span className="spinner large" /></div>
      ) : transfers.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">💰</span>
          <p>Aucun transfert. Va dans "Mon Roster" pour acheter des joueurs !</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="lol-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Joueur</th>
                <th>Ligue</th>
                <th>Prix</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--lol-grey-1)', fontSize: 12 }}>
                    {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className={`transfer-${t.action}`}>
                      {t.action === 'buy' ? '📥 Achat' : '📤 Vente'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--lol-gold-light)' }}>{t.player_name}</td>
                  <td style={{ color: 'var(--lol-grey-1)', fontSize: 12 }}>{t.league_name}</td>
                  <td style={{ fontFamily: 'var(--font-display)', color: 'var(--lol-gold-1)' }}>
                    {t.action === 'buy' ? '-' : '+'}{t.price} cr.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
