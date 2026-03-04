import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  Users,
  Cpu,
  Activity,
  Search,
  TrendingUp,
  LogOut,
  ShieldCheck,
  Zap,
  Lock,
  Mail,
  Euro
} from 'lucide-react';

// Pricing for Gemini 1.5 Flash (Approx avg between input/output in EUR)
// $0.075/1M input, $0.30/1M output -> Avg around €0.15 per 1M tokens for simple text/vision
const COST_PER_1M_TOKENS = 0.15;
const calculateCost = (tokens) => ((tokens || 0) / 1000000) * COST_PER_1M_TOKENS;

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTokens: 0,
    totalRequests: 0,
    proUsers: 0,
    totalCost: 0
  });

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && u.email === 'daforg@hotmail.com') {
        setUser(u);
      } else if (u) {
        setAuthError('Acceso restringido a administradores.');
        signOut(auth);
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  // Data Listener
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(usersData);

      const totalTokens = usersData.reduce((acc, u) => acc + (u.aiTokensUsed || 0), 0);
      const totalRequests = usersData.reduce((acc, u) => acc + (u.aiRequestsCount || 0), 0);
      const proUsers = usersData.filter(u => u.isPro).length;

      setStats({
        totalUsers: usersData.length,
        totalTokens,
        totalRequests,
        proUsers,
        totalCost: calculateCost(totalTokens)
      });
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      if (error.code === 'permission-denied') {
        setAuthError("No tienes permisos de administrador.");
        signOut(auth);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (email !== 'daforg@hotmail.com') {
      setAuthError('Este usuario no tiene permisos de administrador.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError('Credenciales inválidas.');
    }
  };

  const handleLogout = () => signOut(auth);

  const toggleProStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isPro: !currentStatus
      });
    } catch (err) {
      alert("Error al actualizar estado PRO: " + err.message);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="login-container">
        <div className="glass-card login-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--primary-glow)', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem' }}>
              <Lock color="var(--primary)" size={30} />
            </div>
            <h2 className="title-gradient" style={{ fontSize: '1.8rem', margin: 0 }}>Acceso Admin</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>NutriTrack Back-Office</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: 'var(--text-dim)' }} />
              <input
                type="email"
                placeholder="Email administrativo"
                className="login-input"
                style={{ paddingLeft: '45px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '16px', color: 'var(--text-dim)' }} />
              <input
                type="password"
                placeholder="Contraseña"
                className="login-input"
                style={{ paddingLeft: '45px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {authError ? <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>{authError}</p> : null}

            <button type="submit" className="login-button">Entrar al Panel</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>NutriTrack Back-Office</h1>
          <p style={{ color: 'var(--text-dim)', margin: '0.5rem 0' }}>Panel de administración y control de consumos IA</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-box" style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar cliente..."
              style={{ paddingLeft: '45px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Users size={20} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>ACTIVOS</span>
          </div>
          <p className="stat-value">{stats.totalUsers}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Total Usuarios</p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Cpu size={20} color="#8b5cf6" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6' }}>AI CONSUMPTION</span>
          </div>
          <p className="stat-value">{(stats.totalTokens / 1000).toFixed(1)}k</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Tokens Generados</p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Activity size={20} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>PETICIONES</span>
          </div>
          <p className="stat-value">{stats.totalRequests}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Requests IA Totales</p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Euro size={20} color="#10b981" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>COSTO ESTIMADO</span>
          </div>
          <p className="stat-value">{stats.totalCost.toFixed(4)}€</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Gasto API Gemini</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0 1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Gestión de Clientes</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <TrendingUp size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)' }}>Mostrando {filteredUsers.length} resultados</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Activity className="spin" size={32} color="var(--primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>Sincronizando con base de datos...</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>CLIENTE</th>
                <th>PLAN</th>
                <th>TOKENS IA</th>
                <th>COSTO (€)</th>
                <th>REQUESTS</th>
                <th>CREADO</th>
                <th>CONTROL PRO</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, color: '#fff' }}>{client.name || 'Sin nombre'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{client.email || client.id}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${client.isPro ? 'badge-pro' : 'badge-free'}`}>
                      {client.isPro ? 'PRO ACCOUNT' : 'FREE USER'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={14} color="#f59e0b" fill={client.aiTokensUsed > 10000 ? "#f59e0b" : "transparent"} />
                      <span style={{ fontWeight: 700 }}>{client.aiTokensUsed || 0}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>{calculateCost(client.aiTokensUsed).toFixed(4)}€</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{client.aiRequestsCount || 0}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    {client.createdAt?.toDate ? client.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        className={`toggle-btn ${client.isPro ? 'active' : ''}`}
                        onClick={() => toggleProStatus(client.id, client.isPro)}
                      >
                        <div className="toggle-circle" />
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: client.isPro ? 'var(--primary)' : 'var(--text-dim)' }}>
                        {client.isPro ? 'ACTIVADO' : 'DESCTIV.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
