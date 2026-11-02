// 화면에 보이는 글자 만들기 (숫자·요일·학년)

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

export function won(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/** 7~12 → 중1~고3 */
export function gradeLabel(grade: number): string {
  if (grade >= 7 && grade <= 9) return `중${grade - 6}`;
  if (grade >= 10 && grade <= 12) return `고${grade - 9}`;
  return '범위 밖';
}

/** 같은 시간대 요일을 묶는다: "월·수 17:00–19:00" */
export function scheduleLabel(schedules: { weekday: number; startTime: string; endTime: string }[]): string {
  const groups = new Map<string, number[]>();
  for (const s of schedules) {
    const key = `${s.startTime}–${s.endTime}`;
    groups.set(key, [...(groups.get(key) ?? []), s.weekday]);
  }
  return [...groups.entries()].map(([time, days]) => `${days.map((d) => WEEKDAY[d]).join('·')} ${time}`).join(', ');
}
