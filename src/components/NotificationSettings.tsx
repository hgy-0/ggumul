import { useState } from 'react';
import { DAY_LABELS, ALL_DAYS, WEEKDAYS, WEEKEND } from '@/constants/date';
import NotificationGuide from '@/components/NotificationGuide';

interface ScheduleEntry {
  hour: number;
  minute: number;
  days: number[];
}

const PRESETS: { label: string; emoji: string; hour: number; minute: number }[] = [
  { label: '아침', emoji: '🌅', hour: 7, minute: 0 },
  { label: '점심', emoji: '☀️', hour: 13, minute: 0 },
  { label: '저녁', emoji: '🌆', hour: 19, minute: 0 },
  { label: '밤', emoji: '🌙', hour: 22, minute: 0 },
];

function arraysEqual(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

const formatTime = (h: number, m: number) =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

interface NotificationSettingsProps {
  notificationDays: number[];
  setNotificationDays: React.Dispatch<React.SetStateAction<number[]>>;
  schedules: ScheduleEntry[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
}

export default function NotificationSettings({
  notificationDays,
  setNotificationDays,
  schedules,
  setSchedules,
}: NotificationSettingsProps) {
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customHour, setCustomHour] = useState(9);
  const [customMinute, setCustomMinute] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addSchedule = (hour: number, minute: number) => {
    if (schedules.some((s) => s.hour === hour && s.minute === minute)) return;
    setSchedules([...schedules, { hour, minute, days: notificationDays }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const toggleNotificationDay = (day: number) => {
    setNotificationDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  };

  const setGlobalDayPreset = (preset: 'all' | 'weekdays' | 'weekend') => {
    if (preset === 'all') setNotificationDays([...ALL_DAYS]);
    else if (preset === 'weekdays') setNotificationDays([...WEEKDAYS]);
    else setNotificationDays([...WEEKEND]);
  };

  return (
    <div className="space-y-5 pl-1">
      {/* 요일 선택 */}
      <div>
        <p className="text-xs text-muted mb-2.5">어떤 요일에 알려드릴까요?</p>

        {/* 프리셋: 매일 / 평일 / 주말 */}
        <div className="flex items-center gap-2 mb-3">
          {([
            { label: '매일', key: 'all' as const, match: ALL_DAYS },
            { label: '평일', key: 'weekdays' as const, match: WEEKDAYS },
            { label: '주말', key: 'weekend' as const, match: WEEKEND },
          ]).map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => setGlobalDayPreset(preset.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                arraysEqual(notificationDays, preset.match)
                  ? 'bg-primary-500/20 text-primary-500 border border-primary-500/40'
                  : 'bg-bg text-muted border border-border hover:text-text'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* 개별 요일 토글 */}
        <div className="flex gap-1.5">
          {DAY_LABELS.map((label, dayIdx) => (
            <button
              key={dayIdx}
              type="button"
              onClick={() => toggleNotificationDay(dayIdx)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                notificationDays.includes(dayIdx)
                  ? 'bg-primary-500/25 text-primary-500 border border-primary-500/40'
                  : 'bg-surface text-muted border border-border hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 시간 선택 */}
      <div>
        <p className="text-xs text-muted mb-2.5">몇 시에 알려드릴까요?</p>

        {/* 프리셋 카드 */}
        <div className="grid grid-cols-2 gap-2.5">
          {PRESETS.map((preset) => {
            const isAdded = schedules.some(
              (s) => s.hour === preset.hour && s.minute === preset.minute,
            );
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (isAdded) {
                    const idx = schedules.findIndex(
                      (s) => s.hour === preset.hour && s.minute === preset.minute,
                    );
                    if (idx >= 0) removeSchedule(idx);
                  } else {
                    addSchedule(preset.hour, preset.minute);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                  isAdded
                    ? 'bg-primary-500/15 border border-primary-500/40 ring-1 ring-primary-500/20'
                    : 'bg-surface border border-border hover:border-border'
                }`}
              >
                <span className="text-xl">{preset.emoji}</span>
                <div className="flex flex-col items-start">
                  <span className={`text-sm font-semibold ${isAdded ? 'text-primary-500' : 'text-text'}`}>
                    {preset.label}
                  </span>
                  <span className={`text-xs font-mono ${isAdded ? 'text-primary-500/70' : 'text-muted'}`}>
                    {formatTime(preset.hour, preset.minute)}
                  </span>
                </div>
                {isAdded && (
                  <svg className="ml-auto text-primary-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 직접 시간 추가 */}
      <div>
        {!showCustomTime ? (
          <button
            type="button"
            onClick={() => setShowCustomTime(true)}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl border border-dashed border-border text-muted hover:border-primary-500/40 hover:text-primary-500 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="text-sm font-medium">직접 시간 추가</span>
          </button>
        ) : (
          <div className="rounded-2xl border border-border bg-bg/40 p-3.5">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <div className="flex items-center rounded-lg bg-surface border border-border overflow-hidden">
                <select
                  value={customHour}
                  onChange={(e) => setCustomHour(Number(e.target.value))}
                  className="bg-transparent text-center text-base font-mono font-semibold text-text py-2.5 px-3 appearance-none outline-none cursor-pointer"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-base font-semibold text-muted">:</span>
              <div className="flex items-center rounded-lg bg-surface border border-border overflow-hidden">
                <select
                  value={customMinute}
                  onChange={(e) => setCustomMinute(Number(e.target.value))}
                  className="bg-transparent text-center text-base font-mono font-semibold text-text py-2.5 px-3 appearance-none outline-none cursor-pointer"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCustomTime(false)}
                className="flex-1 py-2 rounded-xl bg-surface text-muted text-sm font-medium hover:bg-bg transition-colors border border-border"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  addSchedule(customHour, customMinute);
                  setShowCustomTime(false);
                }}
                className="flex-1 py-2 rounded-xl bg-primary-500/20 text-primary-500 text-sm font-semibold hover:bg-primary-500/30 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 등록된 알림 시간 목록 */}
      {schedules.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted">등록된 알림</p>
          <div className="space-y-1.5">
            {schedules
              .slice()
              .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
              .map((schedule) => {
                const originalIdx = schedules.findIndex(
                  (s) => s.hour === schedule.hour && s.minute === schedule.minute,
                );
                const isEditing = editingIndex === originalIdx;

                if (isEditing) {
                  return (
                    <div
                      key={`${schedule.hour}-${schedule.minute}-edit`}
                      className="rounded-xl border border-primary-500/40 bg-primary-500/5 p-3.5"
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-3">
                        <div className="flex items-center rounded-lg bg-surface border border-border overflow-hidden">
                          <select
                            value={customHour}
                            onChange={(e) => setCustomHour(Number(e.target.value))}
                            className="bg-transparent text-center text-base font-mono font-semibold text-text py-2.5 px-3 appearance-none outline-none cursor-pointer"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>
                                {String(i).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <span className="text-base font-semibold text-muted">:</span>
                        <div className="flex items-center rounded-lg bg-surface border border-border overflow-hidden">
                          <select
                            value={customMinute}
                            onChange={(e) => setCustomMinute(Number(e.target.value))}
                            className="bg-transparent text-center text-base font-mono font-semibold text-text py-2.5 px-3 appearance-none outline-none cursor-pointer"
                          >
                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                              <option key={m} value={m}>
                                {String(m).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="flex-1 py-2 rounded-xl bg-surface text-muted text-sm font-medium hover:bg-bg transition-colors border border-border"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = schedules.map((s, i) =>
                              i === originalIdx
                                ? { ...s, hour: customHour, minute: customMinute }
                                : s
                            );
                            setSchedules(updated);
                            setEditingIndex(null);
                          }}
                          className="flex-1 py-2 rounded-xl bg-primary-500/20 text-primary-500 text-sm font-semibold hover:bg-primary-500/30 transition-colors"
                        >
                          변경
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`${schedule.hour}-${schedule.minute}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg/40 border border-border cursor-pointer hover:border-primary-500/40 transition-all"
                    onClick={() => {
                      setCustomHour(schedule.hour);
                      setCustomMinute(schedule.minute);
                      setEditingIndex(originalIdx);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                        <svg className="text-primary-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <span className="text-base font-bold text-text font-mono tracking-wide">
                        {formatTime(schedule.hour, schedule.minute)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSchedule(originalIdx);
                        }}
                        className="p-1.5 rounded-lg text-muted hover:text-danger-500 hover:bg-danger-500/10 transition-all"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {schedules.length === 0 && (
        <p className="text-xs text-muted text-center py-3">
          시간을 선택해주세요
        </p>
      )}

      {/* OS 알림 설정 가이드 */}
      <NotificationGuide />
    </div>
  );
}
