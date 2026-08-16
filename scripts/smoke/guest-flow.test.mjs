// 게스트 모드(localStorage) 전체 플로우 스모크 테스트
// 실행: npm run test:guest
// 1) 데이터 레이어(localStorage.ts) 직접 검증
// 2) 앱 실제 경로(api/goals + api/attempts, VITE_SINGLE_FILE 로컬 모드) 검증
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const m = await import('./bundles/localStorage.bundle.mjs');
const { localGoals, localAttempts, calculateStreak } = m;

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
}

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

// ── 1부: 데이터 레이어 ──────────────────────────────

// 목표 생성/조회
const goal = localGoals.create({ name: '운동하기', first_action: '운동화 신기', countdown_seconds: 300 });
check('목표 생성', goal.id && goal.name === '운동하기');
check('목표 조회', localGoals.getAll().length === 1);

// 7일 연속 성공 → streak 7
for (let i = 6; i >= 0; i--) {
  localAttempts.create(goal.id, { attempted_date: daysAgo(i), success: true });
}
let s = calculateStreak(goal.id);
check('7일 연속 streak', s.current === 7, `current=${s.current}, best=${s.best}`);

// 실패 기록 → streak 리셋
const goal2 = localGoals.create({ name: '독서하기', first_action: '책 펴기', countdown_seconds: 300 });
localAttempts.create(goal2.id, { attempted_date: daysAgo(2), success: true });
localAttempts.create(goal2.id, { attempted_date: daysAgo(1), success: false, failure_reason: 'tired' });
localAttempts.create(goal2.id, { attempted_date: daysAgo(0), success: true });
s = calculateStreak(goal2.id);
check('실패 후 streak 리셋', s.current === 1 && s.best >= 1, `current=${s.current}, best=${s.best}`);

// 부활카드 사용 → streak 복구
localGoals.update(goal2.id, { revival_cards: 1 });
const revived = localAttempts.useRevival(goal2.id, daysAgo(1));
const s2 = calculateStreak(goal2.id);
check('부활카드 사용 → streak 복구', revived && s2.current === 3, `used=${revived}, current=${s2.current}`);

// 면제(exempt): 오늘 시도가 없는 목표에만 면제가 붙는다
const goal3 = localGoals.create({ name: '물 마시기', first_action: '컵 들기', countdown_seconds: 300 });
m.createExemption(daysAgo(0), 'sick');
check('오늘 면제 처리 (미시도 목표)', m.isTodayExempt() === true);
check('월 면제 횟수 집계', m.getMonthlyExemptionCount() >= 1, `count=${m.getMonthlyExemptionCount()}`);
m.cancelExemption(daysAgo(0));
check('면제 취소', m.isTodayExempt() === false);

// 목표 수정/삭제 (소프트 삭제: is_active=false, 앱단에서 필터링)
localGoals.update(goal.id, { name: '아침 운동' });
check('목표 수정', localGoals.getById(goal.id).name === '아침 운동');
localGoals.delete(goal3.id);
check('목표 소프트 삭제', localGoals.getById(goal3.id)?.is_active === false);
check('활성 목표 필터링', localGoals.getAll().filter((g) => g.is_active).length === 2);

// ── 2부: 앱 실제 경로 (api 레이어, 로컬 모드) ──────────

store.clear();
const goalsApi = await import('./bundles/api-goals.bundle.mjs');
const attemptsApi = await import('./bundles/api-attempts.bundle.mjs');

const apiGoal = await goalsApi.createGoal({ name: '운동하기', first_action: '운동화 신기', countdown_seconds: 300 });
for (let i = 6; i >= 0; i--) {
  await attemptsApi.createAttempt(apiGoal.id, { attempted_date: daysAgo(i), success: true });
}
const apiGoals = await goalsApi.getGoals();
const g = apiGoals.find((x) => x.id === apiGoal.id);
check('API 경로: 7일 streak', g.current_streak === 7, `streak=${g.current_streak}`);
check('API 경로: 부활카드 지급', g.revival_cards === 1, `revival_cards=${g.revival_cards}`);

// ── 결과 ──────────────────────────────────────────

let fail = 0;
for (const r of results) {
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
  if (!r.pass) fail++;
}
console.log(`\n${results.length - fail}/${results.length} 통과`);
process.exit(fail ? 1 : 0);
