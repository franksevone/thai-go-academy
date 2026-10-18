/**
 * GoBoardUI - ระบบแสดงผลกระดานหมากล้อมแบบ Interactive บน HTML5 Canvas (High-DPI)
 * พร้อมระบบเสียงวางหมาก (Web Audio Synthesizer), แสดงลมหายใจของกลุ่มหมาก,
 * เตือนหมากติดอาตาริ, แสดงพื้นที่คาดการณ์ และมาร์กเกอร์ประกอบการสอน
 */

(function (global) {
  'use strict';

  class SoundEffects {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    initContext() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playStoneClack() {
      if (!this.enabled) return;
      try {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const ctx = this.ctx;

        // 1. High-frequency click / snap of slate/shell stone hitting hard wood (0-15ms)
        // สร้างเสียงกระทบที่คมกริบ (High-transient stone impact snap)
        const snapLen = Math.floor(ctx.sampleRate * 0.016);
        const snapBuffer = ctx.createBuffer(1, snapLen, ctx.sampleRate);
        const snapData = snapBuffer.getChannelData(0);
        for (let i = 0; i < snapLen; i++) {
          const decay = Math.exp(-i / (ctx.sampleRate * 0.0035));
          snapData[i] = (Math.random() * 2 - 1) * decay;
        }
        const snapSource = ctx.createBufferSource();
        snapSource.buffer = snapBuffer;

        const snapFilter = ctx.createBiquadFilter();
        snapFilter.type = 'bandpass';
        snapFilter.frequency.setValueAtTime(3600 + (Math.random() * 400 - 200), now);
        snapFilter.Q.setValueAtTime(3.2, now);

        const snapGain = ctx.createGain();
        snapGain.gain.setValueAtTime(0.42, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

        snapSource.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(ctx.destination);
        snapSource.start(now);

        // 2. Mid Wood Knock (หน้ากระดานไม้ Kaya กระทบ 0-45ms)
        const knockOsc = ctx.createOscillator();
        const knockGain = ctx.createGain();
        const knockFilter = ctx.createBiquadFilter();

        knockOsc.type = 'triangle';
        const startFreq = 860 + (Math.random() * 80 - 40);
        knockOsc.frequency.setValueAtTime(startFreq, now);
        knockOsc.frequency.exponentialRampToValueAtTime(260, now + 0.038);

        knockFilter.type = 'lowpass';
        knockFilter.frequency.setValueAtTime(1400, now);

        knockGain.gain.setValueAtTime(0.38, now);
        knockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        knockOsc.connect(knockFilter);
        knockFilter.connect(knockGain);
        knockGain.connect(ctx.destination);

        knockOsc.start(now);
        knockOsc.stop(now + 0.05);

        // 3. Deep Body Resonance (ความกังวานทึบแน่นของเนื้อไม้โกะหนา 0-160ms)
        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        const bodyFilter = ctx.createBiquadFilter();

        bodyOsc.type = 'sine';
        const bodyFreq = 185 + (Math.random() * 20 - 10);
        bodyOsc.frequency.setValueAtTime(bodyFreq, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(95, now + 0.12);

        bodyFilter.type = 'lowpass';
        bodyFilter.frequency.setValueAtTime(450, now);

        bodyGain.gain.setValueAtTime(0.48, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        bodyOsc.connect(bodyFilter);
        bodyFilter.connect(bodyGain);
        bodyGain.connect(ctx.destination);

        bodyOsc.start(now);
        bodyOsc.stop(now + 0.16);

        // 4. Low Sub-thud (ความแน่นหนาของกระดานตัวใหญ่)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(95, now);
        subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

        subGain.gain.setValueAtTime(0.25, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.1);

      } catch (e) {
        // Ignore audio errors
      }
    }

    playCapture() {
      if (!this.enabled) return;
      try {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [520, 760].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.22, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.13);
        });
      } catch (e) {}
    }

    playSuccess() {
      if (!this.enabled) return;
      try {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.18, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.24);
        });
      } catch (e) {}
    }

    playError() {
      if (!this.enabled) return;
      try {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.18);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.21);
      } catch (e) {}
    }
  }

  class GoBoardUI {
    constructor(canvas, engine, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.engine = engine;
      this.sound = new SoundEffects();

      this.showCoordinates = options.showCoordinates !== false;
      this.showLiberties = options.showLiberties !== false;
      this.showAtariWarning = options.showAtariWarning !== false;
      this.showTerritory = options.showTerritory || false;
      this.showMoveNumbers = options.showMoveNumbers || false;
      this.interactive = options.interactive !== false;
      this.scoringMode = false;

      this.hoverCoord = null;    // { x, y }
      this.inspectedGroup = null; // กลุ่มหมากที่เมาส์ชี้อยู่ เพื่อแสดงลมหายใจชัดเจน
      this.markers = [];         // [{ x, y, type, text, color, subtext }]
      this.arrows = [];          // [{ from: {x,y}, to: {x,y}, color }]
      this.highlightLiberties = []; // [{ x, y }]

      this.onIntersectionClick = options.onIntersectionClick || null;
      this.onHoverChange = options.onHoverChange || null;

      this.logicalSize = 620;
      this.padding = 42;
      this.cellSize = 1;

      this.bindEvents();
      this.resize();
    }

    bindEvents() {
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mouseleave', () => {
        this.hoverCoord = null;
        this.inspectedGroup = null;
        if (this.onHoverChange) this.onHoverChange(null, null);
        this.render();
      });
      this.canvas.addEventListener('click', (e) => this.handleClick(e));

      // รองรับการแตะสัมผัสบนหน้าจอมือถือ (Mobile Touch Support)
      this.canvas.addEventListener('touchstart', (e) => {
        if (!this.interactive) return;
        if (e.touches && e.touches.length === 1) {
          const touch = e.touches[0];
          const { px, py } = this.getEventPixel(touch);
          const coord = this.pixelToBoard(px, py);
          if (coord) {
            e.preventDefault(); // ป้องกันการเลื่อนหน้าจอหรือซูมจอโดยไม่ตั้งใจ
            if (this.onIntersectionClick) {
              this.onIntersectionClick(coord.x, coord.y);
            }
          }
        }
      }, { passive: false });

      this.canvas.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length === 1) {
          const touch = e.touches[0];
          const { px, py } = this.getEventPixel(touch);
          const coord = this.pixelToBoard(px, py);
          if (coord) {
            e.preventDefault();
            this.handleMouseMove(touch);
          }
        }
      }, { passive: false });

      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
    }

    resize() {
      const parent = this.canvas.parentElement;
      const isZen = document.body && document.body.classList.contains('zen-board-mode');
      const isMobile = window.innerWidth <= 768;

      let maxDim;
      if (isZen || isMobile) {
        // ในโหมดมือถือหรือโหมดขยายเต็มกระดาน (Zen Mode):
        // คำนวณความกว้างและความสูงของ viewport โดยหักลบแถบสถานะ เพื่อให้เห็นกระดานครบทั้งแผ่นโดยไม่ต้องเลื่อนจอ
        const availWidth = window.innerWidth - (isMobile ? 8 : 20);
        const availHeight = window.innerHeight - (isZen ? 115 : isMobile ? 165 : 210);
        maxDim = Math.min(availWidth, availHeight, 740);
      } else {
        maxDim = parent ? Math.min(parent.clientWidth - 8, 660) : 600;
      }

      // รองรับหน้าจอมือถือที่มีขนาดหน้าจอแคบ (เช่น 320px - 390px)
      const dim = Math.max(260, Math.floor(maxDim));
      this.logicalSize = dim;

      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = dim * dpr;
      this.canvas.height = dim * dpr;
      this.canvas.style.width = `${dim}px`;
      this.canvas.style.height = `${dim}px`;

      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.updateMetrics();
      this.render();
    }

    updateMetrics() {
      const size = this.engine.size;
      const isMobile = window.innerWidth <= 768;

      // ปรับขนาด Padding ขอบกระดานให้เหมาะสมกับขนาด 9, 13, 19 เส้น โดยเฉพาะบนมือถือ
      if (size === 19) {
        this.padding = isMobile
          ? Math.max(16, Math.round(this.logicalSize * 0.046))
          : Math.max(26, Math.round(this.logicalSize * 0.062));
      } else if (size === 13) {
        this.padding = isMobile
          ? Math.max(20, Math.round(this.logicalSize * 0.054))
          : Math.max(28, Math.round(this.logicalSize * 0.068));
      } else {
        this.padding = this.showCoordinates
          ? Math.max(28, Math.round(this.logicalSize * 0.072))
          : Math.max(20, Math.round(this.logicalSize * 0.05));
      }

      const boardSpan = this.logicalSize - this.padding * 2;
      this.cellSize = boardSpan / (size - 1);
    }

    boardToPixel(x, y) {
      return {
        px: this.padding + x * this.cellSize,
        py: this.padding + y * this.cellSize
      };
    }

    pixelToBoard(px, py) {
      const x = Math.round((px - this.padding) / this.cellSize);
      const y = Math.round((py - this.padding) / this.cellSize);
      if (!this.engine.isOnBoard(x, y)) return null;

      const center = this.boardToPixel(x, y);
      const dist = Math.hypot(px - center.px, py - center.py);
      if (dist > this.cellSize * 0.48) return null;
      return { x, y };
    }

    getEventPixel(e) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        px: (e.clientX - rect.left) * (this.logicalSize / rect.width),
        py: (e.clientY - rect.top) * (this.logicalSize / rect.height)
      };
    }

    handleMouseMove(e) {
      const { px, py } = this.getEventPixel(e);
      const coord = this.pixelToBoard(px, py);

      const prevKey = this.hoverCoord ? `${this.hoverCoord.x},${this.hoverCoord.y}` : '';
      const nextKey = coord ? `${coord.x},${coord.y}` : '';

      if (prevKey !== nextKey) {
        this.hoverCoord = coord;
        if (coord && this.engine.grid[coord.y][coord.x] !== GoEngine.EMPTY) {
          this.inspectedGroup = this.engine.getGroup(coord.x, coord.y);
        } else {
          this.inspectedGroup = null;
        }
        if (this.onHoverChange) {
          this.onHoverChange(coord, this.inspectedGroup);
        }
        this.render();
      }
    }

    handleClick(e) {
      if (!this.interactive) return;
      const { px, py } = this.getEventPixel(e);
      const coord = this.pixelToBoard(px, py);
      if (!coord) return;

      if (this.onIntersectionClick) {
        this.onIntersectionClick(coord.x, coord.y);
      }
    }

    setMarkers(markers = [], arrows = []) {
      this.markers = markers;
      this.arrows = arrows;
      this.render();
    }

    clearMarkers() {
      this.markers = [];
      this.arrows = [];
      this.render();
    }

    render() {
      this.updateMetrics();
      const ctx = this.ctx;
      const dim = this.logicalSize;

      ctx.clearRect(0, 0, dim, dim);

      // 1. วาดพื้นผิวไม้กระดานหมากล้อม (Kaya Wood Grain)
      this.drawWoodBackground(ctx, dim);

      // 2. วาดเส้นตารางและจุดดาว (Grid & Star Points)
      this.drawGridAndStars(ctx);

      // 3. วาดตัวอักษรพิกัดขอบกระดาน (Coordinates)
      if (this.showCoordinates) {
        this.drawCoordinates(ctx);
      }

      // 4. วาดพื้นที่คาดการณ์ / พื้นที่นับแต้ม (Territory Overlay)
      if (this.showTerritory || this.scoringMode) {
        this.drawTerritoryOverlay(ctx);
      }

      // 5. วาดหมากทั้งหมดบนกระดาน
      this.drawStones(ctx);

      // 6. วาดตัวบ่งชี้ลมหายใจและการแจ้งเตือนอาตาริ
      if (this.showLiberties || this.showAtariWarning || this.inspectedGroup) {
        this.drawGroupLibertiesAndAtari(ctx);
      }

      // 7. วาดจุดโค (Ko Point)
      if (this.engine.koPoint) {
        this.drawKoMarker(ctx, this.engine.koPoint.x, this.engine.koPoint.y);
      }

      // 8. วาดลูกศรและมาร์กเกอร์ประกอบการสอน (A, B, C, จุดแนะนำ, คำใบ้)
      this.drawArrows(ctx);
      this.drawMarkers(ctx);

      // 9. วาดหมากเงา (Ghost Stone) เมื่อเลื่อนเมาส์
      if (this.interactive && !this.scoringMode && this.hoverCoord) {
        this.drawHoverPreview(ctx, this.hoverCoord.x, this.hoverCoord.y);
      }
    }

    drawWoodBackground(ctx, dim) {
      const grad = ctx.createLinearGradient(0, 0, dim, dim);
      grad.addColorStop(0, '#e6bb72');
      grad.addColorStop(0.5, '#dca959');
      grad.addColorStop(1, '#cf9846');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dim, dim);

      // ลายเสี้ยนไม้บางๆ
      ctx.save();
      ctx.strokeStyle = 'rgba(130, 82, 20, 0.065)';
      ctx.lineWidth = 1;
      for (let i = 6; i < dim; i += 9) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.bezierCurveTo(dim * 0.33, i + ((i % 18) - 9) * 0.4, dim * 0.66, i - ((i % 18) - 9) * 0.4, dim, i);
        ctx.stroke();
      }

      // ขอบเงาด้านใน
      ctx.strokeStyle = 'rgba(92, 54, 12, 0.35)';
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, dim - 3, dim - 3);
      ctx.restore();
    }

    drawGridAndStars(ctx) {
      const size = this.engine.size;
      ctx.save();
      ctx.strokeStyle = '#2d1e0f';
      ctx.lineWidth = size === 19 ? 1.1 : 1.35;

      const start = this.padding;
      const end = this.padding + (size - 1) * this.cellSize;

      for (let i = 0; i < size; i++) {
        const pos = this.padding + i * this.cellSize;

        // เส้นแนวนอน
        ctx.beginPath();
        ctx.moveTo(start, pos);
        ctx.lineTo(end, pos);
        ctx.stroke();

        // เส้นแนวตั้ง
        ctx.beginPath();
        ctx.moveTo(pos, start);
        ctx.lineTo(pos, end);
        ctx.stroke();
      }

      // กรอบนอกหนาขึ้นเล็กน้อย
      ctx.lineWidth = 2.0;
      ctx.strokeRect(start, start, end - start, end - start);

      // จุดดาว (Hoshi)
      const starPoints = this.engine.getStarPoints();
      const starRadius = Math.max(3, this.cellSize * 0.1);
      ctx.fillStyle = '#23170b';
      for (const pt of starPoints) {
        const { px, py } = this.boardToPixel(pt.x, pt.y);
        ctx.beginPath();
        ctx.arc(px, py, starRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawCoordinates(ctx) {
      const size = this.engine.size;
      ctx.save();
      ctx.fillStyle = '#4a3216';
      const fontSize = Math.max(10, Math.min(13, Math.round(this.padding * 0.34)));
      ctx.font = `600 ${fontSize}px "Prompt", "Noto Sans Thai", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const topY = this.padding * 0.42;
      const bottomY = this.logicalSize - this.padding * 0.42;
      const leftX = this.padding * 0.42;
      const rightX = this.logicalSize - this.padding * 0.42;

      for (let i = 0; i < size; i++) {
        const colLabel = GoEngine.COL_LABELS[i];
        const rowLabel = String(size - i);
        const pos = this.padding + i * this.cellSize;

        ctx.fillText(colLabel, pos, topY);
        ctx.fillText(colLabel, pos, bottomY);
        ctx.fillText(rowLabel, leftX, pos);
        ctx.fillText(rowLabel, rightX, pos);
      }
      ctx.restore();
    }

    drawStones(ctx) {
      const size = this.engine.size;
      const radius = this.cellSize * 0.465;

      // สร้างแผนที่ลำดับตาเดินถ้าเปิดโหมดแสดงตัวเลขตาเดิน
      const moveNumMap = new Map();
      if (this.showMoveNumbers) {
        for (const mv of this.engine.moveHistory) {
          if (!mv.pass && this.engine.isOnBoard(mv.x, mv.y)) {
            moveNumMap.set(`${mv.x},${mv.y}`, mv.moveNumber);
          }
        }
      }

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const color = this.engine.grid[y][x];
          if (color === GoEngine.EMPTY) continue;

          const isDead = this.engine.deadStones.has(`${x},${y}`);
          this.drawSingleStone(ctx, x, y, color, radius, isDead ? 0.38 : 1.0);

          if (isDead) {
            const { px, py } = this.boardToPixel(x, y);
            ctx.save();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.6;
            const r = radius * 0.55;
            ctx.beginPath();
            ctx.moveTo(px - r, py - r);
            ctx.lineTo(px + r, py + r);
            ctx.moveTo(px + r, py - r);
            ctx.lineTo(px - r, py + r);
            ctx.stroke();
            ctx.restore();
          } else if (this.showMoveNumbers && moveNumMap.has(`${x},${y}`)) {
            const { px, py } = this.boardToPixel(x, y);
            const num = moveNumMap.get(`${x},${y}`);
            ctx.save();
            ctx.fillStyle = color === GoEngine.BLACK ? '#f8fafc' : '#1e293b';
            ctx.font = `600 ${Math.max(9, Math.round(radius * 0.85))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(num), px, py);
            ctx.restore();
          }
        }
      }

      // วาดวงกลมแสดงหมากเม็ดล่าสุด (Last Move Marker)
      const last = this.engine.lastMove;
      if (last && !last.pass && this.engine.isOnBoard(last.x, last.y) && this.engine.grid[last.y][last.x] !== GoEngine.EMPTY) {
        const { px, py } = this.boardToPixel(last.x, last.y);
        ctx.save();
        ctx.strokeStyle = last.color === GoEngine.BLACK ? '#fbbf24' : '#dc2626';
        ctx.lineWidth = Math.max(2, radius * 0.16);
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawSingleStone(ctx, x, y, color, radius, alpha = 1.0) {
      const { px, py } = this.boardToPixel(x, y);
      ctx.save();
      ctx.globalAlpha = alpha;

      // เงาใต้เม็ดหมาก
      ctx.beginPath();
      ctx.arc(px + radius * 0.08, py + radius * 0.12, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fill();

      // ตัวเม็ดหมาก 3 มิติ
      const grad = ctx.createRadialGradient(
        px - radius * 0.32,
        py - radius * 0.32,
        radius * 0.08,
        px,
        py,
        radius
      );

      if (color === GoEngine.BLACK) {
        grad.addColorStop(0, '#525866');
        grad.addColorStop(0.35, '#22252a');
        grad.addColorStop(1, '#090a0f');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.7, '#f1f5f9');
        grad.addColorStop(1, '#cbd5e1');
      }

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      if (color === GoEngine.WHITE) {
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    }

    drawGroupLibertiesAndAtari(ctx) {
      const groups = this.engine.getAllGroups();
      const radius = this.cellSize * 0.465;

      for (const g of groups) {
        const isAtari = g.libertyCount === 1;
        const isLowLiberty = g.libertyCount === 2;

        // เตือนหมากติดอาตาริ (เหลือ 1 ลมหายใจ)
        if (this.showAtariWarning && isAtari) {
          ctx.save();
          for (const s of g.stones) {
            const { px, py } = this.boardToPixel(s.x, s.y);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.arc(px, py, radius * 0.86, 0, Math.PI * 2);
            ctx.stroke();
          }

          // ไฮไลต์จุดลมหายใจสุดท้ายของกลุ่มที่ติดอาตาริด้วยจุดสีแดงเตือนภัย
          const lastLib = g.liberties[0];
          if (lastLib) {
            const { px, py } = this.boardToPixel(lastLib.x, lastLib.y);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
            ctx.beginPath();
            ctx.arc(px, py, radius * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.restore();
        }

        // แสดงป้ายจำนวนลมหายใจของแต่ละกลุ่มหมากเมื่อเปิดโหมดแสดงลมหายใจ
        if (this.showLiberties && g.stones.length > 0) {
          const anchor = g.stones[0];
          const { px, py } = this.boardToPixel(anchor.x, anchor.y);
          ctx.save();
          const badgeR = Math.max(8, radius * 0.42);
          const bx = px + radius * 0.56;
          const by = py - radius * 0.56;

          ctx.beginPath();
          ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
          ctx.fillStyle = isAtari
            ? '#ef4444'
            : isLowLiberty
              ? '#f59e0b'
              : '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = `700 ${Math.max(9, Math.round(badgeR * 1.15))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(g.libertyCount), bx, by);
          ctx.restore();
        }
      }

      // หากผู้เล่นชี้เมาส์ที่กลุ่มหมากใด ให้ไฮไลต์จุดลมหายใจทุกจุดของกลุ่มนั้นด้วยวงกลมสีฟ้าเรืองแสง
      if (this.inspectedGroup) {
        ctx.save();
        for (const s of this.inspectedGroup.stones) {
          const { px, py } = this.boardToPixel(s.x, s.y);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.92, 0, Math.PI * 2);
          ctx.stroke();
        }

        for (const lib of this.inspectedGroup.liberties) {
          const { px, py } = this.boardToPixel(lib.x, lib.y);
          ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.36, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    drawTerritoryOverlay(ctx) {
      const scoreData = this.engine.calculateScore();
      const map = scoreData.territoryMap;
      const size = this.engine.size;
      const boxSize = Math.max(7, this.cellSize * 0.32);

      ctx.save();
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const owner = map[y][x];
          if (owner === GoEngine.EMPTY) continue;

          const { px, py } = this.boardToPixel(x, y);
          ctx.fillStyle = owner === GoEngine.BLACK
            ? 'rgba(15, 23, 42, 0.82)'
            : 'rgba(255, 255, 255, 0.88)';
          ctx.strokeStyle = owner === GoEngine.BLACK
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(15, 23, 42, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.fillRect(px - boxSize / 2, py - boxSize / 2, boxSize, boxSize);
          ctx.strokeRect(px - boxSize / 2, py - boxSize / 2, boxSize, boxSize);
        }
      }
      ctx.restore();
    }

    drawKoMarker(ctx, x, y) {
      const { px, py } = this.boardToPixel(x, y);
      const r = this.cellSize * 0.28;
      ctx.save();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.4;
      ctx.strokeRect(px - r, py - r, r * 2, r * 2);
      ctx.restore();
    }

    drawArrows(ctx) {
      if (!this.arrows || this.arrows.length === 0) return;
      ctx.save();
      for (const arr of this.arrows) {
        const from = this.boardToPixel(arr.from.x, arr.from.y);
        const to = this.boardToPixel(arr.to.x, arr.to.y);
        const angle = Math.atan2(to.py - from.py, to.px - from.px);
        const headLen = Math.max(9, this.cellSize * 0.28);

        ctx.strokeStyle = arr.color || '#2563eb';
        ctx.fillStyle = arr.color || '#2563eb';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(from.px, from.py);
        ctx.lineTo(to.px, to.py);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(to.px, to.py);
        ctx.lineTo(
          to.px - headLen * Math.cos(angle - Math.PI / 6),
          to.py - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          to.px - headLen * Math.cos(angle + Math.PI / 6),
          to.py - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    drawMarkers(ctx) {
      if (!this.markers || this.markers.length === 0) return;
      const radius = this.cellSize * 0.42;

      for (const m of this.markers) {
        if (!this.engine.isOnBoard(m.x, m.y)) continue;
        const { px, py } = this.boardToPixel(m.x, m.y);
        const stoneColor = this.engine.grid[m.y][m.x];

        ctx.save();

        if (m.type === 'target' || m.type === 'hint') {
          ctx.fillStyle = m.color || 'rgba(16, 185, 129, 0.32)';
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.78, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = m.borderColor || '#059669';
          ctx.lineWidth = 2.6;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (m.type === 'good' || m.type === 'bad') {
          const bg = m.type === 'good' ? 'rgba(16, 185, 129, 0.88)' : 'rgba(239, 68, 68, 0.88)';
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.72, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (m.type === 'triangle') {
          const r = radius * 0.62;
          ctx.strokeStyle = m.color || (stoneColor === GoEngine.BLACK ? '#fbbf24' : '#dc2626');
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(px, py - r);
          ctx.lineTo(px + r * 0.866, py + r * 0.5);
          ctx.lineTo(px - r * 0.866, py + r * 0.5);
          ctx.closePath();
          ctx.stroke();
        } else if (m.type === 'square') {
          const r = radius * 0.52;
          ctx.strokeStyle = m.color || (stoneColor === GoEngine.BLACK ? '#38bdf8' : '#2563eb');
          ctx.lineWidth = 2.4;
          ctx.strokeRect(px - r, py - r, r * 2, r * 2);
        } else {
          // ป้ายตัวอักษร A, B, C หรือตัวเลขแนะนำ
          if (stoneColor === GoEngine.EMPTY) {
            ctx.fillStyle = m.bgColor || 'rgba(255, 251, 235, 0.92)';
            ctx.beginPath();
            ctx.arc(px, py, radius * 0.72, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = m.color || '#1d4ed8';
            ctx.lineWidth = 2.2;
            ctx.stroke();
          }
        }

        if (m.text) {
          ctx.fillStyle = m.textColor || (
            (m.type === 'good' || m.type === 'bad')
              ? '#ffffff'
              : stoneColor === GoEngine.BLACK
                ? '#fde047'
                : stoneColor === GoEngine.WHITE
                  ? '#1e293b'
                  : (m.color || '#1e3a8a')
          );
          const fontSize = Math.max(11, Math.round(radius * 0.88));
          ctx.font = `700 ${fontSize}px "Prompt", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(m.text), px, py);
        }

        ctx.restore();
      }
    }

    drawHoverPreview(ctx, x, y) {
      if (this.engine.grid[y][x] !== GoEngine.EMPTY) return;

      const color = this.engine.currentPlayer;
      const sim = this.engine.simulateMove(x, y, color);
      const { px, py } = this.boardToPixel(x, y);
      const radius = this.cellSize * 0.465;

      if (!sim.valid) {
        // แสดงเครื่องหมาย X สีแดงหากจุดนั้นผิดกติกา (เช่น ฆ่าตัวตาย หรือ โค)
        ctx.save();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        const r = radius * 0.55;
        ctx.beginPath();
        ctx.moveTo(px - r, py - r);
        ctx.lineTo(px + r, py + r);
        ctx.moveTo(px + r, py - r);
        ctx.lineTo(px - r, py + r);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // วาดหมากเงา (Ghost Stone)
      this.drawSingleStone(ctx, x, y, color, radius, 0.48);
    }
  }

  global.GoBoardUI = GoBoardUI;
})(window);
