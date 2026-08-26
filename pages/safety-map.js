// Safety Map — Canvas Force-Directed Drug Interaction Graph
let _state = null;

const RISK_COLORS = {
  danger:  { fill: '#FF3D5A', glow: '#FF3D5A80', light: '#FF6B7A', border: '#FF1744' },
  caution: { fill: '#FFD600', glow: '#FFD60080', light: '#FFE033', border: '#FFC400' },
  safe:    { fill: '#00C853', glow: '#00C85380', light: '#33D17A', border: '#00E676' }
};

const FORCE = {
  repulsion: 5000,
  attraction: 0.008,
  centering: 0.004,
  damping: 0.92,
  minDist: 80,
  stepsPerFrame: 3
};

export function initSafetyMap(containerId, drugs, interactionResult) {
  destroySafetyMap();
  if (!drugs || drugs.length === 0) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear loading placeholder
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.cursor = 'grab';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  const { nodes, edges } = buildGraph(drugs, interactionResult, canvas);

  _state = {
    canvas,
    ctx,
    container,
    nodes,
    edges,
    raf: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    dragging: null,
    hovered: null,
    mouseX: 0,
    mouseY: 0,
    tooltip: null,
    resizeObserver: new ResizeObserver(() => resize())
  };

  _state.resizeObserver.observe(container);
  setupInteraction(canvas);
  simulate();
}

export function destroySafetyMap() {
  if (!_state) return;
  if (_state.raf) cancelAnimationFrame(_state.raf);
  if (_state.resizeObserver) _state.resizeObserver.disconnect();
  if (_state.canvas) {
    _state.canvas.removeEventListener('mousedown', _state._onMouseDown);
    _state.canvas.removeEventListener('mousemove', _state._onMouseMove);
    _state.canvas.removeEventListener('mouseup', _state._onMouseUp);
    _state.canvas.removeEventListener('mouseleave', _state._onMouseLeave);
    _state.canvas.removeEventListener('wheel', _state._onWheel);
    _state.canvas.removeEventListener('touchstart', _state._onTouchStart);
    _state.canvas.removeEventListener('touchmove', _state._onTouchMove);
    _state.canvas.removeEventListener('touchend', _state._onTouchEnd);
  }
  _state = null;
}

function buildGraph(drugs, interactionResult, canvas) {
  const rect = canvas.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const radius = Math.min(cx, cy) * 0.55;

  const nodes = drugs.map((d, i) => {
    const angle = (2 * Math.PI * i) / drugs.length - Math.PI / 2;
    return {
      id: d.id,
      label: d.id,
      dose: d.dose,
      risk: d.risk,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
      r: 28
    };
  });

  const edges = [];
  if (interactionResult?.pairs && nodes.length >= 2) {
    for (const pair of interactionResult.pairs) {
      const source = nodes.find(n => n.id === pair.drugA);
      const target = nodes.find(n => n.id === pair.drugB);
      if (source && target) {
        const color = pair.severity === 'High' ? '#FF3D5A'
          : pair.severity === 'Moderate' ? '#FFD600' : '#00C853';
        edges.push({
          source,
          target,
          color,
          cascade: !!pair.cascade,
          severity: pair.severity || 'Low',
          message: pair.message || ''
        });
      }
    }
  }

  return { nodes, edges };
}

function simulate() {
  if (!_state) return;
  const { nodes, edges } = _state;

  for (let s = 0; s < FORCE.stepsPerFrame; s++) {
    // Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < FORCE.minDist) dist = FORCE.minDist;
        const f = FORCE.repulsion / (dist * dist);
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const dx = edge.target.x - edge.source.x;
      const dy = edge.target.y - edge.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = FORCE.attraction * (dist - 120);
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      edge.source.vx += fx; edge.source.vy += fy;
      edge.target.vx -= fx; edge.target.vy -= fy;
    }

    // Centering force
    const cw = _state.canvas.getBoundingClientRect().width / 2;
    const ch = _state.canvas.getBoundingClientRect().height / 2;
    for (const node of nodes) {
      node.vx += (cw - node.x) * FORCE.centering;
      node.vy += (ch - node.y) * FORCE.centering;
    }

    // Update positions + damping
    for (const node of nodes) {
      if (node === _state.dragging) continue;
      node.vx *= FORCE.damping;
      node.vy *= FORCE.damping;
      node.x += node.vx;
      node.y += node.vy;
    }
  }

  drawFrame();
  _state.raf = requestAnimationFrame(simulate);
}

