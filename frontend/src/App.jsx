import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  CreditCard, 
  BarChart3, 
  History, 
  Bell, 
  Lock, 
  RefreshCcw, 
  Search,
  LayoutDashboard,
  AlertTriangle
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

const API_BASE = 'http://localhost:5000';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ total_transactions: 0, fraud_detected: 0 });
  const [transactions, setTransactions] = useState([]);
  const [simulatorData, setSimulatorData] = useState({
    Amount: 100,
    Time: 0,
    ...Object.fromEntries(Array.from({ length: 28 }, (_, i) => [`V${i + 1}`, 0]))
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchTransactions();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/transactions`);
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const randomizeVValues = () => {
    const newData = { ...simulatorData };
    for (let i = 1; i <= 28; i++) {
      // V values in the dataset are PCA components, typically between -5 and 5
      // We'll give a slight bias towards normal values (around 0)
      newData[`V${i}`] = (Math.random() * 6 - 3).toFixed(4);
    }
    setSimulatorData(newData);
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/predict`, simulatorData);
      setPredictionResult(res.data);
      
      // Save to database
      await axios.post(`${API_BASE}/add-transaction`, {
        amount: simulatorData.Amount,
        probability: res.data.probability,
        is_fraud: res.data.fraud,
        explanation: res.data.reason
      });
      
      fetchStats();
      fetchTransactions();
      
      if (res.data.fraud) {
        addNotification(`Fraud alert! High risk transaction detected: $${simulatorData.Amount}`, 'error');
      }
    } catch (err) {
      console.error("Prediction error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to connect to backend. Please ensure the backend server is running.";
      addNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (message, type) => {
    const id = Date.now();
    setNotifications([{ id, message, type }, ...notifications]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.post(`${API_BASE}/update-status`, { id, status });
      fetchTransactions();
      addNotification(`Transaction #${id} marked as ${status}`, 'success');
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const pieData = {
    labels: ['Legit', 'Fraud'],
    datasets: [{
      data: [stats.total_transactions - stats.fraud_detected, stats.fraud_detected],
      backgroundColor: ['#10b981', '#ef4444'],
      borderColor: ['#0a0b10', '#0a0b10'],
      borderWidth: 2,
    }]
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <ShieldAlert size={28} />
          <span>GuardianAI</span>
        </div>
        
        <nav className="nav-links">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'simulator' ? 'active' : ''}`} onClick={() => setActiveTab('simulator')}>
            <Activity size={20} /> Simulator
          </div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <History size={20} /> History
          </div>
        </nav>

        <div style={{marginTop: 'auto'}}>
          <div className="nav-item">
            <Bell size={20} /> Alerts ({stats.fraud_detected})
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>Credit Card Fraud Detection</h1>
            <p style={{color: 'var(--text-muted)'}}>Real-time monitoring and explainable AI insights</p>
          </div>
          <div className="btn btn-secondary">
            <RefreshCcw size={16} /> Syncing
          </div>
        </header>

        {/* Stats Row */}
        <div className="stats-grid">
          <StatCard label="Total Transactions" value={stats.total_transactions} icon={<CreditCard color="var(--accent-primary)" />} />
          <StatCard label="Fraud Detected" value={stats.fraud_detected} icon={<ShieldAlert color="var(--danger)" />} />
          <StatCard label="Fraud Rate" value={stats.total_transactions ? `${((stats.fraud_detected / stats.total_transactions) * 100).toFixed(2)}%` : '0%'} icon={<Activity color="var(--warning)" />} />
          <StatCard label="Protected Volume" value={`$${(stats.total_transactions * 142).toLocaleString()}`} icon={<ShieldCheck color="var(--success)" />} />
        </div>

        {activeTab === 'dashboard' && (
          <div className="dashboard-grid fade-in">
            <div className="left-col">
              <div className="card">
                <h3 className="card-title"><BarChart3 size={20} color="var(--accent-primary)" /> Fraud Distribution</h3>
                <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                  <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                </div>
              </div>
              
              <div className="card">
                <h3 className="card-title"><History size={20} color="var(--accent-primary)" /> Recent Activity</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Time</th>
                        <th>Amount</th>
                        <th>Risk</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map(tx => (
                        <tr key={tx.id}>
                          <td>#{tx.id}</td>
                          <td>{new Date(tx.timestamp).toLocaleTimeString()}</td>
                          <td>${tx.amount}</td>
                          <td>
                            <span className={`status-badge ${tx.is_fraud ? 'status-fraud' : 'status-legit'}`}>
                              {(tx.fraud_probability * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td>{tx.status}</td>
                          <td>
                            <div className="action-btns">
                              <button className="action-btn" title="Block Card" onClick={() => updateStatus(tx.id, 'Blocked')}><Lock size={14} /></button>
                              <button className="action-btn" title="Send Alert" onClick={() => addNotification(`Alert sent for Transaction #${tx.id}`, 'info')}><Bell size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="right-col">
              <div className="card" style={{height: '100%'}}>
                <h3 className="card-title"><Search size={20} color="var(--accent-primary)" /> Live Monitor</h3>
                <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem'}}>
                  The system is currently analyzing incoming streams...
                </p>
                <div className="simulator-mini">
                   {/* Mini Simulator form or logs */}
                   {notifications.map(n => (
                     <div key={n.id} className={`fade-in`} style={{
                       padding: '1rem', 
                       borderRadius: '12px', 
                       background: n.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                       borderLeft: `4px solid ${n.type === 'error' ? 'var(--danger)' : 'var(--accent-primary)'}`,
                       marginBottom: '1rem',
                       fontSize: '0.85rem'
                     }}>
                       {n.message}
                     </div>
                   ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="fade-in">
            <div className="dashboard-grid">
              <div className="card">
                <h3 className="card-title">Transaction Simulator</h3>
                <div className="simulator-form">
                  <div className="input-group">
                    <label>Transaction Amount ($)</label>
                    <input 
                      type="number" 
                      value={simulatorData.Amount} 
                      onChange={(e) => setSimulatorData({...simulatorData, Amount: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Time Offset (Seconds)</label>
                    <input 
                      type="number" 
                      value={simulatorData.Time}
                      onChange={(e) => setSimulatorData({...simulatorData, Time: e.target.value})}
                    />
                  </div>
                  <div className="input-group" style={{gridColumn: 'span 2'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                      <label>Feature Variables (V1-V28)</label>
                      <button className="btn btn-secondary" style={{padding: '0.25rem 0.75rem', fontSize: '0.75rem'}} onClick={randomizeVValues}>
                        Randomize Features
                      </button>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem'}}>
                      {[1, 2, 3, 4, 10, 14, 17].map(num => (
                        <div key={num} className="input-group">
                          <label style={{fontSize: '0.6rem'}}>V{num}</label>
                          <input 
                            style={{padding: '0.4rem', fontSize: '0.75rem'}}
                            type="number" 
                            value={simulatorData[`V${num}`]}
                            onChange={(e) => setSimulatorData({...simulatorData, [`V${num}`]: e.target.value})}
                          />
                        </div>
                      ))}
                      <div style={{display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem'}}>...others hidden</div>
                    </div>
                  </div>
                </div>
                <button 
                  className="btn" 
                  style={{width: '100%', marginTop: '2rem'}} 
                  onClick={runSimulation}
                  disabled={loading}
                >
                  {loading ? <RefreshCcw className="animate-spin" /> : <ShieldCheck size={18} />}
                  {loading ? 'Analyzing...' : 'Run Fraud Analysis'}
                </button>
              </div>

              <div className="card">
                <h3 className="card-title">Analysis Result</h3>
                {predictionResult ? (
                  <div className="result-panel fade-in">
                    <div style={{marginBottom: '1rem'}}>
                      {predictionResult.fraud ? (
                        <AlertTriangle size={64} color="var(--danger)" style={{margin: '0 auto'}} />
                      ) : (
                        <ShieldCheck size={64} color="var(--success)" style={{margin: '0 auto'}} />
                      )}
                    </div>
                    <h2 style={{color: predictionResult.fraud ? 'var(--danger)' : 'var(--success)'}}>
                      {predictionResult.fraud ? 'Fraudulent' : 'Legitimate'}
                    </h2>
                    <p style={{color: 'var(--text-muted)', marginTop: '0.5rem'}}>
                      Probability: {(predictionResult.probability * 100).toFixed(2)}%
                    </p>
                    
                    <div className="risk-meter">
                      <div className="risk-fill" style={{
                        width: `${predictionResult.probability * 100}%`,
                        backgroundColor: predictionResult.fraud ? 'var(--danger)' : 'var(--success)'
                      }}></div>
                    </div>

                    <div style={{background: 'var(--glass)', padding: '1rem', borderRadius: '12px', textAlign: 'left'}}>
                      <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>Explainable AI Reason:</p>
                      <p style={{fontWeight: '600'}}>{predictionResult.reason}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)'}}>
                    <Activity size={48} style={{opacity: 0.2, marginBottom: '1rem'}} />
                    <p>Ready for simulation</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card fade-in">
            <h3 className="card-title"><History size={20} /> Transaction History</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Timestamp</th>
                    <th>Amount</th>
                    <th>Risk Score</th>
                    <th>Explanation</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td>#{tx.id}</td>
                      <td>{new Date(tx.timestamp).toLocaleString()}</td>
                      <td>${tx.amount}</td>
                      <td>
                        <span className={`status-badge ${tx.is_fraud ? 'status-fraud' : 'status-legit'}`}>
                          {(tx.fraud_probability * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{fontSize: '0.8rem', maxWidth: '200px'}}>{tx.explanation}</td>
                      <td>{tx.status}</td>
                      <td>
                         <div className="action-btns">
                            <button className="action-btn" title="Block" onClick={() => updateStatus(tx.id, 'Blocked')}><Lock size={14} /></button>
                            <button className="action-btn" title="Clear" onClick={() => updateStatus(tx.id, 'Cleared')}><ShieldCheck size={14} /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
        <span className="stat-label">{label}</span>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default App;
