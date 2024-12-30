import React, { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import './App.css';

// 注册Chart.js组件
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [userId] = useState(() => {
    const saved = localStorage.getItem('userId');
    return saved || Math.random().toString(36).substring(7);
  });

  // 主题切换
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // 加载历史记录
  useEffect(() => {
    fetchHistory();
    localStorage.setItem('userId', userId);
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/history/${userId}`);
      const data = await response.json();
      if (data.status === 'success') {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      age_difference: parseFloat(e.target.age_difference.value) / 100,
      common_interests: parseFloat(e.target.common_interests.value) / 100,
      communication: parseFloat(e.target.communication.value) / 100,
      values_alignment: parseFloat(e.target.values_alignment.value) / 100,
      user_id: userId
    };

    try {
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.status === 'success') {
        setResult(data.data);
        fetchHistory();
      } else {
        setError(data.message || '预测失败');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('预测失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const shareResult = async () => {
    if (result) {
      const shareText = `我的AI恋爱预测结果：匹配度${result.score}%，等级：${result.level}`;
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'AI恋爱预测结果',
            text: shareText,
            url: window.location.href
          });
        } else {
          await navigator.clipboard.writeText(shareText);
          alert('结果已复制到剪贴板');
        }
      } catch (error) {
        console.error('分享失败:', error);
        alert('分享失败，请手动复制');
      }
    }
  };

  // 雷达图数据
  const getChartData = (formData) => {
    // 默认数据
    const defaultData = {
      age_difference: 0,
      common_interests: 0,
      communication: 0,
      values_alignment: 0
    };

    // 使用传入的数据或默认数据
    const data = formData || defaultData;

    return {
      labels: ['年龄匹配', '共同兴趣', '沟通质量', '价值观契合'],
      datasets: [{
        label: '匹配度分析',
        data: [
          data.age_difference * 100,
          data.common_interests * 100,
          data.communication * 100,
          data.values_alignment * 100
        ],
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
      }]
    };
  };

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <div className="theme-toggle">
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '🌞' : '🌙'}
        </button>
      </div>

      <div className="container">
        <h1 className="title">AI 恋爱预测</h1>
        
        {showGuide && (
          <div className="guide-card">
            <h3>使用指南</h3>
            <p>1. 填写各项指标（0-100）</p>
            <p>2. 点击"开始预测"获取分析</p>
            <p>3. 查看详细匹配报告</p>
            <p>4. 可以保存和分享结果</p>
            <button onClick={() => setShowGuide(false)}>了解了</button>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="prediction-form">
            <div className="form-group">
              <label>年龄匹配度 (0-100):</label>
              <input 
                type="number" 
                name="age_difference" 
                min="0" 
                max="100" 
                required 
                className="input-field"
              />
              <div className="input-hint">评估双方年龄差异的适合程度</div>
            </div>
            
            <div className="form-group">
              <label>共同兴趣 (0-100):</label>
              <input 
                type="number" 
                name="common_interests" 
                min="0" 
                max="100" 
                required 
                className="input-field"
              />
              <div className="input-hint">共同爱好和兴趣的重合度</div>
            </div>
            
            <div className="form-group">
              <label>沟通质量 (0-100):</label>
              <input 
                type="number" 
                name="communication" 
                min="0" 
                max="100" 
                required 
                className="input-field"
              />
              <div className="input-hint">日常交流的顺畅程度和深度</div>
            </div>
            
            <div className="form-group">
              <label>价值观契合度 (0-100):</label>
              <input 
                type="number" 
                name="values_alignment" 
                min="0" 
                max="100" 
                required 
                className="input-field"
              />
              <div className="input-hint">三观和未来规划的一致程度</div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className={`submit-button ${loading ? 'loading' : ''}`}
            >
              {loading ? '分析中...' : '开始预测'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          {result && (
            <div className="result animate-fade-in">
              <h2>预测结果</h2>
              <div className="score-display">
                <div className={`score-circle ${result.level.toLowerCase()}`}>
                  <span className="score-number">{result.score}%</span>
                  <span className="score-label">匹配度</span>
                </div>
                <div className={`level-badge ${result.level.toLowerCase()}`}>
                  {result.level}
                </div>
              </div>

              <div className="chart-container">
                <Radar 
                  data={getChartData(result)} 
                  options={{
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          stepSize: 20
                        }
                      }
                    }
                  }}
                />
              </div>
              
              <div className="details">
                <h3>详细分析</h3>
                {result.details && (
                  <div className="analysis-grid">
                    <div className="analysis-item">
                      <span className="analysis-label">年龄匹配</span>
                      <p>{result.details.age_compatibility}</p>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">共同兴趣</span>
                      <p>{result.details.interests}</p>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">沟通质量</span>
                      <p>{result.details.communication_quality}</p>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">价值观</span>
                      <p>{result.details.values}</p>
                    </div>
                  </div>
                )}

                <div className="recommendations">
                  <h3>改进建议</h3>
                  <ul>
                    {result.score < 75 && result.inputs && (
                      <>
                        {result.inputs.communication < 0.6 && (
                          <li>建议增加深入交流的机会，提升沟通质量</li>
                        )}
                        {result.inputs.common_interests < 0.7 && (
                          <li>可以尝试发展更多共同兴趣爱好</li>
                        )}
                        {result.inputs.values_alignment < 0.7 && (
                          <li>需要更多讨论未来规划和价值观</li>
                        )}
                      </>
                    )}
                    {result.score >= 75 && (
                      <li>继续保持良好的互动关系</li>
                    )}
                  </ul>
                </div>

                <button onClick={shareResult} className="share-button">
                  分享结果
                </button>
              </div>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="history-section animate-fade-in">
            <h3>历史记录</h3>
            <div className="history-list">
              {history.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-date">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                  <div className="history-score">
                    匹配度：{item.result.score}%
                  </div>
                  <div className={`history-level ${item.result.level.toLowerCase()}`}>
                    {item.result.level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;