function drawFrame() {
  if (!_state) return;
  const { ctx, canvas, nodes, edges, zoom, panX, panY, hovered, dragging } = _state;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width, h = rect.height;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  // Draw edges
  for (const edge of edges) {
    drawEdge(ctx, edge);
  }

  // Draw "no interactions" label if no edges
  if (edges.length === 0 && nodes.length > 0) {
    ctx.fillStyle = '#8B949E';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No interactions detected', w / (2 * zoom) - panX / zoom, h / (2 * zoom) - panY / zoom + 60);
  }

  // Draw nodes
  for (const node of nodes) {
    const isHovered = node === hovered;
    const isDragging = node === dragging;
    drawNode(ctx, node, isHovered || isDragging);
  }

  ctx.restore();

  // Draw tooltip (outside transform)
  if (hovered) {
    drawTooltip(ctx, hovered, w, h);
  }
}

function drawEdge(ctx, edge) {
  const sx = edge.source.x, sy = edge.source.y;
  const tx = edge.target.x, ty = edge.target.y;

  // Quadratic curve control point (perpendicular offset)
  const mx = (sx + tx) / 2, my = (sy + ty) / 2;
  const dx = tx - sx, dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = Math.min(len * 0.15, 30);
  const cpx = mx + (-dy / len) * offset;
  const cpy = my + (dx / len) * offset;

  ctx.save();
  ctx.strokeStyle = edge.color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = edge.color;
  ctx.shadowBlur = 10;

  if (edge.cascade) {
    ctx.setLineDash([8, 6]);
  }

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(cpx, cpy, tx, ty);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrowhead for cascade
  if (edge.cascade) {
    const t = 0.92;
    const ax = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cpx + t * t * tx;
    const ay = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cpy + t * t * ty;
    const adx = tx - ax, ady = ty - ay;
    const aLen = Math.sqrt(adx * adx + ady * ady) || 1;
    const arrowSize = 10;
    const angle = Math.atan2(ady, adx);

    ctx.shadowBlur = 0;
    ctx.fillStyle = edge.color;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - arrowSize * Math.cos(angle - 0.4), ty - arrowSize * Math.sin(angle - 0.4));
    ctx.lineTo(tx - arrowSize * Math.cos(angle + 0.4), ty - arrowSize * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  // Severity label on edge
  if (edge.severity && edge.severity !== 'None') {
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0D1117';
    ctx.font = '700 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelX = cpx * 0.5 + mx * 0.5;
    const labelY = cpy * 0.5 + my * 0.5;
    // Background pill
    const tw = ctx.measureText(edge.severity.toUpperCase()).width + 12;
    ctx.fillStyle = edge.color + '30';
    ctx.beginPath();
    ctx.roundRect(labelX - tw / 2, labelY - 8, tw, 16, 8);
    ctx.fill();
    ctx.fillStyle = edge.color;
    ctx.fillText(edge.severity.toUpperCase(), labelX, labelY);
  }

  ctx.restore();
}

function drawNode(ctx, node, highlighted) {
  const colors = RISK_COLORS[node.risk] || RISK_COLORS.safe;
  const r = highlighted ? node.r * 1.12 : node.r;

  ctx.save();

  // Outer glow
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = highlighted ? 20 : 12;

  // Node circle
  const grad = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
  grad.addColorStop(0, colors.light);
  grad.addColorStop(1, colors.fill);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
  ctx.fill();

  // Border ring
  ctx.shadowBlur = 0;
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = node.label.length > 10 ? node.label.slice(0, 9) + '…' : node.label;
  ctx.fillText(label, node.x, node.y);

  ctx.restore();
}

function drawTooltip(ctx, node, canvasW, canvasH) {
  const colors = RISK_COLORS[node.risk] || RISK_COLORS.safe;
  const lines = [
    node.label,
    node.dose || '',
    node.risk === 'danger' ? 'HIGH RISK' : node.risk === 'caution' ? 'CAUTION' : 'SAFE'
  ].filter(Boolean);

  // Add interaction messages for connected edges
  if (_state) {
    for (const edge of _state.edges) {
      if (edge.source === node || edge.target === node) {
        const other = edge.source === node ? edge.target : edge.source;
        const prefix = edge.cascade ? '⚠ CASCADE' : edge.severity.toUpperCase();
        lines.push(`${prefix}: ${other.label}`);
        if (edge.message) {
          // Truncate long messages
          const msg = edge.message.length > 60 ? edge.message.slice(0, 57) + '…' : edge.message;
          lines.push(`  ${msg}`);
        }
      }
    }
  }

  ctx.save();
  ctx.font = '600 12px Inter, sans-serif';
  const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width), 100);
  const pw = maxWidth + 24;
  const lineHeight = 18;
  const ph = lines.length * lineHeight + 16;
  let tx = node.x - pw / 2;
  let ty = node.y - node.r - ph - 10;

  // Keep tooltip in bounds
  if (tx < 4) tx = 4;
  if (tx + pw > canvasW - 4) tx = canvasW - pw - 4;
  if (ty < 4) ty = node.y + node.r + 10;

  // Background
  ctx.fillStyle = '#1C2128';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(tx, ty, pw, ph, 8);
  ctx.fill();

  // Border
  ctx.shadowBlur = 0;
  ctx.strokeStyle = colors.fill + '60';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    const isInteraction = line.startsWith('HIGH:') || line.startsWith('MODERATE:') || line.startsWith('LOW:') || line.startsWith('⚠ CASCADE');
    const isMessage = !isInteraction && i > 0 && line.startsWith('  ');
    if (i === 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 12px Inter, sans-serif';
    } else if (i === 2 || (i === 1 && lines[0] === node.label)) {
      ctx.fillStyle = colors.fill;
      ctx.font = '600 11px Inter, sans-serif';
    } else if (isInteraction) {
      ctx.fillStyle = '#FFA726';
      ctx.font = '700 10px Inter, sans-serif';
    } else if (isMessage) {
      ctx.fillStyle = '#B0BEC5';
      ctx.font = '400 10px Inter, sans-serif';
    } else {
      ctx.fillStyle = '#8B949E';
      ctx.font = '500 11px Inter, sans-serif';
    }
    ctx.fillText(line, tx + 12, ty + 8 + i * 18);
  });

  ctx.restore();
}

