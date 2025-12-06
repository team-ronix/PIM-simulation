import React, { useState, useEffect, useRef } from 'react';
import { GitMerge, Activity, Info, Server, Monitor } from 'lucide-react';
import './App.css';

const App = () => {
  const [protocol, setProtocol] = useState('PIM-SM');
  const [isAnimating, setIsAnimating] = useState(false);
  const [dmPrunedLinks, setDmPrunedLinks] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [receivers, setReceivers] = useState([
    { id: 1, name: 'Rec 1', group: 'Dist 1', smMode: 'idle', dmInterested: true, x: 350, y: 550, parentId: 1 },
    { id: 2, name: 'Rec 2', group: 'Dist 1', smMode: 'idle', dmInterested: true, x: 450, y: 550, parentId: 1 },
    { id: 3, name: 'Rec 3', group: 'Dist 2', smMode: 'idle', dmInterested: true, x: 550, y: 550, parentId: 2 },
    { id: 4, name: 'Rec 4', group: 'Dist 2', smMode: 'idle', dmInterested: true, x: 650, y: 550, parentId: 2 },
    { id: 5, name: 'Rec 5', group: 'Dist 3', smMode: 'idle', dmInterested: true, x: 750, y: 550, parentId: 3 },
    { id: 6, name: 'Rec 6', group: 'Dist 3', smMode: 'idle', dmInterested: true, x: 850, y: 550, parentId: 3 }
  ]);

  const packetsLayerRef = useRef(null);

  const sourceCoords = { x: 200, y: 80 };
  const rpCoords = { x: 600, y: 80 };
  const distRouters = [
    { id: 1, name: 'Dist 1', x: 400, y: 300 },
    { id: 2, name: 'Dist 2', x: 600, y: 300 },
    { id: 3, name: 'Dist 3', x: 800, y: 300 }
  ];

  useEffect(() => {
    addLog("System initialized. Select a protocol to start.");
  }, []);

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [{ msg, type, time, id: Date.now() + Math.random() }, ...prev]);
  };

  const switchProtocol = (mode) => {
    if (isAnimating) return;
    setProtocol(mode);
    setReceivers(prev => prev.map(r => ({ ...r, smMode: 'idle', dmInterested: true })));
    setDmPrunedLinks(new Set());
    addLog(`Switched Protocol to ${mode}. Resetting Topology.`);
    if (mode === 'PIM-DM') {
      addLog("PIM-DM: Initial Flood (Assumption: All links active)", 'graft');
    }
  };

  const updateDmPruning = (currentReceivers) => {
    const newPrunedLinks = new Set();
    
    currentReceivers.forEach(rec => {
      if (!rec.dmInterested) newPrunedLinks.add(`link-dist-rec-${rec.id}`);
    });

    distRouters.forEach(dist => {
      const kids = currentReceivers.filter(r => r.parentId === dist.id);
      const hasInterest = kids.some(k => k.dmInterested);
      if (!hasInterest) {
        newPrunedLinks.add(`link-core-dist${dist.id}`);
      }
    });

    return newPrunedLinks;
  };

  const spawnPacket = (x1, y1, x2, y2, color, label, dur) => {
    return new Promise(resolve => {
      const svg = packetsLayerRef.current;
      if (!svg) {
        resolve();
        return;
      }

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('r', '10');
      glow.setAttribute('fill', color);
      glow.setAttribute('opacity', '0.3');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.textContent = label;
      text.setAttribute('y', '-15');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('class', 'pkt-label');

      const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      anim.setAttribute('path', `M ${x1} ${y1} L ${x2} ${y2}`);
      anim.setAttribute('dur', `${dur}ms`);
      anim.setAttribute('repeatCount', '1');
      anim.setAttribute('fill', 'freeze');
      anim.setAttribute('calcMode', 'spline');
      anim.setAttribute('keySplines', '0.4 0 0.2 1');
      anim.setAttribute('keyTimes', '0;1');
      
      anim.onend = () => { if (svg.contains(g)) svg.removeChild(g); resolve(); };
      setTimeout(() => { if (svg.contains(g)) { svg.removeChild(g); resolve(); } }, dur + 100);

      g.appendChild(anim);
      g.appendChild(glow);
      g.appendChild(circle);
      g.appendChild(text);
      svg.appendChild(g);
    });
  };

  const handleReceiverClick = async (index) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const rec = receivers[index];
    const parent = distRouters.find(d => d.id === rec.parentId);
    
    if (protocol === 'PIM-SM') {
      if (rec.smMode === 'idle') {
        addLog(`[STEP 1] ${rec.name} sends (*,G) Join`, 'join');
        await spawnPacket(rec.x, rec.y, parent.x, parent.y, '#3b82f6', '(*,G) Join', 800);
        
        addLog(`[STEP 2] ${parent.name} forwards to RP`, 'join');
        await spawnPacket(parent.x, parent.y, rpCoords.x, rpCoords.y, '#3b82f6', '(*,G) Join', 800);
        
        setReceivers(prev => prev.map((r, i) => i === index ? { ...r, smMode: 'shared' } : r));
        addLog('RPT Built. Traffic flowing via RP.', 'join');
      } 
      else if (rec.smMode === 'shared') {
        addLog(`[STEP 1] Bandwidth Threshold Exceeded. Switching to SPT.`, 'spt');
        addLog(`${parent.name} sends (S,G) Join to Source`, 'spt');
        
        await spawnPacket(parent.x, parent.y, sourceCoords.x, sourceCoords.y, '#10b981', '(S,G) Join', 1000);
        
        setReceivers(prev => prev.map((r, i) => i === index ? { ...r, smMode: 'spt' } : r));
        addLog('SPT Established. Traffic bypassing RP.', 'spt');
      } 
      else {
        addLog(`${rec.name} leaving group. Sending Prune.`, 'prune');
        await spawnPacket(rec.x, rec.y, parent.x, parent.y, '#ef4444', 'Prune', 800);
        setReceivers(prev => prev.map((r, i) => i === index ? { ...r, smMode: 'idle' } : r));
      }
    } 
    else {
      if (rec.dmInterested) {
        addLog(`${rec.name} is leaving. Sending PRUNE upstream.`, 'prune');
        await spawnPacket(rec.x, rec.y, parent.x, parent.y, '#ef4444', 'Prune', 800);
        
        const newReceivers = receivers.map((r, i) => i === index ? { ...r, dmInterested: false } : r);
        const newPruned = updateDmPruning(newReceivers);
        setReceivers(newReceivers);
        setDmPrunedLinks(newPruned);
        
        const linkId = `link-core-dist${parent.id}`;
        if (newPruned.has(linkId)) {
          addLog(`${parent.name} has no more listeners. Pruning from Core.`, 'prune');
          await spawnPacket(parent.x, parent.y, rpCoords.x, rpCoords.y, '#ef4444', 'Prune', 800);
        }
      } else {
        addLog(`${rec.name} wants traffic. Sending GRAFT upstream.`, 'graft');
        await spawnPacket(rec.x, rec.y, parent.x, parent.y, '#eab308', 'Graft', 800);
        
        const wasParentPruned = dmPrunedLinks.has(`link-core-dist${parent.id}`);
        const newReceivers = receivers.map((r, i) => i === index ? { ...r, dmInterested: true } : r);
        const newPruned = updateDmPruning(newReceivers);
        setReceivers(newReceivers);
        setDmPrunedLinks(newPruned);

        if (wasParentPruned) {
          addLog(`${parent.name} re-joining tree. Sending GRAFT to Core.`, 'graft');
          await spawnPacket(parent.x, parent.y, rpCoords.x, rpCoords.y, '#eab308', 'Graft', 800);
        }
      }
    }

    setIsAnimating(false);
  };

  const isLinkActive = (linkId) => {
    if (protocol === 'PIM-DM') return !dmPrunedLinks.has(linkId);
    
    if (linkId.startsWith('link-core-dist')) {
      const distId = parseInt(linkId.replace('link-core-dist', ''));
      const kids = receivers.filter(r => r.parentId === distId);
      return kids.some(r => r.smMode !== 'idle');
    }
    if (linkId.startsWith('link-dist-rec-')) {
      const recId = parseInt(linkId.replace('link-dist-rec-', ''));
      const rec = receivers.find(r => r.id === recId);
      return rec.smMode !== 'idle';
    }
    return true;
  };

  const getLinkColor = (linkId, isSpt = false) => {
    if (protocol === 'PIM-DM') return isLinkActive(linkId) ? '#eab308' : '#7f1d1d';
    if (isSpt) return '#10b981';
    return isLinkActive(linkId) ? '#3b82f6' : '#334155';
  };

  const renderLink = (p1, p2, id, color, width, active, dashed, isPruned) => {
    const strokeColor = isPruned ? '#ef4444' : color;
    const opacity = isPruned ? '0.4' : (!active && !isPruned ? '0.15' : '1');

    return (
      <g key={id}>
        <line
          x1={p1.x} y1={p1.y}
          x2={p2.x} y2={p2.y}
          stroke={strokeColor}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={dashed || isPruned ? '6,6' : undefined}
          opacity={opacity}
        />
        {active && !isPruned && !dashed && (
          <circle r="3" fill="white">
            <animateMotion
              path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </g>
    );
  };

  const renderNode = (x, y, label, IconComponent, colorName) => {
    const colors = { 'indigo': '#6366f1', 'purple': '#a855f7', 'orange': '#f97316', 'slate': '#64748b' };
    const c = colors[colorName];

    return (
      <div className="node" style={{ left: `${x}px`, top: `${y}px`, pointerEvents: 'none' }}>
        <div className="node-icon" style={{ borderColor: c, boxShadow: `0 0 10px ${c}40` }}>
          <IconComponent size={20} color={c} />
        </div>
        <span className="node-label" style={{ color: c }}>{label}</span>
      </div>
    );
  };

  const renderLinks = () => {
    const links = [];
    
    links.push(renderLink(sourceCoords, rpCoords, 'backbone', '#64748b', 2, true, true, false));

    distRouters.forEach(dist => {
      const linkId = `link-core-dist${dist.id}`;
      const active = isLinkActive(linkId);
      const color = getLinkColor(linkId);
      const isPruned = protocol === 'PIM-DM' && dmPrunedLinks.has(linkId);
      
      links.push(renderLink(rpCoords, { x: dist.x, y: dist.y }, linkId, color, 3, active, false, isPruned));
    });

    receivers.forEach(rec => {
      const parent = distRouters.find(d => d.id === rec.parentId);
      const linkId = `link-dist-rec-${rec.id}`;
      const isSpt = rec.smMode === 'spt';
      const active = isLinkActive(linkId);
      const color = getLinkColor(linkId, isSpt);
      const isPruned = protocol === 'PIM-DM' && dmPrunedLinks.has(linkId);

      const treeStart = { x: parent.x, y: parent.y };
      const recPos = { x: rec.x, y: rec.y };
      
      if (isSpt && protocol === 'PIM-SM') {
        links.push(renderLink(sourceCoords, treeStart, linkId + '-spt-1', '#10b981', 4, true, false, false));
        links.push(renderLink(treeStart, recPos, linkId + '-spt-2', '#10b981', 4, true, false, false));
      } else {
        links.push(renderLink(treeStart, recPos, linkId, color, 2, active, false, isPruned));
      }
    });

    return links;
  };

  return (
    <div className="app">
      <header>
        <div className="title-group">
          <div className="icon-box">
            <GitMerge size={20} color="white" />
          </div>
          <div style={{ marginLeft: '12px' }}>
            <h1>PIM Visualizer</h1>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
              SM & DM SIMULATION
            </span>
          </div>
        </div>

        <div className="controls">
          <div className="mode-switch">
            <button
              className={`proto-btn ${protocol === 'PIM-SM' ? 'active-sm' : ''}`}
              onClick={() => switchProtocol('PIM-SM')}
            >
              PIM-SM
            </button>
            <button
              className={`proto-btn ${protocol === 'PIM-DM' ? 'active-dm' : ''}`}
              onClick={() => switchProtocol('PIM-DM')}
            >
              PIM-DM
            </button>
          </div>
        </div>
      </header>

      <div className="main-grid">
        <div className="canvas-wrapper">
          <div className="bg-grid"></div>
          
          <svg id="network-svg">
            <g id="links-layer">{renderLinks()}</g>
            <g id="packets-layer" ref={packetsLayerRef}></g>
          </svg>

          <div id="nodes-layer">
            {renderNode(sourceCoords.x, sourceCoords.y, 'Source', Server, 'indigo')}
            {renderNode(rpCoords.x, rpCoords.y, protocol === 'PIM-SM' ? 'RP' : 'Core', Server, protocol === 'PIM-SM' ? 'purple' : 'orange')}
            {distRouters.map(d => renderNode(d.x, d.y, d.name, Server, 'slate'))}
            
            {receivers.map((rec, idx) => {
              const active = (protocol === 'PIM-SM' && rec.smMode !== 'idle') || (protocol === 'PIM-DM' && rec.dmInterested);
              let badgeText = rec.smMode;
              let badgeClass = '';
              
              if (protocol === 'PIM-SM') {
                if (rec.smMode === 'spt') badgeClass = 'spt';
                else if (rec.smMode === 'shared') badgeClass = 'flood';
                else badgeClass = 'idle';
              } else {
                badgeText = rec.dmInterested ? 'Flooding' : 'Pruned';
                badgeClass = rec.dmInterested ? 'flood' : 'pruned';
              }

              return (
                <div
                  key={rec.id}
                  className={`node ${active ? (protocol === 'PIM-SM' ? 'active-sm' : 'active-dm') : ''}`}
                  style={{ left: `${rec.x}px`, top: `${rec.y}px` }}
                  onClick={() => handleReceiverClick(idx)}
                >
                  <div className="node-icon">
                    <Monitor size={20} />
                  </div>
                  <span className="node-label">{rec.name}</span>
                  <span className={`badge ${badgeClass}`}>{badgeText}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span>Event Log</span>
            <Activity size={16} className="text-muted" />
          </div>
          
          <div className="log-container">
            {logs.map(log => (
              <div key={log.id} className={`log-entry ${log.type}`}>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                  [{log.time}]
                </span>
                {log.msg}
              </div>
            ))}
          </div>

          <div className="instructions">
            <strong><Info size={12} /> Legend:</strong>
            <div className="legend-item">
              <div className="dot" style={{ background: 'var(--accent-blue)' }}></div>
              (*,G) Join (SM)
            </div>
            <div className="legend-item">
              <div className="dot" style={{ background: 'var(--accent-green)' }}></div>
              (S,G) Join (SPT)
            </div>
            <div className="legend-item">
              <div className="dot" style={{ background: 'var(--accent-yellow)' }}></div>
              Graft/Flood (DM)
            </div>
            <div className="legend-item">
              <div className="dot" style={{ background: 'var(--accent-red)' }}></div>
              Prune Message
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;