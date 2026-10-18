/**
 * Go Academy Application Controller (js/app.js)
 * เชื่อมต่อโมดูลทั้ง 5 ส่วน:
 * 1. บทเรียนพื้นฐานแบบโต้ตอบ (Interactive Lessons)
 * 2. โจทย์ฝึกหัดและการแก้ทาง (Tsumego, Tesuji & Counter-play Puzzles)
 * 3. คัมภีร์แนวทางการเล่นแต่ละสถานการณ์และโจเซกิ (Situational Guide & Joseki Explorer)
 * 4. กระดานซ้อมมือกับ AI และผู้ช่วยโค้ชวิเคราะห์ตาเดิน (Practice Board & AI Coach)
 * 5. พจนานุกรมคำศัพท์และสุภาษิตหมากล้อม (Glossary & Golden Proverbs)
 */

(function () {
  'use strict';

  const GLOSSARY_ITEMS = [
    {
      term: 'ลมหายใจ (Liberties / Ki - คิ)',
      category: 'กติกาพื้นฐาน',
      desc: 'จุดตัดว่างที่อยู่ติดกับเม็ดหมากในแนวตั้งหรือแนวนอน (ไม่นับแนวทแยง) หมากกลางกระดานมี 4 ลมหายใจ ขอบมี 3 และมุมมี 2 หากลมหายใจหมดจะถูกจับกิน'
    },
    {
      term: 'อาตาริ (Atari)',
      category: 'กติกาพื้นฐาน',
      desc: 'สถานะที่หมากหรือกลุ่มหมากถูกล้อมจนเหลือเพียง 1 ลมหายใจสุดท้าย เปรียบเสมือนการ "รุก" ในหมากรุก หากไม่หนีหรือเชื่อมจะถูกจับกินในตาถัดไป'
    },
    {
      term: 'กฎโค (Ko Rule)',
      category: 'กติกาพื้นฐาน',
      desc: 'กติกาห้ามกินหมากคืนในทันทีหากทำให้รูปกระดานย้อนกลับไปซ้ำกับตาก่อนหน้าแบบเดิมเป๊ะ ผู้ที่ถูกกินโคต้องไปเดินสร้างภัยคุกคามที่จุดอื่นก่อน 1 ตา (Ko Threat) จึงจะกลับมากินโคคืนได้'
    },
    {
      term: 'โคมิ (Komi)',
      category: 'กติกาพื้นฐาน',
      desc: 'แต้มต่อชดเชยที่มอบให้หมากขาว เนื่องจากหมากดำได้เปรียบจากการเดินก่อน มาตรฐานสากลกำหนดไว้ที่ 6.5 แต้ม (มี .5 เพื่อป้องกันผลเสมอ)'
    },
    {
      term: 'สองห้องรอด / สองตา (Two Eyes)',
      category: 'ชีวิตและความตาย',
      desc: 'การที่กลุ่มหมากมีพื้นที่ว่างแยกขาดจากกันอย่างน้อย 2 จุดภายในกลุ่ม ทำให้ฝ่ายตรงข้ามไม่สามารถวางหมากฆ่าได้เลยเพราะผิดกฎห้ามฆ่าตัวตาย กลุ่มหมากจึงเป็นอมตะ'
    },
    {
      term: 'ตาปลอม (False Eye / Keme)',
      category: 'ชีวิตและความตาย',
      desc: 'จุดว่างที่ดูเหมือนตาของกลุ่มหมาก แต่ไหล่แนวทแยงถูกหมากฝ่ายตรงข้ามยึดครอง ทำให้ฝ่ายตรงข้ามสามารถเดินบีบอาตาริเพื่อบังคับให้อุดตาตัวเองได้'
    },
    {
      term: 'เซคิ (Seki)',
      category: 'ชีวิตและความตาย',
      desc: 'สภาวะอยู่ร่วมกันอย่างสันติ เมื่อกลุ่มหมากสองฝ่ายประชิดกันและมีลมหายใจร่วมกัน โดยที่หากฝ่ายใดเดินเข้าไปปิดลมหายใจก่อนจะติดอาตาริเองและถูกอีกฝ่ายกินทันที'
    },
    {
      term: 'ฟุเซกิ (Fuseki - การเปิดเกม)',
      category: 'กลยุทธ์ช่วงต้นเกม',
      desc: 'การวางแผนกระจายหมากในช่วงต้นเกม ยึดหลักสำคัญคือ "มุม -> ข้าง -> กลาง" เพราะมุมใช้จำนวนเม็ดหมากน้อยที่สุดในการล้อมพื้นที่'
    },
    {
      term: 'โจเซกิ (Joseki - รูปแบบมาตรฐานที่มุม)',
      category: 'กลยุทธ์ช่วงต้นเกม',
      desc: 'ลำดับการเดินหมากโต้ตอบกันบริเวณมุมกระดานที่ผ่านการศึกษามาแล้วว่าให้ผลลัพธ์ที่สมดุลและยุติธรรมทั้งสองฝ่าย (เช่น ฝ่ายหนึ่งได้พื้นที่มุม อีกฝ่ายได้อิทธิพลด้านนอก)'
    },
    {
      term: 'ซึเมะโกะ (Tsumego - โจทย์ชีวิตและความตาย)',
      category: 'การฝึกอ่านหมาก',
      desc: 'โจทย์ปัญหาหมากล้อมในพื้นที่จำกัด เพื่อฝึกอ่านหมากหาทางสร้างสองห้องเพื่อรอดชีวิต หรือหาจุดตาย (Kyusho) เพื่อสังหารกลุ่มหมากฝ่ายตรงข้าม'
    },
    {
      term: 'เทซูจิ (Tesuji - หมากเด็ด)',
      category: 'เทคนิคการต่อสู้',
      desc: 'แต้มเดินที่ชาญฉลาดและมีประสิทธิภาพสูงสุดในสถานการณ์เฉพาะหน้า เช่น การโยนหมากสละชีพ การงับกลับ หรือการคลุมด้วยตาข่ายเพื่อพลิกสถานการณ์'
    },
    {
      term: 'ขั้นบันได (Shicho / Ladder)',
      category: 'เทคนิคการจับกิน',
      desc: 'การไล่อาตาริหมากคู่แข่งแบบซิกแซกต่อเนื่องจาก 2 ลมหายใจให้เหลือ 1 ลมหายใจไปเรื่อยๆ จนชนขอบกระดานหรือชนหมากฝ่ายเราที่ดักรออยู่'
    },
    {
      term: 'ตาข่าย (Geta / Net)',
      category: 'เทคนิคการจับกิน',
      desc: 'การวางหมากดักห่าง 1 จุดแบบคลุมแห ปิดทางหนีของหมากคู่แข่งทั้งสองด้านพร้อมกันโดยไม่ต้องเดินเบียดประชิด'
    },
    {
      term: 'งับกลับ (Oiotoshi / Snapback)',
      category: 'เทคนิคการจับกิน',
      desc: 'กลยุทธ์ยอมสละหมาก 1 เม็ดโยนเข้าปากเสือให้คู่แข่งกิน แต่ทันทีที่คู่แข่งกิน หมากก้อนใหญ่ของคู่แข่งกลับเหลือเพียง 1 ลมหายใจและถูกเรางับกินกลับทั้งหมด'
    },
    {
      term: 'เซนเต้ (Sente) & โกเต้ (Gote)',
      category: 'จังหวะการเดินหมาก',
      desc: 'เซนเต้ (มือนำ) คือการเดินที่สร้างภัยคุกคามบังคับให้คู่แข่งต้องเดินรับ ทำให้เราได้สิทธิ์ชิงไปเดินจุดสำคัญอื่นต่อ ส่วนโกเต้ (มือตาม) คือการเดินปิดท้ายที่คู่แข่งไม่จำเป็นต้องรับ'
    },
    {
      term: 'ฮาเนะ (Hane) & โนบิ (Nobi)',
      category: 'รูปร่างหมาก',
      desc: 'ฮาเนะ คือการเดินอ้อมกดหัวหมากคู่แข่งที่ประชิดกัน ส่วน โนบิ คือการเดินยืดตัวตรงๆ ไปตามเส้นเพื่อเพิ่มลมหายใจอย่างมั่นคง'
    },
    {
      term: 'ปากเสือ (Tiger\'s Mouth) & สามเหลี่ยมว่าง (Empty Triangle)',
      category: 'รูปร่างหมาก',
      desc: 'ปากเสือ คือหมาก 3 เม็ดที่ล้อมจุดตัดว่างไว้ 3 ด้าน เป็นรูปร่างที่ดีมาก ส่วน สามเหลี่ยมว่าง คือหมาก 3 เม็ดที่เรียงเป็นตัว L ในช่อง 2x2 ซึ่งเป็นรูปร่างเสียที่ควรหลีกเลี่ยง'
    },
    {
      term: 'โยเสะ (Yose - การปิดเกม)',
      category: 'กลยุทธ์ท้ายเกม',
      desc: 'ช่วงท้ายของการแข่งขันที่ทั้งสองฝ่ายเดินปิดรั้วเขตแดนและเก็บแต้มตามรอยต่อพื้นที่ ต้องให้ความสำคัญกับตาเดินที่เป็น "เซนเต้" ก่อนเสมอ'
    },
    {
      term: 'สุภาษิต: "มุมคือทอง ข้างคือเงิน กลางคือหญ้า"',
      category: 'สุภาษิตหมากล้อม',
      desc: 'เตือนใจให้เริ่มยึดพื้นที่จากมุมกระดานก่อน ตามด้วยด้านข้าง ส่วนกลางกระดานล้อมเป็นแต้มได้ยากที่สุด'
    },
    {
      term: 'สุภาษิต: "จุดที่ศัตรูอยากเดิน คือจุดที่เราต้องเดิน"',
      category: 'สุภาษิตหมากล้อม',
      desc: 'ในการสู้รบและซึเมะโกะ จุดสำคัญ (Vital Point) ที่ทำให้คู่แข่งมีสองตาหรือมีรูปร่างดี คือจุดเดียวกับที่เราต้องชิงวางเพื่อทำลายรูปหมากของเขา'
    }
  ];

  class GoAcademyApp {
    constructor() {
      this.activeTab = 'lessons'; // 'lessons' | 'puzzles' | 'situations' | 'practice' | 'glossary'

      // Progress persistence
      this.completedLessons = this.loadSet('go_completed_lessons');
      this.solvedPuzzles = this.loadSet('go_solved_puzzles');

      // Lesson State
      this.currentLessonIndex = 0;
      this.currentStepIndex = 0;
      this.lessonStepDone = false;

      // Puzzle State
      this.currentPuzzleCategory = 'all';
      this.currentPuzzleId = PUZZLES_DATA[0].id;
      this.puzzleStepIndex = 0;
      this.puzzleActiveSequence = null;
      this.puzzleStatus = 'playing'; // 'playing' | 'solved' | 'wrong' | 'solution'
      this.puzzleFeedback = null;

      // Situation State
      this.currentSituationIndex = 0;
      this.selectedSituationOptIndex = 0;
      this.situationSeqStep = 0;

      // Practice & AI Coach State
      this.practiceConfig = {
        size: 9,
        mode: 'ai_black', // 'ai_black' | 'ai_white' | 'free'
        difficulty: 'intermediate', // 'beginner' | 'intermediate' | 'advanced'
        handicap: 0
      };
      this.practiceFeedback = {
        tone: 'info',
        html: 'ยินดีต้อนรับสู่กระดานซ้อมมือ! คลิกวางหมากบนจุดตัด หรือกดปุ่ม <strong>"ขอคำแนะนำจากโค้ช"</strong> เพื่อดู 3 จุดน่าเดินพร้อมเหตุผลครับ'
      };
      this.coachRecommendations = [];
      this.aiThinking = false;

      // Initialize Engine & Board UI
      this.engine = new GoEngine(9, 6.5);
      this.coach = new GoAICoach(this.engine);

      const canvas = document.getElementById('go-board-canvas');
      this.boardUI = new GoBoardUI(canvas, this.engine, {
        onIntersectionClick: (x, y) => this.handleBoardClick(x, y),
        onHoverChange: (coord, group) => this.updateHoverInspector(coord, group)
      });

      this.bindGlobalControls();
      this.switchTab('lessons');
    }

    loadSet(key) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? new Set(JSON.parse(raw)) : new Set();
      } catch (e) {
        return new Set();
      }
    }

    saveSet(key, setObj) {
      try {
        localStorage.setItem(key, JSON.stringify(Array.from(setObj)));
      } catch (e) {}
    }

    bindGlobalControls() {
      // Navigation Tabs
      document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          this.switchTab(tab);
        });
      });

      // Visual Helper Toggles
      const toggleLibs = document.getElementById('toggle-liberties');
      const toggleTerritory = document.getElementById('toggle-territory');
      const toggleMoveNums = document.getElementById('toggle-movenums');
      const toggleSound = document.getElementById('toggle-sound');

      if (toggleLibs) {
        toggleLibs.addEventListener('change', (e) => {
          this.boardUI.showLiberties = e.target.checked;
          this.boardUI.render();
        });
      }
      if (toggleTerritory) {
        toggleTerritory.addEventListener('change', (e) => {
          this.boardUI.showTerritory = e.target.checked;
          this.boardUI.render();
        });
      }
      if (toggleMoveNums) {
        toggleMoveNums.addEventListener('change', (e) => {
          this.boardUI.showMoveNumbers = e.target.checked;
          this.boardUI.render();
        });
      }
      if (toggleSound) {
        toggleSound.addEventListener('change', (e) => {
          this.boardUI.sound.enabled = e.target.checked;
        });
      }

      // Zen Board Fullscreen Toggle (เหมาะสำหรับสมาร์ทโฟนและบอร์ดขนาดใหญ่ 13x13, 19x19)
      const btnZen = document.getElementById('btn-toggle-zen-board');
      const zenBtnText = document.getElementById('zen-btn-text');
      if (btnZen) {
        btnZen.addEventListener('click', () => {
          const isZen = document.body.classList.toggle('zen-board-mode');
          if (zenBtnText) {
            zenBtnText.textContent = isZen ? 'ออกจากเต็มจอ (แสดงเมนู)' : 'ขยายเต็มจอ (ซ่อนเมนู)';
          }
          btnZen.classList.toggle('active', isZen);
          setTimeout(() => {
            this.boardUI.resize();
            this.boardUI.render();
          }, 80);
        });
      }

      // Mobile Bottom Drawer Toggle
      const btnDrawer = document.getElementById('btn-toggle-mobile-drawer');
      const drawerText = document.getElementById('drawer-toggle-text');
      const rightPanel = document.getElementById('right-panel-content');
      if (btnDrawer && rightPanel) {
        btnDrawer.addEventListener('click', () => {
          const isExpanded = rightPanel.classList.toggle('drawer-expanded');
          if (drawerText) {
            drawerText.textContent = isExpanded ? 'ปิดแผงข้อมูล ⬇️' : 'เปิดแผงคำแนะนำ & ข้อมูลบทเรียน ⬆️';
          }
        });
      }
    }

    switchTab(tab) {
      this.activeTab = tab;
      document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
      });

      const workspaceGrid = document.getElementById('main-workspace-grid');
      const glossaryView = document.getElementById('glossary-full-view');

      if (tab === 'glossary') {
        workspaceGrid.style.display = 'none';
        glossaryView.style.display = 'block';
        this.renderGlossaryView();
        return;
      }

      workspaceGrid.style.display = 'grid';
      glossaryView.style.display = 'none';
      this.boardUI.scoringMode = false;

      if (tab === 'lessons') {
        this.loadLessonStep(this.currentLessonIndex, this.currentStepIndex);
      } else if (tab === 'puzzles') {
        this.loadPuzzle(this.currentPuzzleId);
      } else if (tab === 'situations') {
        this.loadSituation(this.currentSituationIndex, 0);
      } else if (tab === 'practice') {
        this.initPracticeGame();
      }

      setTimeout(() => this.boardUI.resize(), 20);
    }

    updateBoardStatusBar() {
      const turnDot = document.getElementById('status-turn-dot');
      const turnText = document.getElementById('status-turn-text');
      const capBlack = document.getElementById('cap-black-count');
      const capWhite = document.getElementById('cap-white-count');
      const boardSizeBadge = document.getElementById('board-size-badge');

      const isBlack = this.engine.currentPlayer === GoEngine.BLACK;
      if (turnDot) {
        turnDot.className = `turn-dot ${isBlack ? 'black' : 'white'}`;
      }
      if (turnText) {
        if (this.boardUI.scoringMode) {
          turnText.textContent = 'โหมดนับแต้ม (คลิกหมากที่ตายเพื่อนำออก)';
        } else if (this.engine.gameOver) {
          turnText.textContent = 'จบเกมแล้ว';
        } else {
          turnText.textContent = isBlack ? 'ตาของ หมากดำ (Black)' : 'ตาของ หมากขาว (White)';
        }
      }
      if (capBlack) capBlack.textContent = String(this.engine.captures[GoEngine.BLACK]);
      if (capWhite) capWhite.textContent = String(this.engine.captures[GoEngine.WHITE]);
      if (boardSizeBadge) boardSizeBadge.textContent = `กระดาน ${this.engine.size}×${this.engine.size}`;
    }

    updateHoverInspector(coord, group) {
      const el = document.getElementById('hover-inspector-bar');
      if (!el) return;

      if (!coord) {
        el.innerHTML = `
          <span>🔍 เลื่อนเมาส์ชี้บนกระดานเพื่อตรวจสอบจำนวนลมหายใจ กลุ่มหมาก หรือจุดห้ามวาง</span>
          <span class="inspector-badge">พร้อมใช้งาน</span>
        `;
        return;
      }

      const coordText = this.engine.coordToText(coord.x, coord.y);
      if (group) {
        const colorName = group.color === GoEngine.BLACK ? '⚫ หมากดำ' : '⚪ หมากขาว';
        const statusText = group.libertyCount === 1
          ? '⚠️ ติดอาตาริ! (เหลือ 1 ลมหายใจสุดท้าย)'
          : `มี ${group.libertyCount} ลมหายใจ (สีฟ้าบนกระดาน)`;
        el.innerHTML = `
          <span>พิกัด <strong>${coordText}</strong>: ${colorName} (กลุ่มหมากเชื่อมกัน ${group.stones.length} เม็ด)</span>
          <span class="inspector-badge">${statusText}</span>
        `;
      } else {
        // จุดตัดว่าง: ตรวจดูว่าวางได้ไหม และถ้าวางจะมีกี่ลมหายใจ หรือเป็นตาจริง/ตาปลอม
        const sim = this.engine.simulateMove(coord.x, coord.y, this.engine.currentPlayer);
        const blackEye = this.engine.inspectEyePoint(coord.x, coord.y, GoEngine.BLACK);
        const whiteEye = this.engine.inspectEyePoint(coord.x, coord.y, GoEngine.WHITE);

        let extraInfo = '';
        if (blackEye.isEyeShape) {
          extraInfo = ` | 👁️ สำหรับดำ: ${blackEye.isRealEye ? 'ตาจริง' : 'ตาปลอม'}`;
        } else if (whiteEye.isEyeShape) {
          extraInfo = ` | 👁️ สำหรับขาว: ${whiteEye.isRealEye ? 'ตาจริง' : 'ตาปลอม'}`;
        }

        if (!sim.valid) {
          el.innerHTML = `
            <span>พิกัด <strong>${coordText}</strong> (จุดว่าง): ❌ ${sim.message}</span>
            <span class="inspector-badge">ห้ามวาง</span>
          `;
        } else {
          const capNote = sim.capturedStones.length > 0 ? ` | จับกินได้ ${sim.capturedStones.length} เม็ด!` : '';
          el.innerHTML = `
            <span>พิกัด <strong>${coordText}</strong> (จุดว่าง)${extraInfo}${capNote}</span>
            <span class="inspector-badge">หากวางจะได้ ${sim.ownGroup.libertyCount} ลมหายใจ</span>
          `;
        }
      }
    }

    handleBoardClick(x, y) {
      if (this.activeTab === 'lessons') {
        this.handleLessonBoardClick(x, y);
      } else if (this.activeTab === 'puzzles') {
        this.handlePuzzleBoardClick(x, y);
      } else if (this.activeTab === 'situations') {
        this.handleSituationBoardClick(x, y);
      } else if (this.activeTab === 'practice') {
        this.handlePracticeBoardClick(x, y);
      }
    }

    // =========================================================================
    // MODULE 1: INTERACTIVE LESSONS (บทเรียนพื้นฐาน 8 บท)
    // =========================================================================
    loadLessonStep(lessonIdx, stepIdx) {
      this.currentLessonIndex = Math.max(0, Math.min(LESSONS_DATA.length - 1, lessonIdx));
      const lesson = LESSONS_DATA[this.currentLessonIndex];
      this.currentStepIndex = Math.max(0, Math.min(lesson.steps.length - 1, stepIdx));
      const step = lesson.steps[this.currentStepIndex];

      this.lessonStepDone = false;
      const setup = step.setupOverride || step.setup;
      const markers = step.markersOverride || step.markers || [];

      this.engine.loadPosition(setup);
      this.boardUI.interactive = true;
      this.boardUI.setMarkers(markers);
      this.updateBoardStatusBar();
      this.renderLessonPanel();
    }

    handleLessonBoardClick(x, y) {
      const lesson = LESSONS_DATA[this.currentLessonIndex];
      const step = lesson.steps[this.currentStepIndex];

      const isExpected = (step.expectedMoves || []).some(m => m.x === x && m.y === y);
      if (!isExpected) {
        const sim = this.engine.simulateMove(x, y, this.engine.currentPlayer);
        this.boardUI.sound.playError();
        const msg = !sim.valid
          ? sim.message
          : `จุด ${this.engine.coordToText(x, y)} ยังไม่ใช่จุดเป้าหมายของภารกิจนี้ ลองคลิกวางที่จุดที่มีวงสีเขียวแนะนำบนกระดานครับ`;
        this.renderLessonPanel({ type: 'warn', text: msg });
        return;
      }

      const res = this.engine.playMove(x, y, this.engine.currentPlayer);
      if (res.valid) {
        if (res.captured && res.captured.length > 0) {
          this.boardUI.sound.playCapture();
        } else {
          this.boardUI.sound.playStoneClack();
        }
        setTimeout(() => this.boardUI.sound.playSuccess(), 120);

        this.lessonStepDone = true;
        this.boardUI.setMarkers([{ x, y, type: 'good', text: '✓' }]);
        this.updateBoardStatusBar();

        // หากเป็นขั้นตอนสุดท้ายของบทเรียน ให้บันทึกว่าเรียนจบบทนี้แล้ว
        if (this.currentStepIndex === lesson.steps.length - 1) {
          this.completedLessons.add(lesson.id);
          this.saveSet('go_completed_lessons', this.completedLessons);
        }

        this.renderLessonPanel({ type: 'success', text: step.successMessage });
      }
    }

    renderLessonPanel(feedback = null) {
      const container = document.getElementById('right-panel-content');
      const lesson = LESSONS_DATA[this.currentLessonIndex];
      const step = lesson.steps[this.currentStepIndex];

      const lessonButtonsHtml = LESSONS_DATA.map((item, idx) => {
        const done = this.completedLessons.has(item.id);
        const active = idx === this.currentLessonIndex ? 'active' : '';
        return `
          <button class="selector-btn ${active}" data-lesson-idx="${idx}">
            <span>บทที่ ${item.number}: ${item.title.split('(')[0].trim()}</span>
            <span class="done-mark">${done ? '✓' : ''}</span>
          </button>
        `;
      }).join('');

      const stepPillsHtml = lesson.steps.map((st, sIdx) => {
        const active = sIdx === this.currentStepIndex ? 'active' : '';
        return `<button class="cat-chip ${active}" data-step-idx="${sIdx}">ส่วนที่ ${lesson.number}.${sIdx + 1}</button>`;
      }).join('');

      let feedbackHtml = '';
      if (feedback) {
        feedbackHtml = `<div class="feedback-banner ${feedback.type}">${feedback.text}</div>`;
      }

      const hasNextStep = this.currentStepIndex < lesson.steps.length - 1;
      const hasNextLesson = this.currentLessonIndex < LESSONS_DATA.length - 1;

      container.innerHTML = `
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <div class="panel-title">📚 บทที่ ${lesson.number}: ${lesson.title}</div>
              <div class="panel-subtitle">${lesson.subtitle}</div>
            </div>
            <span class="badge badge-primary">${lesson.level}</span>
          </div>

          <div class="selector-grid">${lessonButtonsHtml}</div>

          <div class="category-tabs">${stepPillsHtml}</div>

          <h3 style="margin-bottom: 0.5rem; color: #0f766e;">${step.title}</h3>
          <div class="lesson-body">${step.content}</div>

          <div class="task-box">
            <strong>🎯 ภารกิจบนกระดาน:</strong> ${step.taskPrompt}
          </div>

          ${feedbackHtml}

          <div class="btn-row">
            <button class="btn btn-outline" id="btn-lesson-reset">🔄 เริ่มขั้นตอนนี้ใหม่</button>
            ${hasNextStep ? `
              <button class="btn btn-primary" id="btn-lesson-next-step">ไปส่วนถัดไป (${lesson.number}.${this.currentStepIndex + 2}) ➔</button>
            ` : hasNextLesson ? `
              <button class="btn btn-gold" id="btn-lesson-next-lesson">ไปบทที่ ${lesson.number + 1} ถัดไป ➔</button>
            ` : `
              <button class="btn btn-gold" id="btn-lesson-go-puzzles">🎉 จบหลักสูตรพื้นฐาน! ไปลุยโจทย์ฝึกหัด ➔</button>
            `}
          </div>
        </div>
      `;

      container.querySelectorAll('[data-lesson-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.loadLessonStep( parseInt(btn.getAttribute('data-lesson-idx'), 10), 0);
        });
      });

      container.querySelectorAll('[data-step-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.loadLessonStep(this.currentLessonIndex, parseInt(btn.getAttribute('data-step-idx'), 10));
        });
      });

      const resetBtn = document.getElementById('btn-lesson-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.loadLessonStep(this.currentLessonIndex, this.currentStepIndex));
      }

      const nextStepBtn = document.getElementById('btn-lesson-next-step');
      if (nextStepBtn) {
        nextStepBtn.addEventListener('click', () => this.loadLessonStep(this.currentLessonIndex, this.currentStepIndex + 1));
      }

      const nextLessonBtn = document.getElementById('btn-lesson-next-lesson');
      if (nextLessonBtn) {
        nextLessonBtn.addEventListener('click', () => this.loadLessonStep(this.currentLessonIndex + 1, 0));
      }

      const goPuzzlesBtn = document.getElementById('btn-lesson-go-puzzles');
      if (goPuzzlesBtn) {
        goPuzzlesBtn.addEventListener('click', () => this.switchTab('puzzles'));
      }
    }

    // =========================================================================
    // MODULE 2: PUZZLES & COUNTER-PLAY (โจทย์ฝึกหัดและการแก้ทาง 10 ข้อ)
    // =========================================================================
    getFilteredPuzzles() {
      if (this.currentPuzzleCategory === 'all') return PUZZLES_DATA;
      return PUZZLES_DATA.filter(p => p.category === this.currentPuzzleCategory);
    }

    loadPuzzle(puzzleId) {
      const puzzle = PUZZLES_DATA.find(p => p.id === puzzleId) || PUZZLES_DATA[0];
      this.currentPuzzleId = puzzle.id;
      this.puzzleStepIndex = 0;
      this.puzzleActiveSequence = puzzle.solutionSequence;
      this.puzzleStatus = 'playing';
      this.puzzleFeedback = null;

      this.engine.loadPosition(puzzle.setup);
      this.boardUI.interactive = true;
      this.boardUI.setMarkers(puzzle.markers ? [...puzzle.markers] : []);
      this.updateBoardStatusBar();
      this.renderPuzzlePanel();
    }

    handlePuzzleBoardClick(x, y) {
      if (this.puzzleStatus !== 'playing') return;

      const puzzle = PUZZLES_DATA.find(p => p.id === this.currentPuzzleId);
      if (!puzzle) return;

      // ตรวจสอบว่าผู้เล่นเดินตาแรกด้วยทางเลือกคู่ขนานที่ถูกต้องหรือไม่ (เช่น ข้อ 10)
      if (
        this.puzzleStepIndex === 0 &&
        puzzle.alternateFirstMove &&
        puzzle.alternateFirstMove.x === x &&
        puzzle.alternateFirstMove.y === y
      ) {
        this.puzzleActiveSequence = puzzle.alternateFirstMove.nextSequence;
      }

      const expectedMove = this.puzzleActiveSequence[this.puzzleStepIndex];
      if (!expectedMove) return;

      if (x === expectedMove.x && y === expectedMove.y) {
        // ผู้เล่นเดินถูกต้อง!
        const res = this.engine.playMove(x, y, expectedMove.color);
        if (res.captured && res.captured.length > 0) {
          this.boardUI.sound.playCapture();
        } else {
          this.boardUI.sound.playStoneClack();
        }

        this.puzzleStepIndex += 1;
        this.updateBoardStatusBar();

        // ตรวจสอบว่าจบชุดคำตอบหรือยัง
        if (this.puzzleStepIndex >= this.puzzleActiveSequence.length) {
          this.puzzleStatus = 'solved';
          this.solvedPuzzles.add(puzzle.id);
          this.saveSet('go_solved_puzzles', this.solvedPuzzles);
          setTimeout(() => this.boardUI.sound.playSuccess(), 120);
          this.boardUI.setMarkers([{ x, y, type: 'good', text: '✓' }]);
          this.puzzleFeedback = {
            type: 'success',
            text: `<strong>🎉 แก้โจทย์สำเร็จ!</strong> ${expectedMove.comment}`
          };
          this.renderPuzzlePanel();
          return;
        }

        // ยังมีตาเดินสวนกลับอัตโนมัติของคู่แข่งในโจทย์
        this.puzzleFeedback = {
          type: 'info',
          text: `<strong>👍 เดินถูกต้อง!</strong> ${expectedMove.comment}`
        };
        this.boardUI.interactive = false;
        this.renderPuzzlePanel();

        setTimeout(() => {
          const replyMove = this.puzzleActiveSequence[this.puzzleStepIndex];
          if (replyMove) {
            const replyRes = this.engine.playMove(replyMove.x, replyMove.y, replyMove.color);
            if (replyRes.captured && replyRes.captured.length > 0) {
              this.boardUI.sound.playCapture();
            } else {
              this.boardUI.sound.playStoneClack();
            }
            this.puzzleStepIndex += 1;
            this.boardUI.interactive = true;
            this.updateBoardStatusBar();
            this.puzzleFeedback = {
              type: 'info',
              text: `${replyMove.comment}<br><strong>ตาคุณเดินต่อเพื่อปิดฉากครับ!</strong>`
            };
            this.renderPuzzlePanel();
          }
        }, 480);
      } else {
        // ผู้เล่นเดินผิดพลาด -> แสดงการเดินสวนลงโทษของบอทพร้อมเหตุผล
        const sim = this.engine.simulateMove(x, y, this.engine.currentPlayer);
        if (!sim.valid) {
          this.boardUI.sound.playError();
          this.puzzleFeedback = { type: 'error', text: sim.message };
          this.renderPuzzlePanel();
          return;
        }

        this.engine.playMove(x, y, this.engine.currentPlayer);
        this.boardUI.sound.playError();
        this.puzzleStatus = 'wrong';

        const key = `${x},${y}`;
        const refutation = puzzle.refutations && puzzle.refutations[key];

        if (refutation && refutation.reply) {
          setTimeout(() => {
            this.engine.playMove(refutation.reply.x, refutation.reply.y, this.engine.currentPlayer);
            this.boardUI.sound.playStoneClack();
            this.boardUI.setMarkers([
              { x, y, type: 'bad', text: '✗' },
              { x: refutation.reply.x, y: refutation.reply.y, type: 'label', text: '!', color: '#dc2626' }
            ]);
            this.updateBoardStatusBar();
            this.puzzleFeedback = {
              type: 'error',
              text: `<strong>❌ ยังไม่ถูกต้องครับ:</strong> ${refutation.explanation}`
            };
            this.renderPuzzlePanel();
          }, 320);
        } else {
          this.boardUI.setMarkers([{ x, y, type: 'bad', text: '✗' }]);
          this.updateBoardStatusBar();
          this.puzzleFeedback = {
            type: 'error',
            text: `<strong>❌ ยังไม่ถูกต้องครับ:</strong> ${puzzle.defaultWrongExplanation}`
          };
          this.renderPuzzlePanel();
        }
      }
    }

    showPuzzleHint() {
      const puzzle = PUZZLES_DATA.find(p => p.id === this.currentPuzzleId);
      if (!puzzle) return;

      const nextExpected = this.puzzleActiveSequence[this.puzzleStepIndex] || puzzle.hintCoord;
      if (nextExpected) {
        this.boardUI.setMarkers([
          ...(puzzle.markers || []),
          { x: nextExpected.x, y: nextExpected.y, type: 'hint', text: '💡' }
        ]);
      }
      this.puzzleFeedback = {
        type: 'warn',
        text: `<strong>💡 คำใบ้:</strong> ${puzzle.hint} (ดูจุดที่มีสัญลักษณ์ 💡 บนกระดาน)`
      };
      this.renderPuzzlePanel();
    }

    playPuzzleSolution() {
      const puzzle = PUZZLES_DATA.find(p => p.id === this.currentPuzzleId);
      if (!puzzle) return;

      this.engine.loadPosition(puzzle.setup);
      this.puzzleStatus = 'solution';
      this.boardUI.interactive = false;

      const markers = [];
      const comments = [];

      puzzle.solutionSequence.forEach((mv, idx) => {
        this.engine.playMove(mv.x, mv.y, mv.color);
        markers.push({
          x: mv.x,
          y: mv.y,
          type: 'label',
          text: String(idx + 1)
        });
        const actor = mv.color === GoEngine.BLACK ? 'ดำ' : 'ขาว';
        comments.push(`<li><strong>ก้าวที่ ${idx + 1} (${actor} ${this.engine.coordToText(mv.x, mv.y)}):</strong> ${mv.comment}</li>`);
      });

      this.boardUI.setMarkers(markers);
      this.updateBoardStatusBar();
      this.puzzleFeedback = {
        type: 'info',
        text: `<strong>👁️ ลำดับเฉลยสมบูรณ์:</strong><ul style="margin-top:0.45rem;margin-left:1.2rem;">${comments.join('')}</ul>`
      };
      this.renderPuzzlePanel();
    }

    renderPuzzlePanel() {
      const container = document.getElementById('right-panel-content');
      const filtered = this.getFilteredPuzzles();
      const puzzle = PUZZLES_DATA.find(p => p.id === this.currentPuzzleId) || filtered[0];

      const catTabsHtml = PUZZLE_CATEGORIES.map(cat => {
        const active = cat.id === this.currentPuzzleCategory ? 'active' : '';
        return `<button class="cat-chip ${active}" data-puz-cat="${cat.id}">${cat.name}</button>`;
      }).join('');

      const puzzleBtnsHtml = filtered.map(item => {
        const solved = this.solvedPuzzles.has(item.id);
        const active = item.id === puzzle.id ? 'active' : '';
        return `
          <button class="selector-btn ${active}" data-puz-id="${item.id}">
            <span>ข้อ ${item.number}: ${item.title.split('(')[0].trim()}</span>
            <span class="done-mark">${solved ? '✓' : ''}</span>
          </button>
        `;
      }).join('');

      const diffClass = puzzle.difficulty.includes('ง่าย')
        ? 'badge-success'
        : puzzle.difficulty.includes('ปานกลาง')
          ? 'badge-gold'
          : 'badge-danger';

      const feedbackHtml = this.puzzleFeedback
        ? `<div class="feedback-banner ${this.puzzleFeedback.type}">${this.puzzleFeedback.text}</div>`
        : '';

      const currentIdxInAll = PUZZLES_DATA.findIndex(p => p.id === puzzle.id);
      const nextPuzzle = PUZZLES_DATA[(currentIdxInAll + 1) % PUZZLES_DATA.length];

      container.innerHTML = `
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <div class="panel-title">🧩 ข้อที่ ${puzzle.number}: ${puzzle.title}</div>
              <div class="panel-subtitle">หมวด: ${puzzle.categoryName} | แก้ได้แล้ว ${this.solvedPuzzles.size}/${PUZZLES_DATA.length} ข้อ</div>
            </div>
            <span class="badge ${diffClass}">${puzzle.difficulty}</span>
          </div>

          <div class="category-tabs">${catTabsHtml}</div>
          <div class="selector-grid">${puzzleBtnsHtml}</div>

          <div class="task-box">
            <strong>🎯 โจทย์ภารกิจ:</strong> ${puzzle.goal}
          </div>

          ${feedbackHtml}

          <div class="btn-row">
            <button class="btn btn-outline" id="btn-puz-reset">🔄 ลองข้อนี้ใหม่</button>
            <button class="btn btn-gold" id="btn-puz-hint">💡 ขอคำใบ้ (Hint)</button>
            <button class="btn btn-outline" id="btn-puz-solution">👁️ ดูเฉลยพร้อมคำอธิบาย</button>
            <button class="btn btn-primary" id="btn-puz-next">ข้อถัดไป (ข้อ ${nextPuzzle.number}) ➔</button>
          </div>
        </div>
      `;

      container.querySelectorAll('[data-puz-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.currentPuzzleCategory = btn.getAttribute('data-puz-cat');
          const list = this.getFilteredPuzzles();
          if (list.length > 0) {
            this.loadPuzzle(list[0].id);
          }
        });
      });

      container.querySelectorAll('[data-puz-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.loadPuzzle(btn.getAttribute('data-puz-id'));
        });
      });

      document.getElementById('btn-puz-reset').addEventListener('click', () => this.loadPuzzle(puzzle.id));
      document.getElementById('btn-puz-hint').addEventListener('click', () => this.showPuzzleHint());
      document.getElementById('btn-puz-solution').addEventListener('click', () => this.playPuzzleSolution());
      document.getElementById('btn-puz-next').addEventListener('click', () => this.loadPuzzle(nextPuzzle.id));
    }

    // =========================================================================
    // MODULE 3: SITUATIONAL GUIDE & JOSEKI EXPLORER (คัมภีร์สถานการณ์ 7 หัวข้อ)
    // =========================================================================
    loadSituation(sitIdx, optIdx = 0, seqStep = 1) {
      this.currentSituationIndex = Math.max(0, Math.min(SITUATIONS_DATA.length - 1, sitIdx));
      const sit = SITUATIONS_DATA[this.currentSituationIndex];
      this.selectedSituationOptIndex = Math.max(0, Math.min(sit.options.length - 1, optIdx));
      const opt = sit.options[this.selectedSituationOptIndex];

      this.situationSeqStep = Math.max(0, Math.min(opt.sequence.length, seqStep));

      this.engine.loadPosition(sit.setup);
      this.boardUI.interactive = true;

      // เล่นลำดับตาเดินตามขั้นที่เลือกไว้
      const markers = [];
      for (let i = 0; i < this.situationSeqStep; i++) {
        const mv = opt.sequence[i];
        this.engine.playMove(mv.x, mv.y, mv.color);
        markers.push({
          x: mv.x,
          y: mv.y,
          type: 'label',
          text: String(i + 1)
        });
      }

      // หากอยู่ที่ก้าว 0 (เริ่มต้น) ให้แสดงจุดตัวเลือก A, B, C บนกระดาน
      if (this.situationSeqStep === 0) {
        sit.options.forEach((o) => {
          markers.push({
            x: o.coord.x,
            y: o.coord.y,
            type: 'label',
            text: o.label,
            color: o.ratingType === 'best' ? '#0f766e' : o.ratingType === 'bad' ? '#dc2626' : '#1d4ed8'
          });
        });
      } else {
        // แสดงตัวเลือกอื่นที่ไม่ได้เลือกเป็นตัวอักษรจางๆ เพื่อเปรียบเทียบได้ง่าย
        sit.options.forEach((o, idx) => {
          if (idx !== this.selectedSituationOptIndex && this.engine.grid[o.coord.y][o.coord.x] === GoEngine.EMPTY) {
            markers.push({
              x: o.coord.x,
              y: o.coord.y,
              type: 'label',
              text: o.label,
              color: '#64748b'
            });
          }
        });
      }

      this.boardUI.setMarkers(markers);
      this.updateBoardStatusBar();
      this.renderSituationPanel();
    }

    handleSituationBoardClick(x, y) {
      const sit = SITUATIONS_DATA[this.currentSituationIndex];
      const clickedOptIdx = sit.options.findIndex(o => o.coord.x === x && o.coord.y === y);
      if (clickedOptIdx !== -1) {
        this.boardUI.sound.playStoneClack();
        const opt = sit.options[clickedOptIdx];
        this.loadSituation(this.currentSituationIndex, clickedOptIdx, opt.sequence.length);
      }
    }

    renderSituationPanel() {
      const container = document.getElementById('right-panel-content');
      const sit = SITUATIONS_DATA[this.currentSituationIndex];
      const selectedOpt = sit.options[this.selectedSituationOptIndex];

      const sitSelectorHtml = SITUATIONS_DATA.map((item, idx) => {
        const active = idx === this.currentSituationIndex ? 'active' : '';
        return `
          <button class="selector-btn ${active}" data-sit-idx="${idx}">
            <span>${item.title}</span>
          </button>
        `;
      }).join('');

      const optionsCardsHtml = sit.options.map((opt, idx) => {
        const isSelected = idx === this.selectedSituationOptIndex;
        const badgeClass = opt.ratingType === 'best'
          ? 'badge-success'
          : opt.ratingType === 'bad'
            ? 'badge-danger'
            : 'badge-gold';
        return `
          <div class="sit-option-card ${isSelected ? 'selected' : ''}" data-opt-idx="${idx}">
            <div class="sit-opt-left">
              <div class="sit-letter">${opt.label}</div>
              <div>
                <div style="font-weight: 700;">${opt.name}</div>
                <div style="font-size: 0.82rem; color: #57534e;">พิกัด ${this.engine.coordToText(opt.coord.x, opt.coord.y)}</div>
              </div>
            </div>
            <span class="badge ${badgeClass}">${opt.rating}</span>
          </div>
        `;
      }).join('');

      const currentNote = this.situationSeqStep === 0
        ? 'สถานะตั้งต้น: คลิกที่จุด A, B, C บนกระดาน หรือกดปุ่มด้านล่างเพื่อดูการเดินหมากแต่ละก้าว'
        : selectedOpt.sequence[this.situationSeqStep - 1].note;

      container.innerHTML = `
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <div class="panel-title">🧭 ${sit.title}</div>
              <div class="panel-subtitle">หมวด: ${sit.category}</div>
            </div>
            <span class="badge badge-primary">กระดาน ${sit.boardSize}×${sit.boardSize}</span>
          </div>

          <div class="selector-grid">${sitSelectorHtml}</div>

          <div class="task-box">
            <strong>📌 สถานการณ์:</strong> ${sit.summary}
          </div>

          <div class="situation-options">${optionsCardsHtml}</div>

          <div class="sequence-player">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <strong>🎬 ลำดับการเดินของทางเลือก ${selectedOpt.label} (ก้าวที่ ${this.situationSeqStep}/${selectedOpt.sequence.length})</strong>
            </div>
            <p style="font-size:0.93rem; color:#0f766e; font-weight:600; margin-bottom:0.65rem;">${currentNote}</p>
            <div class="btn-row" style="margin-top:0.2rem;">
              <button class="btn btn-outline" id="btn-seq-start" ${this.situationSeqStep === 0 ? 'disabled' : ''}>⏮ รูปตั้งต้น (แสดง A,B,C)</button>
              <button class="btn btn-outline" id="btn-seq-prev" ${this.situationSeqStep === 0 ? 'disabled' : ''}>◀ ก้าวที่แล้ว</button>
              <button class="btn btn-primary" id="btn-seq-next" ${this.situationSeqStep >= selectedOpt.sequence.length ? 'disabled' : ''}>ก้าวถัดไป ▶</button>
              <button class="btn btn-gold" id="btn-seq-end" ${this.situationSeqStep >= selectedOpt.sequence.length ? 'disabled' : ''}>⏭ ดูจนจบชุด</button>
            </div>
          </div>

          <div class="lesson-body" style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid var(--border-color);">
            <h4 style="color:#1e293b; margin-bottom:0.4rem;">📖 วิเคราะห์แนวทาง ${selectedOpt.name}:</h4>
            ${selectedOpt.explanation}
          </div>
        </div>
      `;

      container.querySelectorAll('[data-sit-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-sit-idx'), 10);
          this.loadSituation(idx, 0, 0);
        });
      });

      container.querySelectorAll('[data-opt-idx]').forEach(card => {
        card.addEventListener('click', () => {
          const idx = parseInt(card.getAttribute('data-opt-idx'), 10);
          const opt = sit.options[idx];
          this.boardUI.sound.playStoneClack();
          this.loadSituation(this.currentSituationIndex, idx, opt.sequence.length);
        });
      });

      document.getElementById('btn-seq-start').addEventListener('click', () => {
        this.loadSituation(this.currentSituationIndex, this.selectedSituationOptIndex, 0);
      });
      document.getElementById('btn-seq-prev').addEventListener('click', () => {
        this.loadSituation(this.currentSituationIndex, this.selectedSituationOptIndex, this.situationSeqStep - 1);
      });
      document.getElementById('btn-seq-next').addEventListener('click', () => {
        this.boardUI.sound.playStoneClack();
        this.loadSituation(this.currentSituationIndex, this.selectedSituationOptIndex, this.situationSeqStep + 1);
      });
      document.getElementById('btn-seq-end').addEventListener('click', () => {
        this.boardUI.sound.playStoneClack();
        this.loadSituation(this.currentSituationIndex, this.selectedSituationOptIndex, selectedOpt.sequence.length);
      });
    }

    // =========================================================================
    // MODULE 4: PRACTICE BOARD & AI COACH (กระดานซ้อมมือ & โค้ช AI)
    // =========================================================================
    initPracticeGame() {
      const { size, mode, handicap } = this.practiceConfig;
      const komi = handicap > 0 ? 0.5 : 6.5;
      this.engine.reset(size, komi);
      this.boardUI.scoringMode = false;
      this.boardUI.interactive = true;
      this.boardUI.clearMarkers();
      this.coachRecommendations = [];
      this.aiThinking = false;

      // วางหมากต่อ (Handicap Stones) หากตั้งค่าไว้
      if (handicap >= 2) {
        const stars = this.engine.getStarPoints();
        const handicapCoords = stars.slice(0, Math.min(handicap, stars.length));
        for (const pt of handicapCoords) {
          this.engine.grid[pt.y][pt.x] = GoEngine.BLACK;
        }
        this.engine.currentPlayer = GoEngine.WHITE;
      }

      this.practiceFeedback = {
        tone: 'info',
        html: 'เริ่มกระดานใหม่เรียบร้อย! คุณสามารถคลิกวางหมากบนกระดาน หรือกดปุ่ม <strong>"🎓 ขอคำแนะนำจากโค้ช"</strong> เพื่อให้ AI วิเคราะห์ 3 จุดน่าเดินที่สุดในตอนนี้ได้ตลอดเวลาครับ'
      };

      this.updateBoardStatusBar();
      this.boardUI.render();
      this.renderPracticePanel();

      // หากผู้เล่นเลือกถือหมากขาว (หรือตั้งหมากต่อแล้วเป็นตาของบอท) ให้บอทเดินทันที
      const aiColor = mode === 'ai_black' ? GoEngine.WHITE : mode === 'ai_white' ? GoEngine.BLACK : null;
      if (aiColor && this.engine.currentPlayer === aiColor) {
        this.triggerAIMove();
      }
    }

    handlePracticeBoardClick(x, y) {
      if (this.aiThinking) return;

      // หากอยู่ในโหมดนับแต้ม ให้คลิกเพื่อสลับสถานะหมากตาย (Dead Stones)
      if (this.boardUI.scoringMode) {
        this.engine.toggleDeadGroup(x, y);
        this.boardUI.render();
        this.renderPracticePanel();
        return;
      }

      if (this.engine.gameOver) return;

      const playerColor = this.engine.currentPlayer;
      const zonesBefore = this.coach.analyzeBoardZones(playerColor);
      const clickedZone = zonesBefore.find(z => x >= z.xMin && x <= z.xMax && y >= z.yMin && y <= z.yMax);

      const res = this.engine.playMove(x, y, playerColor);
      if (!res.valid) {
        this.boardUI.sound.playError();
        this.practiceFeedback = {
          tone: 'error',
          html: `❌ <strong>วางไม่ได้:</strong> ${res.message}`
        };
        this.renderPracticePanel();
        return;
      }

      if (res.captured && res.captured.length > 0) {
        this.boardUI.sound.playCapture();
      } else {
        this.boardUI.sound.playStoneClack();
      }

      this.coachRecommendations = [];
      this.boardUI.clearMarkers();
      this.practiceFeedback = this.coach.analyzePlayerMove(res, x, y, playerColor);

      // แจ้งเตือนเพิ่มเติมหากผู้เล่นวางหมากซ้ำในโซนที่เป็นบ้านปลอดภัย 100% แล้ว
      if (clickedZone && clickedZone.status === 'safe_won' && (!res.captured || res.captured.length === 0)) {
        this.practiceFeedback.html += `<br>⚠️ <strong>คำเตือนจากโค้ช:</strong> โซน <em>"${clickedZone.name}"</em> เป็นบ้านที่รอดชีวิตปลอดภัย 100% แล้ว การวางหมากซ้ำในบ้านตัวเองจะลดพื้นที่ว่างลงและเสีย 1 แต้มฟรีครับ`;
        if (this.practiceFeedback.tone === 'good') {
          this.practiceFeedback.tone = 'warn';
        }
      }
      this.updateBoardStatusBar();
      this.boardUI.render();
      this.renderPracticePanel();

      // ตรวจสอบว่าต้องให้ AI เดินสวนหรือไม่
      const { mode } = this.practiceConfig;
      const aiColor = mode === 'ai_black' ? GoEngine.WHITE : mode === 'ai_white' ? GoEngine.BLACK : null;
      if (aiColor && this.engine.currentPlayer === aiColor && !this.engine.gameOver) {
        this.triggerAIMove();
      }
    }

    triggerAIMove() {
      this.aiThinking = true;
      this.boardUI.interactive = false;

      setTimeout(() => {
        const aiColor = this.engine.currentPlayer;
        const aiDecision = this.coach.chooseAIMove(aiColor, this.practiceConfig.difficulty);

        this.aiThinking = false;
        this.boardUI.interactive = true;

        if (aiDecision.pass) {
          const passRes = this.engine.pass(aiColor);
          this.practiceFeedback = {
            tone: 'warn',
            html: `🏳️ <strong>บอท AI ขอผ่าน (Pass):</strong> ${aiDecision.reason}${passRes.gameOver ? '<br><strong>จบเกมแล้ว! ดูสรุปคะแนนด้านล่างได้เลยครับ</strong>' : ''}`
          };
          if (passRes.gameOver) {
            this.boardUI.scoringMode = true;
          }
        } else {
          const res = this.engine.playMove(aiDecision.x, aiDecision.y, aiColor);
          if (res.captured && res.captured.length > 0) {
            this.boardUI.sound.playCapture();
          } else {
            this.boardUI.sound.playStoneClack();
          }
          const aiName = aiColor === GoEngine.BLACK ? '⚫ AI (หมากดำ)' : '⚪ AI (หมากขาว)';
          this.practiceFeedback = {
            tone: this.practiceFeedback.tone,
            html: `${this.practiceFeedback.html}<hr style="margin:0.45rem 0;border:none;border-top:1px solid rgba(0,0,0,0.1);">🤖 <strong>${aiName} วางที่ ${aiDecision.coordText}:</strong> ${aiDecision.reason}`
          };
        }

        this.updateBoardStatusBar();
        this.boardUI.render();
        this.renderPracticePanel();
      }, 360);
    }

    requestCoachHint() {
      if (this.engine.gameOver) return;
      const recs = this.coach.getCoachRecommendations(this.engine.currentPlayer, 3);
      this.coachRecommendations = recs;

      const markers = recs.map((r, idx) => ({
        x: r.x,
        y: r.y,
        type: 'label',
        text: String(idx + 1),
        color: idx === 0 ? '#0f766e' : idx === 1 ? '#1d4ed8' : '#d97706'
      }));

      this.boardUI.setMarkers(markers);
      this.renderPracticePanel();
    }

    handlePracticePass() {
      if (this.aiThinking || this.engine.gameOver) return;
      const res = this.engine.pass(this.engine.currentPlayer);
      this.coachRecommendations = [];
      this.boardUI.clearMarkers();

      if (res.gameOver) {
        this.boardUI.scoringMode = true;
        this.practiceFeedback = {
          tone: 'success',
          html: '🏁 <strong>ทั้งสองฝ่ายขอผ่านครบ 2 ครั้ง จบเกมแล้ว!</strong> คุณสามารถคลิกที่กลุ่มหมากที่ตายแล้วบนกระดานเพื่อทำเครื่องหมาย X ก่อนดูคะแนนสุทธิได้ครับ'
        };
        this.updateBoardStatusBar();
        this.boardUI.render();
        this.renderPracticePanel();
        return;
      }

      this.practiceFeedback = {
        tone: 'info',
        html: 'คุณเลือก <strong>"ขอผ่าน (Pass)"</strong> หากคู่แข่งขอผ่านตาม เกมจะจบและเข้าสู่การนับแต้มครับ'
      };
      this.updateBoardStatusBar();
      this.boardUI.render();
      this.renderPracticePanel();

      const { mode } = this.practiceConfig;
      const aiColor = mode === 'ai_black' ? GoEngine.WHITE : mode === 'ai_white' ? GoEngine.BLACK : null;
      if (aiColor && this.engine.currentPlayer === aiColor) {
        this.triggerAIMove();
      }
    }

    handlePracticeUndo() {
      if (this.aiThinking) return;
      const { mode } = this.practiceConfig;
      // หากเล่นกับ AI ให้ย้อน 2 ตา (ตาของ AI และตาของผู้เล่น)
      if (mode !== 'free' && this.engine.history.length >= 2) {
        this.engine.undo();
        this.engine.undo();
      } else {
        this.engine.undo();
      }
      this.boardUI.scoringMode = false;
      this.coachRecommendations = [];
      this.boardUI.clearMarkers();
      this.updateBoardStatusBar();
      this.boardUI.render();
      this.renderPracticePanel();
    }

    renderPracticePanel() {
      const container = document.getElementById('right-panel-content');
      const scoreData = this.engine.calculateScore();

      const useFinalScore = this.boardUI.scoringMode || this.engine.gameOver;
      const bTotal = useFinalScore ? scoreData.blackScore : scoreData.blackEstimatedScore;
      const wTotal = useFinalScore ? scoreData.whiteScore : scoreData.whiteEstimatedScore;
      const sumScores = Math.max(1, bTotal + wTotal);
      const bPercent = Math.max(12, Math.min(88, Math.round((bTotal / sumScores) * 100)));
      const wPercent = 100 - bPercent;

      const leadDiff = Math.abs(bTotal - wTotal).toFixed(1);
      const leaderText = bTotal > wTotal
        ? `⚫ หมากดำนำอยู่ +${leadDiff} แต้ม`
        : `⚪ หมากขาวนำอยู่ +${leadDiff} แต้ม`;

      const recsHtml = this.coachRecommendations.length > 0
        ? `
          <div class="coach-rec-list">
            <div style="font-weight: 700; font-size: 0.95rem; color: #0f766e; margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: space-between;">
              <span>🎯 คำแนะนำจากโค้ช AI (จุดน่าเดิน &amp; เจตนาการเดิน):</span>
              <span style="font-size: 0.78rem; font-weight: 500; color: #64748b;">วิเคราะห์ตามหลักวิชาหมากล้อม</span>
            </div>
            ${this.coachRecommendations.map((r, idx) => `
              <div class="coach-rec-item" data-rec-x="${r.x}" data-rec-y="${r.y}">
                <div class="coach-rank">${idx + 1}</div>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; flex-wrap: wrap; gap: 0.25rem;">
                    <span style="font-weight: 700; color: #0f766e;">
                      จุดแนะนำอันดับ ${idx + 1}: พิกัด ${r.coordText}
                    </span>
                    <span class="coach-intent-pill ${r.intent || 'positional'}">${r.intentTag || '🧭 วางสมดุล'}</span>
                  </div>
                  <div style="font-size: 0.88rem; color: #1e293b; margin-bottom: 0.25rem;">
                    <strong>เป้าหมาย:</strong> ${r.purposeDetail || r.reason}
                  </div>
                  <div style="font-size: 0.82rem; color: #64748b;">
                    ${r.reason} <span style="color: #0f766e; font-weight: 600;">(คลิกเพื่อวางหมากที่จุดนี้)</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `
        : '';

      const zones = this.coach.analyzeBoardZones(this.engine.currentPlayer);
      const zonesHtml = `
        <div class="zones-summary-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.4rem;">
            <span style="font-weight: 700; font-size: 0.95rem; color: #1e293b;">
              🗺️ วิเคราะห์สถานการณ์แต่ละโซนกระดาน (Zone &amp; Territory Status)
            </span>
            <span style="font-size: 0.8rem; color: #64748b;">
              มุมมองฝ่าย${this.engine.currentPlayer === GoEngine.BLACK ? '⚫ ดำ' : '⚪ ขาว'}
            </span>
          </div>
          <div class="zone-grid">
            ${zones.map(z => `
              <div class="zone-card ${z.badgeClass}">
                <div class="zone-card-header">
                  <span class="zone-name">${z.name}</span>
                  <span class="zone-badge ${z.badgeClass}">${z.icon} ${z.statusText}</span>
                </div>
                <div class="zone-advice">${z.advice}</div>
                <div class="zone-stats">
                  <span>หมากฝ่ายเรา: ${z.friendlyStones} (ตาจริง: ${z.friendlyRealEyes})</span>
                  <span>หมากคู่แข่ง: ${z.enemyStones}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const bannerClass = this.practiceFeedback.tone === 'danger' || this.practiceFeedback.tone === 'error'
        ? 'error'
        : this.practiceFeedback.tone === 'warn'
          ? 'warn'
          : this.practiceFeedback.tone === 'success'
            ? 'success'
            : 'info';

      container.innerHTML = `
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <div class="panel-title">⚔️ กระดานซ้อมมือ & ผู้ช่วยโค้ช AI</div>
              <div class="panel-subtitle">ฝึกเดินหมากจริงพร้อมระบบวิเคราะห์จุดน่าเดินและประเมินพื้นที่เรียลไทม์</div>
            </div>
            <span class="badge badge-primary">เดินแล้ว ${this.engine.moveHistory.length} ตา</span>
          </div>

          <div class="settings-bar">
            <div class="setting-group">
              <label>ขนาดกระดาน</label>
              <select id="prac-size">
                <option value="9" ${this.practiceConfig.size === 9 ? 'selected' : ''}>9×9 (แนะนำมือใหม่ จบไว)</option>
                <option value="13" ${this.practiceConfig.size === 13 ? 'selected' : ''}>13×13 (ระดับกลาง)</option>
                <option value="19" ${this.practiceConfig.size === 19 ? 'selected' : ''}>19×19 (มาตรฐานสากล)</option>
              </select>
            </div>
            <div class="setting-group">
              <label>รูปแบบการเล่น</label>
              <select id="prac-mode">
                <option value="ai_black" ${this.practiceConfig.mode === 'ai_black' ? 'selected' : ''}>แข่งกับ AI (เราถือหมากดำ)</option>
                <option value="ai_white" ${this.practiceConfig.mode === 'ai_white' ? 'selected' : ''}>แข่งกับ AI (เราถือหมากขาว)</option>
                <option value="free" ${this.practiceConfig.mode === 'free' ? 'selected' : ''}>วางหมากอิสระ 2 ฝ่าย (ศึกษาเอง)</option>
              </select>
            </div>
            <div class="setting-group">
              <label>ระดับความยาก AI</label>
              <select id="prac-diff">
                <option value="beginner" ${this.practiceConfig.difficulty === 'beginner' ? 'selected' : ''}>ระดับเริ่มต้น (ออมมือ)</option>
                <option value="intermediate" ${this.practiceConfig.difficulty === 'intermediate' ? 'selected' : ''}>ระดับกลาง (มาตรฐาน)</option>
                <option value="advanced" ${this.practiceConfig.difficulty === 'advanced' ? 'selected' : ''}>ระดับเข้มข้น (อ่านหมากคม)</option>
              </select>
            </div>
            <div class="setting-group">
              <label>หมากต่อ (Handicap)</label>
              <select id="prac-handicap">
                <option value="0" ${this.practiceConfig.handicap === 0 ? 'selected' : ''}>ไม่ต่อหมาก (โคมิ 6.5)</option>
                <option value="2" ${this.practiceConfig.handicap === 2 ? 'selected' : ''}>ดำต่อ 2 เม็ด</option>
                <option value="3" ${this.practiceConfig.handicap === 3 ? 'selected' : ''}>ดำต่อ 3 เม็ด</option>
                <option value="4" ${this.practiceConfig.handicap === 4 ? 'selected' : ''}>ดำต่อ 4 เม็ด</option>
              </select>
            </div>
          </div>

          <div class="score-meter-card">
            <div style="display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:0.92rem;">
              <span>📊 ประเมินคะแนนรวม (${useFinalScore ? 'นับแต้มจบเกม' : 'คาดการณ์ระหว่างเล่น'})</span>
              <span style="color:#0f766e;">${leaderText}</span>
            </div>
            <div class="score-bar-track">
              <div class="score-bar-black" style="width:${bPercent}%"></div>
              <div class="score-bar-white" style="width:${wPercent}%"></div>
            </div>
            <div class="score-details-row">
              <span>⚫ <strong>ดำ: ${bTotal.toFixed(1)} แต้ม</strong> (พื้นที่ ${useFinalScore ? scoreData.blackTerritory : scoreData.blackInfluenceTerritory} + เชลย ${scoreData.blackCapturesTotal})</span>
              <span>⚪ <strong>ขาว: ${wTotal.toFixed(1)} แต้ม</strong> (พื้นที่ ${useFinalScore ? scoreData.whiteTerritory : scoreData.whiteInfluenceTerritory} + เชลย ${scoreData.whiteCapturesTotal} + โคมิ ${scoreData.komi})</span>
            </div>
          </div>

          <div class="feedback-banner ${bannerClass}">
            ${this.practiceFeedback.html}
          </div>

          <div class="btn-row">
            <button class="btn btn-gold" id="btn-prac-coach" ${this.engine.gameOver ? 'disabled' : ''}>🎓 ขอคำแนะนำจากโค้ช (3 จุดน่าเดิน)</button>
            <button class="btn btn-outline" id="btn-prac-undo" ${this.engine.history.length === 0 ? 'disabled' : ''}>↩ ย้อนกลับ (Undo)</button>
            <button class="btn btn-outline" id="btn-prac-pass" ${this.engine.gameOver ? 'disabled' : ''}>🏳️ ขอผ่าน (Pass)</button>
            <button class="btn btn-outline" id="btn-prac-score">${this.boardUI.scoringMode ? '▶ กลับไปเดินต่อ' : '🧮 โหมดนับแต้ม'}</button>
            <button class="btn btn-primary" id="btn-prac-new">🔄 เริ่มกระดานใหม่</button>
          </div>

          ${recsHtml}
          ${zonesHtml}
        </div>
      `;

      // Bind Settings
      document.getElementById('prac-size').addEventListener('change', (e) => {
        this.practiceConfig.size = parseInt(e.target.value, 10);
        this.initPracticeGame();
      });
      document.getElementById('prac-mode').addEventListener('change', (e) => {
        this.practiceConfig.mode = e.target.value;
        this.initPracticeGame();
      });
      document.getElementById('prac-diff').addEventListener('change', (e) => {
        this.practiceConfig.difficulty = e.target.value;
      });
      document.getElementById('prac-handicap').addEventListener('change', (e) => {
        this.practiceConfig.handicap = parseInt(e.target.value, 10);
        this.initPracticeGame();
      });

      // Bind Action Buttons
      document.getElementById('btn-prac-coach').addEventListener('click', () => this.requestCoachHint());
      document.getElementById('btn-prac-undo').addEventListener('click', () => this.handlePracticeUndo());
      document.getElementById('btn-prac-pass').addEventListener('click', () => this.handlePracticePass());
      document.getElementById('btn-prac-score').addEventListener('click', () => {
        this.boardUI.scoringMode = !this.boardUI.scoringMode;
        this.updateBoardStatusBar();
        this.boardUI.render();
        this.renderPracticePanel();
      });
      document.getElementById('btn-prac-new').addEventListener('click', () => this.initPracticeGame());

      container.querySelectorAll('[data-rec-x]').forEach(item => {
        item.addEventListener('click', () => {
          const rx = parseInt(item.getAttribute('data-rec-x'), 10);
          const ry = parseInt(item.getAttribute('data-rec-y'), 10);
          this.handlePracticeBoardClick(rx, ry);
        });
      });
    }

    // =========================================================================
    // MODULE 5: GLOSSARY & PROVERBS (พจนานุกรมคำศัพท์และสุภาษิตหมากล้อม)
    // =========================================================================
    renderGlossaryView(filterText = '') {
      const container = document.getElementById('glossary-full-view');
      const query = filterText.trim().toLowerCase();

      const filtered = GLOSSARY_ITEMS.filter(item =>
        !query ||
        item.term.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query)
      );

      container.innerHTML = `
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <div class="panel-title">📖 คัมภีร์คำศัพท์และสุภาษิตหมากล้อม (Go Glossary & Proverbs)</div>
              <div class="panel-subtitle">รวบรวมคำศัพท์สำคัญตั้งแต่ระดับเริ่มต้นจนถึงระดับดั้ง พร้อมหลักคิดและสุภาษิตประจำกระดาน</div>
            </div>
            <span class="badge badge-primary">${filtered.length} รายการ</span>
          </div>

          <input
            type="text"
            id="glossary-search-input"
            class="glossary-search"
            placeholder="🔍 ค้นหาคำศัพท์ เช่น อาตาริ, โจเซกิ, เซนเต้, ขั้นบันได, งับกลับ, สุภาษิต..."
            value="${filterText.replace(/"/g, '&quot;')}"
          />

          <div class="glossary-grid">
            ${filtered.map(item => `
              <div class="glossary-card">
                <div style="margin-bottom:0.25rem;">
                  <span class="badge badge-gold" style="font-size:0.72rem;">${item.category}</span>
                </div>
                <div class="glossary-term">${item.term}</div>
                <div class="glossary-desc">${item.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const input = document.getElementById('glossary-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        input.addEventListener('input', (e) => {
          this.renderGlossaryView(e.target.value);
        });
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.goAcademyApp = new GoAcademyApp();
  });
})();
