/**
 * GoEngine - ระบบคำนวณกฎกติกาหมากล้อม (Go / Baduk / Weiqi Core Engine)
 * รองรับกระดาน 9x9, 13x13, 19x19
 * ครบถ้วนด้วยกติกา: ลมหายใจ (Liberties), อาตาริ (Atari), การจับกิน (Capture),
 * กฎห้ามฆ่าตัวตาย (Suicide Rule), กฎโค (Ko Rule), การวิเคราะห์ตาจริง/ตาปลอม (Real/False Eye),
 * การอ่านหมากขั้นบันได (Ladder Reader) และการประเมินพื้นที่/นับแต้ม (Territory & Scoring)
 */

(function (global) {
  'use strict';

  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;

  // ตัวอักษรพิกัดแนวนอนมาตรฐานสากล (ข้ามตัว I เพื่อไม่ให้สับสนกับเลข 1 หรือ J)
  const COL_LABELS = 'ABCDEFGHJKLMNOPQRST';

  class GoEngine {
    constructor(size = 9, komi = 6.5) {
      this.size = size;
      this.komi = komi;
      this.reset(size, komi);
    }

    reset(size = this.size, komi = this.komi) {
      this.size = size;
      this.komi = komi;
      this.grid = this.createEmptyGrid(size);
      this.currentPlayer = BLACK;
      this.captures = { [BLACK]: 0, [WHITE]: 0 };
      this.history = [];
      this.moveHistory = [];
      this.koPoint = null;       // จุดที่ติดกฎโคในตาปัจจุบัน {x, y}
      this.koBoardHash = null;   // สถานะกระดานที่ห้ามซ้ำทันที
      this.lastMove = null;      // { x, y, color, captured: [], pass: boolean }
      this.consecutivePasses = 0;
      this.gameOver = false;
      this.deadStones = new Set(); // เก็บพิกัด "x,y" ของหมากตายตอนนับแต้ม
    }

    createEmptyGrid(size) {
      const g = [];
      for (let y = 0; y < size; y++) {
        g.push(new Array(size).fill(EMPTY));
      }
      return g;
    }

    cloneGrid(grid = this.grid) {
      return grid.map(row => row.slice());
    }

    boardToHash(grid = this.grid) {
      return grid.map(row => row.join('')).join('|');
    }

    isOnBoard(x, y) {
      return x >= 0 && x < this.size && y >= 0 && y < this.size;
    }

    getOpponent(color) {
      return color === BLACK ? WHITE : BLACK;
    }

    /**
     * แปลงพิกัด (x, y) เป็นตัวอักษร เช่น (3, 5) บนกระดาน 9x9 -> "D4"
     */
    coordToText(x, y) {
      if (!this.isOnBoard(x, y)) return '-';
      const col = COL_LABELS[x] || '?';
      const row = this.size - y;
      return `${col}${row}`;
    }

    /**
     * แปลงข้อความพิกัด เช่น "D4" เป็น {x, y}
     */
    textToCoord(text) {
      if (!text || typeof text !== 'string') return null;
      const clean = text.trim().toUpperCase();
      const colChar = clean[0];
      const rowNum = parseInt(clean.slice(1), 10);
      const x = COL_LABELS.indexOf(colChar);
      if (x === -1 || isNaN(rowNum)) return null;
      const y = this.size - rowNum;
      if (!this.isOnBoard(x, y)) return null;
      return { x, y };
    }

    /**
     * คืนค่าจุดดาว (Hoshi / Star Points) ตามขนาดกระดาน
     */
    getStarPoints() {
      if (this.size === 9) {
        return [
          { x: 2, y: 2 }, { x: 6, y: 2 },
          { x: 4, y: 4 },
          { x: 2, y: 6 }, { x: 6, y: 6 }
        ];
      }
      if (this.size === 13) {
        return [
          { x: 3, y: 3 }, { x: 9, y: 3 },
          { x: 6, y: 6 },
          { x: 3, y: 9 }, { x: 9, y: 9 }
        ];
      }
      if (this.size === 19) {
        const pts = [3, 9, 15];
        const result = [];
        for (const y of pts) {
          for (const x of pts) {
            result.push({ x, y });
          }
        }
        return result;
      }
      return [];
    }

    /**
     * คืนค่าจุดตัดข้างเคียงในแนวตั้งและแนวนอน (Orthogonal Neighbors)
     */
    getNeighbors(x, y) {
      const dirs = [
        { x: x, y: y - 1 },
        { x: x + 1, y: y },
        { x: x, y: y + 1 },
        { x: x - 1, y: y }
      ];
      return dirs.filter(pt => this.isOnBoard(pt.x, pt.y));
    }

    /**
     * คืนค่าจุดตัดแนวทแยง (Diagonal Neighbors)
     */
    getDiagonalNeighbors(x, y) {
      const dirs = [
        { x: x - 1, y: y - 1 },
        { x: x + 1, y: y - 1 },
        { x: x - 1, y: y + 1 },
        { x: x + 1, y: y + 1 }
      ];
      return dirs.filter(pt => this.isOnBoard(pt.x, pt.y));
    }

    /**
     * วิเคราะห์กลุ่มหมาก (Connected Group) ที่ตำแหน่ง (x, y)
     * คืนค่า { color, stones: [{x,y}], liberties: [{x,y}], libertyCount, adjacentEnemies: [{x,y}] }
     */
    getGroup(x, y, grid = this.grid) {
      if (!this.isOnBoard(x, y)) return null;
      const color = grid[y][x];
      if (color === EMPTY) return null;

      const visited = new Set();
      const libertySet = new Set();
      const enemySet = new Set();
      const stones = [];
      const liberties = [];
      const adjacentEnemies = [];
      const queue = [{ x, y }];
      visited.add(`${x},${y}`);

      while (queue.length > 0) {
        const curr = queue.shift();
        stones.push(curr);

        for (const nb of this.getNeighbors(curr.x, curr.y)) {
          const nbKey = `${nb.x},${nb.y}`;
          const nbColor = grid[nb.y][nb.x];

          if (nbColor === EMPTY) {
            if (!libertySet.has(nbKey)) {
              libertySet.add(nbKey);
              liberties.push(nb);
            }
          } else if (nbColor === color) {
            if (!visited.has(nbKey)) {
              visited.add(nbKey);
              queue.push(nb);
            }
          } else {
            if (!enemySet.has(nbKey)) {
              enemySet.add(nbKey);
              adjacentEnemies.push(nb);
            }
          }
        }
      }

      return {
        color,
        stones,
        liberties,
        libertyCount: liberties.length,
        adjacentEnemies
      };
    }

    /**
     * ดึงข้อมูลทุกกลุ่มหมากบนกระดาน
     */
    getAllGroups(grid = this.grid) {
      const visited = new Set();
      const groups = [];

      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          const color = grid[y][x];
          if (color !== EMPTY && !visited.has(`${x},${y}`)) {
            const group = this.getGroup(x, y, grid);
            if (group) {
              for (const s of group.stones) {
                visited.add(`${s.x},${s.y}`);
              }
              groups.push(group);
            }
          }
        }
      }
      return groups;
    }

    /**
     * จำลองการวางหมากที่ (x, y) โดยยังไม่เปลี่ยนสถานะจริงของเกม
     * ใช้ตรวจสอบทั้งความถูกต้องของกติกา และผลลัพธ์ที่จะเกิดขึ้น
     */
    simulateMove(x, y, color = this.currentPlayer, grid = this.grid, koBoardHash = this.koBoardHash) {
      if (!this.isOnBoard(x, y)) {
        return {
          valid: false,
          reason: 'out_of_bounds',
          message: 'ตำแหน่งนี้อยู่นอกกระดาน'
        };
      }

      if (grid[y][x] !== EMPTY) {
        return {
          valid: false,
          reason: 'occupied',
          message: 'จุดตัดนี้มีหมากวางอยู่แล้ว'
        };
      }

      const nextGrid = this.cloneGrid(grid);
      nextGrid[y][x] = color;
      const opponent = this.getOpponent(color);

      // 1. ตรวจสอบว่าหมากฝ่ายตรงข้ามที่อยู่ติดกันถูกล้อมจนหมดลมหายใจหรือไม่
      const capturedStones = [];
      const checkedEnemy = new Set();

      for (const nb of this.getNeighbors(x, y)) {
        const key = `${nb.x},${nb.y}`;
        if (nextGrid[nb.y][nb.x] === opponent && !checkedEnemy.has(key)) {
          const enemyGroup = this.getGroup(nb.x, nb.y, nextGrid);
          for (const s of enemyGroup.stones) {
            checkedEnemy.add(`${s.x},${s.y}`);
          }
          if (enemyGroup.libertyCount === 0) {
            for (const s of enemyGroup.stones) {
              capturedStones.push(s);
            }
          }
        }
      }

      // นำหมากที่ถูกจับกินออกจากกระดานจำลอง
      for (const cap of capturedStones) {
        nextGrid[cap.y][cap.x] = EMPTY;
      }

      // 2. ตรวจสอบลมหายใจของกลุ่มหมากตัวเองหลังจากจับกินแล้ว (กฎห้ามฆ่าตัวตาย)
      const ownGroup = this.getGroup(x, y, nextGrid);
      if (ownGroup.libertyCount === 0) {
        return {
          valid: false,
          reason: 'suicide',
          message: 'ผิดกติกา "ห้ามฆ่าตัวตาย" (Suicide Rule): จุดนี้ไม่มีลมหายใจเหลือเลย และไม่สามารถจับกินหมากฝ่ายตรงข้ามได้'
        };
      }

      // 3. ตรวจสอบกฎโค (Ko Rule)
      const nextHash = this.boardToHash(nextGrid);
      if (koBoardHash && nextHash === koBoardHash) {
        return {
          valid: false,
          reason: 'ko',
          message: 'ผิดกติกา "โค" (Ko Rule): ห้ามจับกินย้อนกลับสู่รูปกระดานเดิมทันที ต้องไปเดินที่จุดอื่นก่อนอย่างน้อย 1 ตา'
        };
      }

      // คำนวณจุดโคใหม่ (ถ้ากิน 1 เม็ด และหมากตัวเองอยู่โดดๆ เหลือ 1 ลมหายใจ)
      let nextKoPoint = null;
      let nextKoBoardHash = null;
      if (
        capturedStones.length === 1 &&
        ownGroup.stones.length === 1 &&
        ownGroup.libertyCount === 1
      ) {
        nextKoPoint = { x: capturedStones[0].x, y: capturedStones[0].y };
        nextKoBoardHash = this.boardToHash(grid);
      }

      // ตรวจสอบว่าตานี้ทำให้กลุ่มหมากคู่แข่งติดอาตาริหรือไม่
      const putInAtariGroups = [];
      const seenAtari = new Set();
      for (const nb of this.getNeighbors(x, y)) {
        if (nextGrid[nb.y][nb.x] === opponent) {
          const g = this.getGroup(nb.x, nb.y, nextGrid);
          const firstKey = `${g.stones[0].x},${g.stones[0].y}`;
          if (g.libertyCount === 1 && !seenAtari.has(firstKey)) {
            seenAtari.add(firstKey);
            putInAtariGroups.push(g);
          }
        }
      }

      return {
        valid: true,
        nextGrid,
        capturedStones,
        ownGroup,
        putInAtariGroups,
        nextKoPoint,
        nextKoBoardHash,
        nextHash
      };
    }

    /**
     * วางหมากจริงลงบนกระดาน
     */
    playMove(x, y, color = this.currentPlayer) {
      if (this.gameOver) {
        return { valid: false, reason: 'game_over', message: 'เกมจบแล้ว กรุณาเริ่มกระดานใหม่หรือกดย้อนกลับ' };
      }

      const sim = this.simulateMove(x, y, color, this.grid, this.koBoardHash);
      if (!sim.valid) {
        return sim;
      }

      // บันทึกประวัติไว้สำหรับกด Undo
      this.saveSnapshot();

      this.grid = sim.nextGrid;
      this.captures[color] += sim.capturedStones.length;
      this.koPoint = sim.nextKoPoint;
      this.koBoardHash = sim.nextKoBoardHash;
      this.lastMove = {
        x,
        y,
        color,
        captured: sim.capturedStones,
        pass: false,
        moveNumber: this.moveHistory.length + 1
      };
      this.moveHistory.push(this.lastMove);
      this.consecutivePasses = 0;
      this.currentPlayer = this.getOpponent(color);

      return {
        valid: true,
        captured: sim.capturedStones,
        ownGroup: sim.ownGroup,
        putInAtariGroups: sim.putInAtariGroups,
        koPoint: this.koPoint,
        lastMove: this.lastMove
      };
    }

    /**
     * ขอผ่าน (Pass)
     */
    pass(color = this.currentPlayer) {
      if (this.gameOver) return { valid: false };
      this.saveSnapshot();

      this.koPoint = null;
      this.koBoardHash = null;
      this.consecutivePasses += 1;
      this.lastMove = {
        x: -1,
        y: -1,
        color,
        captured: [],
        pass: true,
        moveNumber: this.moveHistory.length + 1
      };
      this.moveHistory.push(this.lastMove);
      this.currentPlayer = this.getOpponent(color);

      if (this.consecutivePasses >= 2) {
        this.gameOver = true;
      }

      return {
        valid: true,
        pass: true,
        gameOver: this.gameOver,
        consecutivePasses: this.consecutivePasses
      };
    }

    saveSnapshot() {
      this.history.push({
        grid: this.cloneGrid(this.grid),
        currentPlayer: this.currentPlayer,
        captures: { ...this.captures },
        koPoint: this.koPoint ? { ...this.koPoint } : null,
        koBoardHash: this.koBoardHash,
        lastMove: this.lastMove ? { ...this.lastMove } : null,
        consecutivePasses: this.consecutivePasses,
        gameOver: this.gameOver,
        moveHistoryLength: this.moveHistory.length
      });
    }

    /**
     * ย้อนกลับ 1 ตา (Undo)
     */
    undo() {
      if (this.history.length === 0) return false;
      const prev = this.history.pop();
      this.grid = prev.grid;
      this.currentPlayer = prev.currentPlayer;
      this.captures = prev.captures;
      this.koPoint = prev.koPoint;
      this.koBoardHash = prev.koBoardHash;
      this.lastMove = prev.lastMove;
      this.consecutivePasses = prev.consecutivePasses;
      this.gameOver = prev.gameOver;
      this.moveHistory.length = prev.moveHistoryLength;
      return true;
    }

    /**
     * ตั้งค่าสถานะกระดานจากรายการหมากเริ่มต้น (ใช้ในบทเรียนและโจทย์ฝึกหัด)
     * setup = { size, black: [[x,y], ...], white: [[x,y], ...], turn: BLACK|WHITE, koPoint: {x,y} }
     */
    loadPosition(setup) {
      const size = setup.size || this.size;
      this.reset(size, setup.komi !== undefined ? setup.komi : 6.5);

      if (Array.isArray(setup.black)) {
        for (const pt of setup.black) {
          const x = Array.isArray(pt) ? pt[0] : pt.x;
          const y = Array.isArray(pt) ? pt[1] : pt.y;
          if (this.isOnBoard(x, y)) this.grid[y][x] = BLACK;
        }
      }

      if (Array.isArray(setup.white)) {
        for (const pt of setup.white) {
          const x = Array.isArray(pt) ? pt[0] : pt.x;
          const y = Array.isArray(pt) ? pt[1] : pt.y;
          if (this.isOnBoard(x, y)) this.grid[y][x] = WHITE;
        }
      }

      this.currentPlayer = setup.turn || BLACK;
      if (setup.koPoint) {
        this.koPoint = { x: setup.koPoint.x, y: setup.koPoint.y };
        if (setup.koBoardHash) {
          this.koBoardHash = setup.koBoardHash;
        } else if (setup.koAttacker) {
          // สร้าง hash กระดานสมมติหากโจทย์ระบุจุดโคมาโดยตรง
          const tempGrid = this.cloneGrid(this.grid);
          tempGrid[setup.koPoint.y][setup.koPoint.x] = this.currentPlayer;
          tempGrid[setup.koAttacker.y][setup.koAttacker.x] = EMPTY;
          this.koBoardHash = this.boardToHash(tempGrid);
        }
      }
    }

    /**
     * วิเคราะห์ว่าจุดว่าง (x, y) เป็น "ตาจริง (Real Eye)" หรือ "ตาปลอม (False Eye)" ของสี color หรือไม่
     */
    inspectEyePoint(x, y, color, grid = this.grid) {
      if (!this.isOnBoard(x, y) || grid[y][x] !== EMPTY) {
        return { isEyeShape: false, isRealEye: false, reason: 'ไม่ใช่จุดว่าง' };
      }

      const neighbors = this.getNeighbors(x, y);
      for (const nb of neighbors) {
        if (grid[nb.y][nb.x] !== color) {
          return {
            isEyeShape: false,
            isRealEye: false,
            reason: 'ยังล้อมจุดตัดแนวตั้ง-แนวนอนไม่ครบทุกด้าน'
          };
        }
      }

      // ตรวจสอบมุมทแยง 4 มุม (หรือ 2 มุมที่ขอบ / 1 มุมที่มุมกระดาน)
      const diags = this.getDiagonalNeighbors(x, y);
      const opponent = this.getOpponent(color);
      let enemyDiagCount = 0;

      for (const d of diags) {
        if (grid[d.y][d.x] === opponent) {
          enemyDiagCount++;
        }
      }

      const isCorner = diags.length === 1;
      const isEdge = diags.length === 2;
      const threshold = (isCorner || isEdge) ? 1 : 2;

      if (enemyDiagCount >= threshold) {
        return {
          isEyeShape: true,
          isRealEye: false,
          enemyDiagCount,
          reason: 'เป็น "ตาปลอม (False Eye)" เพราะไหล่แนวทแยงถูกหมากฝ่ายตรงข้ามยึดครอง ทำให้ฝ่ายตรงข้ามสามารถเดินบีบอาตาริเพื่อบังคับให้ต้องอุดตาตัวเองได้'
        };
      }

      return {
        isEyeShape: true,
        isRealEye: true,
        enemyDiagCount,
        reason: 'เป็น "ตาจริง (Real Eye)" ที่มั่นคง ฝ่ายตรงข้ามไม่สามารถวางหมากลงในจุดนี้ได้หากยังมีตาอีกห้องหนึ่ง'
      };
    }

    /**
     * ตรวจสอบว่ารูปร่างหมากที่เพิ่งวางที่ (x, y) กลายเป็น "สามเหลี่ยมว่าง (Empty Triangle)" หรือไม่
     */
    isEmptyTriangle(x, y, color, grid = this.grid) {
      const boxes = [
        [{ x: x, y: y }, { x: x + 1, y: y }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 }],
        [{ x: x - 1, y: y }, { x: x, y: y }, { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }],
        [{ x: x, y: y - 1 }, { x: x + 1, y: y - 1 }, { x: x, y: y }, { x: x + 1, y: y }],
        [{ x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x - 1, y: y }, { x: x, y: y }]
      ];

      for (const box of boxes) {
        if (box.every(p => this.isOnBoard(p.x, p.y))) {
          let sameCount = 0;
          let emptyCount = 0;
          for (const p of box) {
            const v = grid[p.y][p.x];
            if (v === color) sameCount++;
            else if (v === EMPTY) emptyCount++;
          }
          if (sameCount === 3 && emptyCount === 1) {
            return true;
          }
        }
      }
      return false;
    }

    /**
     * อ่านหมากขั้นบันได (Ladder / Shicho Reader)
     * ตรวจสอบว่ากลุ่มหมากที่เหลือ 1 หรือ 2 ลมหายใจ สามารถถูกจับกินด้วยขั้นบันไดได้หรือไม่
     */
    canCaptureInLadder(targetX, targetY, grid = this.grid, maxDepth = 30) {
      const targetGroup = this.getGroup(targetX, targetY, grid);
      if (!targetGroup || targetGroup.libertyCount > 2) return { capturable: false };

      const preyColor = targetGroup.color;
      const hunterColor = this.getOpponent(preyColor);

      const searchPreyEscape = (currGrid, px, py, depth) => {
        const g = this.getGroup(px, py, currGrid);
        if (!g) return false; // ถูกกินแล้ว
        if (g.libertyCount >= 3) return true; // หนีรอดได้แล้ว (มี 3 ลมหายใจขึ้นไป)
        if (depth <= 0) return true;

        // ตรวจสอบว่าเหยื่อสามารถกินหมากผู้ล่าที่ติดกันที่มี 1 ลมหายใจเพื่อหนีรอดได้หรือไม่
        for (const enemyStone of g.adjacentEnemies) {
          const eg = this.getGroup(enemyStone.x, enemyStone.y, currGrid);
          if (eg && eg.libertyCount === 1) {
            const capLib = eg.liberties[0];
            const sim = this.simulateMove(capLib.x, capLib.y, preyColor, currGrid, null);
            if (sim.valid) return true;
          }
        }

        // เหยื่อมี 1 ลมหายใจ ต้องเดินหนีที่ลมหายใจสุดท้าย
        if (g.libertyCount === 1) {
          const escapePt = g.liberties[0];
          const sim = this.simulateMove(escapePt.x, escapePt.y, preyColor, currGrid, null);
          if (!sim.valid) return false;
          if (sim.ownGroup.libertyCount >= 3) return true;
          if (sim.ownGroup.libertyCount <= 1) return false;
          return !searchHunterChase(sim.nextGrid, escapePt.x, escapePt.y, depth - 1).capturable;
        }

        return true;
      };

      const searchHunterChase = (currGrid, px, py, depth) => {
        const g = this.getGroup(px, py, currGrid);
        if (!g) return { capturable: true, move: null };
        if (g.libertyCount === 1) {
          return { capturable: true, move: g.liberties[0] };
        }
        if (g.libertyCount > 2 || depth <= 0) {
          return { capturable: false, move: null };
        }

        // ลองเดินไล่อาตาริทั้ง 2 ลมหายใจของเหยื่อ
        for (const lib of g.liberties) {
          const sim = this.simulateMove(lib.x, lib.y, hunterColor, currGrid, null);
          if (!sim.valid) continue;
          if (sim.ownGroup.libertyCount <= 1) continue; // ผู้ล่าโดนกินกลับเอง

          const preyAfter = this.getGroup(px, py, sim.nextGrid);
          if (!preyAfter) return { capturable: true, move: lib };
          if (preyAfter.libertyCount === 1) {
            const escaped = searchPreyEscape(sim.nextGrid, px, py, depth - 1);
            if (!escaped) {
              return { capturable: true, move: lib };
            }
          }
        }

        return { capturable: false, move: null };
      };

      if (targetGroup.libertyCount === 1) {
        const escaped = searchPreyEscape(grid, targetX, targetY, maxDepth);
        return { capturable: !escaped, move: targetGroup.liberties[0] };
      }

      return searchHunterChase(grid, targetX, targetY, maxDepth);
    }

    /**
     * สลับสถานะหมากตาย (Dead Stone Toggle) สำหรับโหมดนับแต้มจบเกม
     */
    toggleDeadGroup(x, y) {
      if (!this.isOnBoard(x, y) || this.grid[y][x] === EMPTY) return;
      const group = this.getGroup(x, y, this.grid);
      if (!group) return;

      const firstKey = `${group.stones[0].x},${group.stones[0].y}`;
      const shouldMarkDead = !this.deadStones.has(firstKey);

      for (const s of group.stones) {
        const k = `${s.x},${s.y}`;
        if (shouldMarkDead) this.deadStones.add(k);
        else this.deadStones.delete(k);
      }
    }

    /**
     * คำนวณพื้นที่และคะแนนรวม (รองรับทั้งพื้นที่ปิดล้อมจริง และอิทธิพลคาดการณ์ระหว่างเล่น)
     */
    calculateScore(grid = this.grid, deadStones = this.deadStones) {
      // สร้างกระดานจำลองที่เอาหมากตายออกก่อนคำนวณพื้นที่
      const cleanGrid = this.cloneGrid(grid);
      let deadBlackCount = 0;
      let deadWhiteCount = 0;

      for (const key of deadStones) {
        const [x, y] = key.split(',').map(Number);
        if (this.isOnBoard(x, y)) {
          if (cleanGrid[y][x] === BLACK) deadBlackCount++;
          else if (cleanGrid[y][x] === WHITE) deadWhiteCount++;
          cleanGrid[y][x] = EMPTY;
        }
      }

      const territoryMap = this.createEmptyGrid(this.size); // 0 = neutral, 1 = Black territory, 2 = White territory
      const visited = new Set();
      let blackTerritory = 0;
      let whiteTerritory = 0;
      let blackStonesOnBoard = 0;
      let whiteStonesOnBoard = 0;

      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          if (cleanGrid[y][x] === BLACK) blackStonesOnBoard++;
          else if (cleanGrid[y][x] === WHITE) whiteStonesOnBoard++;
        }
      }

      // Flood-fill หาพื้นที่ว่างที่ถูกล้อมโดยสีเดียวล้วนๆ
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          const key = `${x},${y}`;
          if (cleanGrid[y][x] === EMPTY && !visited.has(key)) {
            const region = [];
            const queue = [{ x, y }];
            visited.add(key);
            let touchesBlack = false;
            let touchesWhite = false;

            while (queue.length > 0) {
              const curr = queue.shift();
              region.push(curr);

              for (const nb of this.getNeighbors(curr.x, curr.y)) {
                const nbColor = cleanGrid[nb.y][nb.x];
                const nbKey = `${nb.x},${nb.y}`;
                if (nbColor === EMPTY) {
                  if (!visited.has(nbKey)) {
                    visited.add(nbKey);
                    queue.push(nb);
                  }
                } else if (nbColor === BLACK) {
                  touchesBlack = true;
                } else if (nbColor === WHITE) {
                  touchesWhite = true;
                }
              }
            }

            if (touchesBlack && !touchesWhite) {
              blackTerritory += region.length;
              for (const pt of region) territoryMap[pt.y][pt.x] = BLACK;
            } else if (touchesWhite && !touchesBlack) {
              whiteTerritory += region.length;
              for (const pt of region) territoryMap[pt.y][pt.x] = WHITE;
            }
          }
        }
      }

      // คำนวณอิทธิพล (Influence Map) สำหรับจุดว่างที่ยังไม่ได้ปิดล้อมสมบูรณ์ (ใช้แสดงให้ผู้เรียนเห็นแนวโน้มพื้นที่)
      const influenceMap = this.computeInfluenceMap(cleanGrid);
      let blackInfluenceTerritory = blackTerritory;
      let whiteInfluenceTerritory = whiteTerritory;

      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          if (cleanGrid[y][x] === EMPTY && territoryMap[y][x] === EMPTY) {
            const inf = influenceMap[y][x];
            if (inf > 0.35) {
              territoryMap[y][x] = BLACK;
              blackInfluenceTerritory++;
            } else if (inf < -0.35) {
              territoryMap[y][x] = WHITE;
              whiteInfluenceTerritory++;
            }
          }
        }
      }

      // นับแต้มแบบญี่ปุ่น (พื้นที่ว่าง + เชลยที่จับได้ + หมากตายของอีกฝ่าย)
      const blackCapturesTotal = this.captures[BLACK] + deadWhiteCount;
      const whiteCapturesTotal = this.captures[WHITE] + deadBlackCount;

      const blackScore = blackTerritory + blackCapturesTotal;
      const whiteScore = whiteTerritory + whiteCapturesTotal + this.komi;

      // แต้มคาดการณ์ระหว่างเกม (รวมอิทธิพล)
      const blackEstimatedScore = blackInfluenceTerritory + blackCapturesTotal;
      const whiteEstimatedScore = whiteInfluenceTerritory + whiteCapturesTotal + this.komi;

      return {
        blackTerritory,
        whiteTerritory,
        blackInfluenceTerritory,
        whiteInfluenceTerritory,
        blackStonesOnBoard,
        whiteStonesOnBoard,
        blackCapturesTotal,
        whiteCapturesTotal,
        komi: this.komi,
        blackScore,
        whiteScore,
        blackEstimatedScore,
        whiteEstimatedScore,
        lead: blackScore - whiteScore,
        estimatedLead: blackEstimatedScore - whiteEstimatedScore,
        winner: blackScore > whiteScore ? BLACK : WHITE,
        territoryMap,
        influenceMap
      };
    }

    /**
     * คำนวณค่าอิทธิพลของหมากแต่ละเม็ดลงบนจุดว่างบนกระดาน
     * ค่าบวก = อิทธิพลหมากดำ, ค่าลบ = อิทธิพลหมากขาว
     */
    computeInfluenceMap(grid = this.grid) {
      const inf = [];
      for (let y = 0; y < this.size; y++) {
        inf.push(new Array(this.size).fill(0));
      }

      const stones = [];
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          if (grid[y][x] !== EMPTY) {
            stones.push({ x, y, color: grid[y][x] });
          }
        }
      }

      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          let sum = 0;
          for (const s of stones) {
            const dist = Math.abs(x - s.x) + Math.abs(y - s.y);
            if (dist <= 6) {
              const weight = Math.pow(0.55, dist);
              sum += (s.color === BLACK ? weight : -weight);
            }
          }
          inf[y][x] = sum;
        }
      }

      return inf;
    }
  }

  GoEngine.EMPTY = EMPTY;
  GoEngine.BLACK = BLACK;
  GoEngine.WHITE = WHITE;
  GoEngine.COL_LABELS = COL_LABELS;

  global.GoEngine = GoEngine;
})(window);
