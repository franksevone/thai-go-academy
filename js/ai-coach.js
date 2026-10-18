/**
 * GoAICoach - ระบบปัญญาประดิษฐ์คู่ซ้อม (AI Sparring Partner) และโค้ชวิเคราะห์แนะนำการเดินหมาก (Interactive Coach)
 * ประเมินคุณค่าของทุกจุดตัดบนกระดานตามหลักวิชาหมากล้อม:
 * - การจับกิน (Capture) และการช่วยหมากติดอาตาริ (Save Atari)
 * - การอ่านหมากขั้นบันได (Ladder / Shicho)
 * - การตัดและเชื่อมหมาก (Cut & Connect) และรูปร่างปากเสือ (Tiger's Mouth)
 * - การหลีกเลี่ยงรูปร่างเสีย เช่น สามเหลี่ยมว่าง (Empty Triangle) และการเดินเข้าอาตาริตัวเอง (Self-Atari)
 * - หลักการเปิดเกม (Fuseki: มุม -> ข้าง -> กลาง) และการปิดเขตแดนท้ายเกม (Yose)
 */

(function (global) {
  'use strict';

  const EMPTY = GoEngine.EMPTY;
  const BLACK = GoEngine.BLACK;
  const WHITE = GoEngine.WHITE;

  class GoAICoach {
    constructor(engine) {
      this.engine = engine;
    }

    /**
     * ประเมินคะแนนและเหตุผลของทุกตาเดินที่ถูกกติกาบนกระดานสำหรับฝ่าย color
     */
    evaluateAllMoves(color = this.engine.currentPlayer, difficulty = 'advanced') {
      const size = this.engine.size;
      const opponent = this.engine.getOpponent(color);
      const candidates = [];

      const currentGroups = this.engine.getAllGroups();
      const ownAtariGroups = currentGroups.filter(g => g.color === color && g.libertyCount === 1);
      const enemyAtariGroups = currentGroups.filter(g => g.color === opponent && g.libertyCount === 1);
      const ownLowLibGroups = currentGroups.filter(g => g.color === color && g.libertyCount === 2);
      const enemyLowLibGroups = currentGroups.filter(g => g.color === opponent && g.libertyCount === 2);

      const influenceMap = this.engine.computeInfluenceMap();
      const totalMovesPlayed = this.engine.moveHistory.length;
      const isOpening = totalMovesPlayed < (size === 9 ? 10 : size === 13 ? 18 : 30);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (this.engine.grid[y][x] !== EMPTY) continue;

          const sim = this.engine.simulateMove(x, y, color);
          if (!sim.valid) continue;

          let score = 0;
          const reasons = [];
          let primaryCategory = 'positional';

          // 0. ตรวจสอบการวางหมากใน "ตาจริง (Real Eye)" ของฝ่ายเราเอง
          const eyeCheck = this.engine.inspectEyePoint(x, y, color);
          if (eyeCheck.isRealEye) {
            score -= 170;
            primaryCategory = 'blunder';
            reasons.push('ระวัง! การวางหมากใน "ตาจริง (Real Eye)" ของฝ่ายเราเอง จะเป็นการอุดห้องของตัวเอง ลดแต้ม และอาจทำให้กลุ่มหมากกลายเป็นตาเดียวจนถูกจับกิน');
          }

          // 1. ตรวจสอบว่าตานี้เดินเข้าอาตาริตัวเองหรือไม่ (Self-Atari)
          if (sim.ownGroup.libertyCount === 1) {
            // ยกเว้นกรณีโยนหมากสละชีพเพื่อทำ Snapback (งับกลับ)
            let isSnapbackThrowIn = false;
            if (sim.ownGroup.stones.length === 1 && sim.putInAtariGroups.length > 0) {
              const lib = sim.ownGroup.liberties[0];
              const oppCaptureSim = this.engine.simulateMove(lib.x, lib.y, opponent, sim.nextGrid, sim.nextKoBoardHash);
              if (oppCaptureSim.valid && oppCaptureSim.ownGroup.libertyCount === 1 && oppCaptureSim.ownGroup.stones.length >= 3) {
                isSnapbackThrowIn = true;
              }
            }

            if (isSnapbackThrowIn) {
              score += 135;
              primaryCategory = 'tesuji';
              reasons.push('หมากเด็ดโยนสละชีพเพื่อทำ "งับกลับ (Snapback)" จับกินก้อนใหญ่!');
            } else {
              score -= 220 * sim.ownGroup.stones.length;
              primaryCategory = 'blunder';
              reasons.push('อันตราย! เดินแล้วกลุ่มหมากของเราเหลือเพียง 1 ลมหายใจ (ติดอาตาริเอง)');
            }
          }

          // 2. การจับกินหมากฝ่ายตรงข้ามทันที (Immediate Capture)
          if (sim.capturedStones.length > 0) {
            const capCount = sim.capturedStones.length;
            score += 95 + capCount * 42;
            primaryCategory = 'capture';
            reasons.push(`จับกินหมากฝ่ายตรงข้ามได้ทันที ${capCount} เม็ด ได้ทั้งแต้มเชลยและความแข็งแกร่ง`);
          }

          // 3. การช่วยกลุ่มหมากของเราที่กำลังติดอาตาริ (Save Own Group in Atari)
          for (const ag of ownAtariGroups) {
            const lib = ag.liberties[0];
            if (lib && lib.x === x && lib.y === y) {
              if (sim.ownGroup.libertyCount >= 2) {
                // ตรวจว่าหนีแล้วโดนไล่กินด้วยขั้นบันไดทันทีหรือไม่
                const ladderCheck = this.engine.canCaptureInLadder(x, y, sim.nextGrid, 16);
                if (!ladderCheck.capturable) {
                  score += 90 + ag.stones.length * 38;
                  primaryCategory = 'defense';
                  reasons.push(`ช่วยชีวิตกลุ่มหมากของเรา (${ag.stones.length} เม็ด) ออกจากอาตาริ`);
                } else {
                  score -= 40;
                  reasons.push('แม้จะหนีอาตาริได้ชั่วคราว แต่ระวังถูกคู่แข่งไล่จับด้วยขั้นบันได');
                }
              }
            }
          }

          // 4. การรุกอาตาริกลุ่มหมากคู่แข่ง หรือไล่จับด้วยขั้นบันได
          if (sim.putInAtariGroups.length > 0 && sim.ownGroup.libertyCount >= 2) {
            for (const pag of sim.putInAtariGroups) {
              const ladderCheck = this.engine.canCaptureInLadder(pag.stones[0].x, pag.stones[0].y, sim.nextGrid, 16);
              if (ladderCheck.capturable) {
                score += 82 + pag.stones.length * 30;
                primaryCategory = 'attack';
                reasons.push(`ไล่อาตาริจับกินหมากคู่แข่ง (${pag.stones.length} เม็ด) ด้วยเทคนิคขั้นบันได/ปิดล้อม`);
              } else {
                score += 28 + pag.stones.length * 10;
                if (reasons.length === 0) {
                  primaryCategory = 'attack';
                  reasons.push(`รุกอาตาริกดดันหมากคู่แข่ง (${pag.stones.length} เม็ด) เพื่อชิงมือนำ (Sente)`);
                }
              }
            }
          }

          // 5. การป้องกันกลุ่มหมากของเราที่ลมหายใจน้อย (2 ลมหายใจ)
          for (const lg of ownLowLibGroups) {
            const touchesLowGroup = lg.liberties.some(l => l.x === x && l.y === y);
            if (touchesLowGroup && sim.ownGroup.libertyCount >= 3) {
              score += 36 + lg.stones.length * 8;
              if (reasons.length === 0) {
                primaryCategory = 'defense';
                reasons.push(`เสริมลมหายใจให้กลุ่มหมากที่อ่อนแอ (${lg.stones.length} เม็ด) แข็งแรงขึ้นเป็น ${sim.ownGroup.libertyCount} ลมหายใจ`);
              }
            }
          }

          // 6. การบีบลมหายใจกลุ่มหมากคู่แข่งที่เหลือ 2 ลมหายใจ
          for (const elg of enemyLowLibGroups) {
            const touchesEnemyLib = elg.liberties.some(l => l.x === x && l.y === y);
            if (touchesEnemyLib && sim.ownGroup.libertyCount >= 2) {
              score += 30 + elg.stones.length * 7;
              if (reasons.length === 0) {
                primaryCategory = 'attack';
                reasons.push('บีบลมหายใจกลุ่มหมากคู่แข่งที่กำลังอ่อนแอ');
              }
            }
          }

          // 7. การเชื่อมกลุ่มหมากของเราเข้าด้วยกัน (Connecting Friendly Groups)
          const neighborColors = this.engine.getNeighbors(x, y);
          const friendlyNeighborGroups = new Set();
          const enemyNeighborGroups = new Set();

          for (const nb of neighborColors) {
            const c = this.engine.grid[nb.y][nb.x];
            if (c === color) {
              const g = this.engine.getGroup(nb.x, nb.y);
              if (g) friendlyNeighborGroups.add(`${g.stones[0].x},${g.stones[0].y}`);
            } else if (c === opponent) {
              const g = this.engine.getGroup(nb.x, nb.y);
              if (g) enemyNeighborGroups.add(`${g.stones[0].x},${g.stones[0].y}`);
            }
          }

          if (friendlyNeighborGroups.size >= 2 && sim.ownGroup.libertyCount >= 3) {
            score += 35;
            if (reasons.length === 0) {
              primaryCategory = 'shape';
              reasons.push('เชื่อมกลุ่มหมากของเรา 2 ก้อนเข้าด้วยกัน ป้องกันคู่แข่งแทรกตัด');
            }
          }

          // 8. การแทรกตัดหมากคู่แข่ง (Cutting Opponent Stones)
          if (enemyNeighborGroups.size >= 2 && sim.ownGroup.libertyCount >= 2) {
            score += 32;
            if (reasons.length === 0) {
              primaryCategory = 'attack';
              reasons.push('แทรกตัดแยกกลุ่มหมากคู่แข่งออกจากกันเพื่อเปิดศึกโจมตี');
            }
          }

          // 9. ตรวจสอบรูปร่างเสีย "สามเหลี่ยมว่าง (Empty Triangle)"
          if (
            sim.capturedStones.length === 0 &&
            ownAtariGroups.length === 0 &&
            this.engine.isEmptyTriangle(x, y, color, sim.nextGrid)
          ) {
            score -= 22;
          }

          // 10. ตรวจสอบรูป "ปากเสือ (Tiger's Mouth)"
          const diags = this.engine.getDiagonalNeighbors(x, y);
          let friendlyDiagCount = 0;
          for (const d of diags) {
            if (this.engine.grid[d.y][d.x] === color) friendlyDiagCount++;
          }
          if (friendlyDiagCount >= 1 && friendlyNeighborGroups.size === 1 && sim.ownGroup.libertyCount >= 3) {
            score += 12;
          }

          // 11. ประเมินตำแหน่งบนกระดาน (Opening / Fuseki & Territory Balance)
          const distFromEdgeX = Math.min(x, size - 1 - x);
          const distFromEdgeY = Math.min(y, size - 1 - y);
          const minEdgeDist = Math.min(distFromEdgeX, distFromEdgeY);

          if (isOpening) {
            // ห้ามเดินเส้นที่ 1 (ขอบสุด) หรือเส้นที่ 2 ในช่วงเปิดเกมหากไม่มีการปะทะ
            if (minEdgeDist === 0 && sim.capturedStones.length === 0 && enemyNeighborGroups.size === 0) {
              score -= 48;
            } else if (minEdgeDist === 1 && totalMovesPlayed < 6 && enemyNeighborGroups.size === 0) {
              score -= 18;
            }

            // ให้คะแนนพิเศษกับจุดเปิดมุมและเส้นที่ 3-4 (จุดดาว / โคมกุ)
            const idealLine = size === 9 ? 2 : 2; // index 2 คือเส้นที่ 3, index 3 คือเส้นที่ 4
            if ((distFromEdgeX === 2 || distFromEdgeX === 3) && (distFromEdgeY === 2 || distFromEdgeY === 3)) {
              // ตรวจสอบว่ามุมนั้นยังโล่งอยู่หรือไม่
              let nearbyStones = 0;
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;
                  if (this.engine.isOnBoard(nx, ny) && this.engine.grid[ny][nx] !== EMPTY) {
                    nearbyStones++;
                  }
                }
              }
              if (nearbyStones === 0) {
                score += 44;
                if (reasons.length === 0) {
                  primaryCategory = 'fuseki';
                  reasons.push('ยึดมุมว่างตามหลักการเปิดเกม (มุม -> ข้าง -> กลาง) สร้างฐานพื้นที่ได้คุ้มค่าที่สุด');
                }
              } else if (nearbyStones === 1) {
                score += 28;
                if (reasons.length === 0) {
                  primaryCategory = 'fuseki';
                  reasons.push('เดินล้อมมุม (ชิมาริ) หรือเข้าประชิดมุม (คาการิ) เพื่อชิงจังหวะต้นเกม');
                }
              }
            } else if (minEdgeDist === 2 || minEdgeDist === 3) {
              score += 18;
              if (reasons.length === 0) {
                primaryCategory = 'fuseki';
                reasons.push('ขยายแนวหมากด้านข้างบนเส้นที่ 3-4 เพื่อสร้างกรอบพื้นที่และอิทธิพล');
              }
            }

            // 11.1 การบุกจุด 3-3 ยุค AI (Modern AI 3-3 Invasion)
            if (distFromEdgeX === 2 && distFromEdgeY === 2) {
              const starX = x < size / 2 ? (size === 9 ? 2 : 3) : (size === 9 ? 6 : size - 4);
              const starY = y < size / 2 ? (size === 9 ? 2 : 3) : (size === 9 ? 6 : size - 4);
              if (this.engine.isOnBoard(starX, starY) && this.engine.grid[starY][starX] === opponent) {
                score += 34;
                if (reasons.length === 0) {
                  primaryCategory = 'fuseki';
                  reasons.push('บุกจุด 3-3 สไตล์ AI ยุคใหม่: ยึดพื้นที่มุมเป็นแต้มชัวร์ พร้อมชิงความคล่องตัว');
                }
              }
            }
          } else {
            // ช่วงกลางเกมและท้ายเกม (Chuban & Yose): เน้นจุดรอยต่อเขตแดนระหว่างอิทธิพลดำกับขาว
            const inf = influenceMap[y][x];
            const absInf = Math.abs(inf);
            if (absInf < 0.65 && (friendlyNeighborGroups.size > 0 || enemyNeighborGroups.size > 0 || friendlyDiagCount > 0)) {
              score += 24 + (0.65 - absInf) * 20;
              if (reasons.length === 0) {
                primaryCategory = 'yose';
                reasons.push('ขยายเขตแดนในจุดรอยต่อสำคัญ (โยเสะ) เพิ่มพื้นที่ฝ่ายเราและลดพื้นที่คู่แข่ง');
              }
            }

            // 11.2 คาตาซึกิ (Shoulder Hit): ทิ่มไหล่กดเพดานโครงสร้างของคู่แข่ง
            for (const d of diags) {
              if (this.engine.grid[d.y][d.x] === opponent) {
                const oppMinDist = Math.min(d.x, size - 1 - d.x, d.y, size - 1 - d.y);
                if (oppMinDist === (size === 9 ? 2 : 3) && minEdgeDist > oppMinDist && sim.ownGroup.libertyCount >= 3) {
                  score += 26;
                  if (reasons.length === 0) {
                    primaryCategory = 'shape';
                    reasons.push('คาตาซึกิ (Shoulder Hit): ทิ่มไหล่วางเพดานกดกรอบพื้นที่คู่แข่งโดยไม่สร้างหมากหนัก');
                  }
                }
              }
            }

            // 11.3 ฮาเนะขอบกระดานเป็นเซนเต้ (Sente Yose Hane-Tsugi)
            if (minEdgeDist === 0 && sim.putInAtariGroups.length > 0 && sim.ownGroup.libertyCount >= 2) {
              score += 24;
              if (reasons.length === 0) {
                primaryCategory = 'yose';
                reasons.push('ฮาเนะปิดเขตแดนเส้นที่ 1 เป็นเซนเต้ (Sente Yose): บีบแต้มคู่แข่งและรักษามือนำตามหลัก ลี ชางโฮ');
              }
            }

            // ลดคะแนนและแจ้งเตือนเมื่อวางหมากในพื้นที่ที่เป็นบ้านของเราเอง 100% อยู่แล้ว
            const ownSign = color === BLACK ? 1 : -1;
            if (inf * ownSign > 1.25 && enemyNeighborGroups.size === 0 && ownAtariGroups.length === 0 && sim.capturedStones.length === 0) {
              score -= 65;
              if (reasons.length === 0 || primaryCategory === 'positional') {
                primaryCategory = 'blunder';
                reasons.unshift('บ้านโซนนี้ปลอดภัยและชนะขาดแล้ว ไม่จำเป็นต้องเดินซ้ำในบ้านตัวเอง (การเดินซ้ำจะลดพื้นที่ว่างและเสีย 1 แต้มฟรี)');
              }
            }
          }

          if (reasons.length === 0) {
            reasons.push('วางหมากสร้างสมดุลพื้นที่และแผ่อิทธิพลสู่กลางกระดาน');
          }

          // เพิ่มความหลากหลายเล็กน้อยตามระดับความยาก
          const jitter = difficulty === 'beginner'
            ? (Math.random() * 26 - 13)
            : difficulty === 'intermediate'
              ? (Math.random() * 10 - 5)
              : (Math.random() * 2.5);

          // วิเคราะห์เจตนาของการเดิน (Intent Analysis) & รายละเอียดเป้าหมาย
          let intent = primaryCategory;
          let intentTag = '🧭 วางสมดุล';
          let purposeDetail = 'สร้างสมดุลพื้นที่และแผ่อิทธิพลสู่กลางกระดาน';

          if (primaryCategory === 'capture') {
            intent = 'attack';
            intentTag = '⚔️ โจมตี (จับกิน)';
            purposeDetail = 'จับกินหมากคู่แข่งทันทีเพื่อเพิ่มแต้มเชลยและขจัดภัยคุกคาม';
          } else if (primaryCategory === 'attack') {
            intent = 'attack';
            intentTag = '⚔️ โจมตี';
            purposeDetail = 'รุกอาตาริ แทรกตัด หรือบีบลมหายใจเพื่อกดดันกลุ่มหมากคู่แข่ง';
          } else if (primaryCategory === 'defense') {
            intent = 'defense';
            intentTag = '🛡️ ป้องกัน';
            purposeDetail = 'ช่วยกลุ่มหมากติดอาตาริ เพิ่มลมหายใจ หรือเชื่อมหมากป้องกันแผลตัด';
          } else if (primaryCategory === 'shape') {
            intent = 'shape';
            intentTag = '💎 เสริมรูปร่าง';
            purposeDetail = 'สร้างรูปปากเสือหรือเดินฮงเตะ เสริมโครงสร้างหมากให้แข็งแกร่งมั่นคง';
          } else if (primaryCategory === 'fuseki') {
            intent = 'fuseki';
            intentTag = '🏗️ ขยายโครงสร้าง';
            purposeDetail = 'เปิดเกมยึดมุมและขยายแนวข้างตามหลักการ "มุม -> ข้าง -> กลาง"';
          } else if (primaryCategory === 'yose') {
            intent = 'yose';
            intentTag = '🏁 ปิดเกม (โยเสะ)';
            purposeDetail = 'ปิดรั้วรอยต่อเขตแดนและขอบกระดานเพื่อเก็บแต้มสุทธิในจังหวะมือนำ (Sente)';
          } else if (primaryCategory === 'tesuji') {
            intent = 'tesuji';
            intentTag = '✨ เทซูจิ';
            purposeDetail = 'ใช้แต้มเด็ดเฉพาะตัว (หมากขั้นบันได, สละชีพงับกลับ) สร้างจุดเปลี่ยนสำคัญ';
          } else if (primaryCategory === 'blunder') {
            intent = 'blunder';
            intentTag = '⚠️ ระวังเสียแต้ม';
            purposeDetail = 'จุดอันตราย เสี่ยงโดนจับกินหรือวางอุดบ้านตัวเองจนเสียแต้มฟรี';
          }

          candidates.push({
            x,
            y,
            coordText: this.engine.coordToText(x, y),
            score: Math.round((score + jitter) * 10) / 10,
            rawScore: score,
            category: primaryCategory,
            intent,
            intentTag,
            purposeDetail,
            reason: reasons[0],
            allReasons: reasons
          });
        }
      }

      candidates.sort((a, b) => b.score - a.score);
      return candidates;
    }

    /**
     * คืนค่าคำแนะนำตาเดินที่ดีที่สุด 3 อันดับแรกจากโค้ช AI
     */
    getCoachRecommendations(color = this.engine.currentPlayer, topN = 3) {
      const all = this.evaluateAllMoves(color, 'advanced');
      const validMoves = all.filter(m => m.rawScore > -100);
      return validMoves.slice(0, topN);
    }

    /**
     * เลือกตาเดินของ AI (หรือขอผ่าน Pass หากไม่มีจุดเดินที่ได้แต้มเพิ่มแล้ว)
     */
    chooseAIMove(color = this.engine.currentPlayer, difficulty = 'intermediate') {
      const candidates = this.evaluateAllMoves(color, difficulty);
      if (candidates.length === 0) {
        return { pass: true, reason: 'ไม่มีจุดตัดที่สามารถวางหมากได้แล้ว' };
      }

      const best = candidates[0];
      const minMoveThreshold = this.engine.size === 9 ? 24 : this.engine.size === 13 ? 50 : 100;

      // หากอยู่ในช่วงท้ายเกมและตาที่ดีที่สุดมีคะแนนต่ำมาก (เหลือแต่จุดในบ้านตัวเอง) ให้ AI กด Pass
      if (this.engine.moveHistory.length >= minMoveThreshold && best.rawScore < 4) {
        return { pass: true, reason: 'เขตแดนทั้งสองฝ่ายชัดเจนแล้ว AI ขอผ่าน (Pass)' };
      }

      if (this.engine.lastMove && this.engine.lastMove.pass && best.rawScore < 12) {
        return { pass: true, reason: 'ผู้เล่นขอผ่านและไม่มีจุดชิงแต้มสำคัญเหลือแล้ว AI ขอผ่าน (Pass) เพื่อจบเกมและนับแต้ม' };
      }

      // สำหรับระดับเริ่มต้น อาจเลือกอันดับ 2 หรือ 3 บ้างเพื่อออมมือให้ผู้ฝึก
      if (difficulty === 'beginner' && candidates.length >= 3 && best.rawScore < 80) {
        const pickIdx = Math.floor(Math.random() * Math.min(3, candidates.length));
        const chosen = candidates[pickIdx];
        if (chosen.rawScore > -50) {
          return { pass: false, ...chosen };
        }
      }

      return { pass: false, ...best };
    }

    /**
     * วิเคราะห์สถานะของแต่ละโซนบนกระดาน (Board Zones & Territory Analysis)
     * เพื่อแนะนำผู้เล่นว่าโซนไหนปลอดภัย/ชนะแล้ว (ไม่ต้องเดินซ้ำ), โซนไหนคู่แข่งแข็งแกร่ง, หรือโซนไหนกำลังปะทะ
     */
    analyzeBoardZones(color = this.engine.currentPlayer) {
      const size = this.engine.size;
      const opponent = this.engine.getOpponent(color);
      const influenceMap = this.engine.computeInfluenceMap();
      const ownSign = color === BLACK ? 1 : -1;

      let zoneDefs = [];
      if (size === 9) {
        const mid = 4;
        zoneDefs = [
          { id: 'tl', name: 'มุมบนซ้าย', xMin: 0, xMax: mid, yMin: 0, yMax: mid },
          { id: 'tr', name: 'มุมบนขวา', xMin: mid, xMax: 8, yMin: 0, yMax: mid },
          { id: 'bl', name: 'มุมล่างซ้าย', xMin: 0, xMax: mid, yMin: mid, yMax: 8 },
          { id: 'br', name: 'มุมล่างขวา', xMin: mid, xMax: 8, yMin: mid, yMax: 8 },
          { id: 'center', name: 'กลางกระดาน', xMin: 2, xMax: 6, yMin: 2, yMax: 6 }
        ];
      } else if (size === 13) {
        const mid = 6;
        zoneDefs = [
          { id: 'tl', name: 'มุมบนซ้าย', xMin: 0, xMax: mid, yMin: 0, yMax: mid },
          { id: 'tr', name: 'มุมบนขวา', xMin: mid, xMax: 12, yMin: 0, yMax: mid },
          { id: 'bl', name: 'มุมล่างซ้าย', xMin: 0, xMax: mid, yMin: mid, yMax: 12 },
          { id: 'br', name: 'มุมล่างขวา', xMin: mid, xMax: 12, yMin: mid, yMax: 12 },
          { id: 'center', name: 'กลางกระดาน', xMin: 3, xMax: 9, yMin: 3, yMax: 9 }
        ];
      } else {
        const mid = 9;
        zoneDefs = [
          { id: 'tl', name: 'มุมบนซ้าย', xMin: 0, xMax: mid, yMin: 0, yMax: mid },
          { id: 'tr', name: 'มุมบนขวา', xMin: mid, xMax: 18, yMin: 0, yMax: mid },
          { id: 'bl', name: 'มุมล่างซ้าย', xMin: 0, xMax: mid, yMin: mid, yMax: 18 },
          { id: 'br', name: 'มุมล่างขวา', xMin: mid, xMax: 18, yMin: mid, yMax: 18 },
          { id: 'center', name: 'กลางกระดาน (เทนเง็น)', xMin: 5, xMax: 13, yMin: 5, yMax: 13 }
        ];
      }

      return zoneDefs.map(z => {
        let friendlyStones = 0;
        let enemyStones = 0;
        let emptyPoints = 0;
        let sumInf = 0;
        let pointsCount = 0;
        const friendlyGroupsInZone = new Set();
        const enemyGroupsInZone = new Set();

        for (let y = z.yMin; y <= z.yMax; y++) {
          for (let x = z.xMin; x <= z.xMax; x++) {
            pointsCount++;
            const c = this.engine.grid[y][x];
            const inf = influenceMap[y][x];
            sumInf += inf;

            if (c === color) {
              friendlyStones++;
              const g = this.engine.getGroup(x, y);
              if (g) friendlyGroupsInZone.add(g);
            } else if (c === opponent) {
              enemyStones++;
              const g = this.engine.getGroup(x, y);
              if (g) enemyGroupsInZone.add(g);
            } else {
              emptyPoints++;
            }
          }
        }

        const avgInf = pointsCount > 0 ? (sumInf / pointsCount) * ownSign : 0;

        // ตรวจสอบตาจริง (Real Eyes) ภายในโซนนี้
        let friendlyRealEyes = 0;
        let enemyRealEyes = 0;
        for (let y = z.yMin; y <= z.yMax; y++) {
          for (let x = z.xMin; x <= z.xMax; x++) {
            if (this.engine.grid[y][x] === EMPTY) {
              const fEye = this.engine.inspectEyePoint(x, y, color);
              if (fEye.isRealEye) friendlyRealEyes++;
              const eEye = this.engine.inspectEyePoint(x, y, opponent);
              if (eEye.isRealEye) enemyRealEyes++;
            }
          }
        }

        let hasFriendlyAtari = false;
        let hasEnemyAtari = false;
        let hasFriendlyLowLib = false;
        let hasEnemyLowLib = false;

        friendlyGroupsInZone.forEach(g => {
          if (g.libertyCount === 1) hasFriendlyAtari = true;
          if (g.libertyCount <= 2) hasFriendlyLowLib = true;
        });

        enemyGroupsInZone.forEach(g => {
          if (g.libertyCount === 1) hasEnemyAtari = true;
          if (g.libertyCount <= 2) hasEnemyLowLib = true;
        });

        let status = 'open';
        let statusText = 'พื้นที่เปิดกว้าง';
        let badgeClass = 'zone-open';
        let icon = '⚪';
        let advice = 'พื้นที่ยังเปิดกว้าง เหมาะสำหรับการเปิดเกม ยึดจุดดาว หรือขยายโครงสร้าง (โมโย)';

        if (friendlyRealEyes >= 2 || (avgInf > 1.05 && enemyStones === 0 && friendlyStones >= 3)) {
          status = 'safe_won';
          statusText = 'บ้านปลอดภัย 100% (ชนะแล้ว)';
          badgeClass = 'zone-safe';
          icon = '🟢';
          advice = 'โซนนี้รอดชีวิตสมบูรณ์แล้ว ไม่จำเป็นต้องเดินซ้ำในบ้านตัวเองอีก (การเดินซ้ำจะลดพื้นที่ว่างและเสียแต้มฟรี)';
        } else if (enemyRealEyes >= 2 || (avgInf < -1.05 && friendlyStones === 0 && enemyStones >= 3)) {
          status = 'enemy_solid';
          statusText = 'เขตแดนคู่แข่งมั่นคง';
          badgeClass = 'zone-enemy';
          icon = '🔴';
          advice = 'คู่แข่งปิดล้อมรอดชีวิตสมบูรณ์แล้ว หลีกเลี่ยงการบุกดิ่งเข้าไปลึกเพราะจะกลายเป็นเชลยฟรี';
        } else if (hasFriendlyAtari || hasEnemyAtari || (hasFriendlyLowLib && hasEnemyLowLib) || (friendlyStones >= 2 && enemyStones >= 2 && Math.abs(avgInf) < 0.75)) {
          status = 'active_clash';
          statusText = 'สมรภูมิช่วงชิง (กำลังปะทะ)';
          badgeClass = 'zone-clash';
          icon = '🟡';
          if (hasFriendlyAtari) {
            advice = '🚨 มีกลุ่มหมากของเราในโซนนี้ติดอาตาริ (เหลือ 1 ลมหายใจ) ต้องรีบหนีหรือเชื่อมด่วน!';
          } else if (hasEnemyAtari) {
            advice = '⚔️ มีหมากคู่แข่งติดอาตาริในโซนนี้! โอกาสดีที่จะจับกินเพื่อตัดกำลังคู่แข่ง';
          } else {
            advice = 'สมรภูมิตัดสินที่กำลังปะทะ! แต่ละฝ่ายมีหมากประชิดกัน ควรรักษาลมหายใจและหาทางแทรกตัด';
          }
        } else if (friendlyStones > 0 && enemyStones > 0) {
          status = 'contested';
          statusText = 'แนวรอยต่อเขตแดน';
          badgeClass = 'zone-boundary';
          icon = '🟣';
          advice = 'แนวปะทะรอยต่อเขตแดน เหมาะสำหรับเดินปิดรั้ว (โยเสะ) หรือเดินขยายสร้างฐานที่มั่น';
        } else if (friendlyStones > 0 && enemyStones === 0) {
          status = 'friendly_influence';
          statusText = 'เขตอิทธิพลฝ่ายเรา';
          badgeClass = 'zone-influence';
          icon = '🔵';
          advice = 'ฝ่ายเรากุมความได้เปรียบในโซนนี้ เดินล้อมมุม (ชิมาริ) หรือขยายโครงสร้างต่อเนื่อง';
        } else if (enemyStones > 0 && friendlyStones === 0) {
          status = 'enemy_influence';
          statusText = 'เขตอิทธิพลคู่แข่ง';
          badgeClass = 'zone-enemy';
          icon = '🟠';
          advice = 'คู่แข่งครองพื้นที่ส่วนใหญ่ พิจารณาเดินลดทอนพื้นที่ (เคชิ) หรือเข้าประชิดมุม (คาการิ) จากด้านนอก';
        }

        return {
          id: z.id,
          name: z.name,
          status,
          statusText,
          badgeClass,
          icon,
          advice,
          friendlyStones,
          enemyStones,
          emptyPoints,
          friendlyRealEyes,
          enemyRealEyes,
          avgInf: Math.round(avgInf * 100) / 100,
          xMin: z.xMin,
          xMax: z.xMax,
          yMin: z.yMin,
          yMax: z.yMax
        };
      });
    }

    /**
     * วิเคราะห์ตาเดินล่าสุดของผู้เล่นเพื่อให้คำติชมทันทีจากโค้ช (Real-time Move Feedback)
     */
    analyzePlayerMove(moveResult, x, y, color) {
      const coordText = this.engine.coordToText(x, y);
      const feedbacks = [];
      let tone = 'good'; // 'good' | 'warn' | 'danger'

      // ตรวจสอบว่าผู้เล่นเพิ่งวางหมากในตาจริงของตัวเองหรือไม่
      const prevGrid = this.engine.history.length > 0 ? this.engine.history[this.engine.history.length - 1].grid : null;
      if (prevGrid) {
        const eyeBefore = this.engine.inspectEyePoint(x, y, color, prevGrid);
        if (eyeBefore.isRealEye) {
          tone = 'warn';
          feedbacks.push(`💡 <strong>ข้อควรระวัง:</strong> คุณเพิ่งวางหมากที่ <strong>${coordText}</strong> ซึ่งเป็น <em>"ตาจริง (Real Eye)"</em> ของตัวเอง การวางนี้ทำให้เสีย 1 แต้มฟรีและลดจำนวนห้องรอดของกลุ่มหมากครับ`);
        }
      }

      if (moveResult.captured && moveResult.captured.length > 0) {
        feedbacks.push(`🎉 เยี่ยมมาก! การเดินที่ <strong>${coordText}</strong> จับกินหมากคู่แข่งได้ <strong>${moveResult.captured.length} เม็ด</strong>`);
      }

      if (moveResult.ownGroup && moveResult.ownGroup.libertyCount === 1) {
        tone = 'danger';
        feedbacks.push(`⚠️ <strong>ระวัง!</strong> หมากของคุณที่ <strong>${coordText}</strong> เหลือเพียง <strong>1 ลมหายใจ (ติดอาตาริเอง)</strong> คู่แข่งสามารถจับกินได้ในตานี้!`);
      } else if (
        (!moveResult.captured || moveResult.captured.length === 0) &&
        this.engine.isEmptyTriangle(x, y, color)
      ) {
        tone = 'warn';
        feedbacks.push(`💡 <strong>ข้อสังเกตรูปร่างหมาก:</strong> การวางที่ <strong>${coordText}</strong> ทำให้เกิดรูป <em>"สามเหลี่ยมว่าง (Empty Triangle)"</em> ซึ่งลมหายใจหมากจะกระจุกตัว ลองพิจารณาเดินยืดตรงหรือทำรูปปากเสือในครั้งถัดไปครับ`);
      }

      if (moveResult.putInAtariGroups && moveResult.putInAtariGroups.length > 0 && tone !== 'danger') {
        const count = moveResult.putInAtariGroups.reduce((acc, g) => acc + g.stones.length, 0);
        feedbacks.push(`🔥 คุณรุก <strong>"อาตาริ"</strong> กลุ่มหมากคู่แข่ง (${count} เม็ด) บังคับให้คู่แข่งต้องหาทางหนี!`);
      }

      // ตรวจสอบว่าผู้เล่นลืมกลุ่มหมากอื่นของตัวเองที่กำลังติดอาตาริอยู่หรือไม่
      const allGroups = this.engine.getAllGroups();
      const otherOwnAtari = allGroups.filter(
        g => g.color === color && g.libertyCount === 1 && !g.stones.some(s => s.x === x && s.y === y)
      );
      if (otherOwnAtari.length > 0) {
        tone = 'warn';
        const dangerCoord = this.engine.coordToText(otherOwnAtari[0].stones[0].x, otherOwnAtari[0].stones[0].y);
        feedbacks.push(`⚠️ <strong>เตือนภัย:</strong> กลุ่มหมากของคุณบริเวณ <strong>${dangerCoord}</strong> ยังติดอาตาริ (เหลือ 1 ลมหายใจ) อยู่ ระวังถูกจับกินนะครับ!`);
      }

      if (feedbacks.length === 0) {
        feedbacks.push(`✅ คุณวางหมากที่ <strong>${coordText}</strong> (กลุ่มหมากนี้มี <strong>${moveResult.ownGroup.libertyCount} ลมหายใจ</strong>)`);
      }

      return {
        tone,
        html: feedbacks.join('<br>')
      };
    }
  }

  global.GoAICoach = GoAICoach;
})(window);