function setupInteraction(canvas) {
  let lastTouchDist = 0;

  function getNodeAt(mx, my) {
    if (!_state) return null;
    const { nodes, zoom, panX, panY } = _state;
    // Convert screen coords to graph coords
    const gx = (mx - panX) / zoom;
    const gy = (my - panY) / zoom;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = gx - n.x, dy = gy - n.y;
      if (dx * dx + dy * dy <= n.r * n.r * 1.2) return n;
    }
    return null;
  }

  function getCanvasXY(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _state._onMouseDown = (e) => {
    const { x, y } = getCanvasXY(e);
    const node = getNodeAt(x, y);
    if (node) {
      _state.dragging = node;
      canvas.style.cursor = 'grabbing';
    }
  };

  _state._onMouseMove = (e) => {
    const { x, y } = getCanvasXY(e);
    _state.mouseX = x;
    _state.mouseY = y;

    if (_state.dragging) {
      const gx = (x - _state.panX) / _state.zoom;
      const gy = (y - _state.panY) / _state.zoom;
      _state.dragging.x = gx;
      _state.dragging.y = gy;
      _state.dragging.vx = 0;
      _state.dragging.vy = 0;
    } else {
      const node = getNodeAt(x, y);
      _state.hovered = node;
      canvas.style.cursor = node ? 'grab' : 'grab';
    }
  };

  _state._onMouseUp = () => {
    _state.dragging = null;
    canvas.style.cursor = 'grab';
  };

  _state._onMouseLeave = () => {
    _state.hovered = null;
    _state.dragging = null;
    canvas.style.cursor = 'grab';
  };

  _state._onWheel = (e) => {
    e.preventDefault();
    const { x, y } = getCanvasXY(e);
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.max(0.3, Math.min(3, _state.zoom * delta));

    // Zoom toward cursor position
    _state.panX = x - (x - _state.panX) * (newZoom / _state.zoom);
    _state.panY = y - (y - _state.panY) * (newZoom / _state.zoom);
    _state.zoom = newZoom;
  };

  _state._onTouchStart = (e) => {
    if (e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const node = getNodeAt(x, y);
      if (node) {
        _state.dragging = node;
        e.preventDefault();
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      e.preventDefault();
    }
  };

  _state._onTouchMove = (e) => {
    if (e.touches.length === 1 && _state.dragging) {
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const gx = (x - _state.panX) / _state.zoom;
      const gy = (y - _state.panY) / _state.zoom;
      _state.dragging.x = gx;
      _state.dragging.y = gy;
      _state.dragging.vx = 0;
      _state.dragging.vy = 0;
      e.preventDefault();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastTouchDist > 0) {
        const scale = dist / lastTouchDist;
        const rect = canvas.getBoundingClientRect();
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        const newZoom = Math.max(0.3, Math.min(3, _state.zoom * scale));
        _state.panX = cx - (cx - _state.panX) * (newZoom / _state.zoom);
        _state.panY = cy - (cy - _state.panY) * (newZoom / _state.zoom);
        _state.zoom = newZoom;
      }
      lastTouchDist = dist;
      e.preventDefault();
    }
  };

  _state._onTouchEnd = () => {
    _state.dragging = null;
    lastTouchDist = 0;
  };

  canvas.addEventListener('mousedown', _state._onMouseDown);
  canvas.addEventListener('mousemove', _state._onMouseMove);
  canvas.addEventListener('mouseup', _state._onMouseUp);
  canvas.addEventListener('mouseleave', _state._onMouseLeave);
  canvas.addEventListener('wheel', _state._onWheel, { passive: false });
  canvas.addEventListener('touchstart', _state._onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', _state._onTouchMove, { passive: false });
  canvas.addEventListener('touchend', _state._onTouchEnd);
}
