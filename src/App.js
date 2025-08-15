import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "ppt_v2_state";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("loadState error", e);
    return null;
  }
}
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("saveState error", e);
  }
}

const uid = () => Math.random().toString(36).slice(2, 9);
const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const todayISO = (d = new Date()) => d.toISOString().slice(0,10);

function safeParseDateISO(s) {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function getWeekNumber(startISO, refISO = todayISO()) {
  const start = safeParseDateISO(startISO);
  const ref = safeParseDateISO(refISO);
  if (!start || !ref) return 1;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((ref.getTime() - start.getTime()) / msPerDay);
  if (diffDays < 0) return 0;
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(8, Math.max(1, week));
}

const MAIN_LIFTS = new Set([
  "Two-Hand Kettlebell Swings",
  "Dumbbell Bench Press",
  "Goblet Squats",
  "Double Kettlebell Deadlifts",
]);

const EXERCISE_LIBRARY = {
  "Two-Hand Kettlebell Swings": { equipment: "16kg or 20kg KB", cues: "Explode with your hips; hinge, don't squat.", video: "https://www.youtube.com/embed/2Z1QW1bZ8nE" },
  "Dumbbell Bench Press": { equipment: "12kg DBs", cues: "Control the negative. Squeeze chest at lockout.", video: "https://www.youtube.com/embed/rT7DgCr-3pg" },
  "Goblet Squats": { equipment: "20kg KB", cues: "Chest up, back straight. Drive your knees out.", video: "https://www.youtube.com/embed/6xwS9l3iUEM" },
  "Bent-Over Dumbbell Rows": { equipment: "12kg DBs", cues: "Hinge, flat back; pull toward hips.", video: "https://www.youtube.com/embed/vT2GjY_Umpw" },
  "Plank Series": { equipment: "Bodyweight", cues: "45s plank → 30s side plank (R) → 30s side plank (L).", video: "https://www.youtube.com/embed/pSHjTRCQxIw" },
  "Double Kettlebell Deadlifts": { equipment: "16kg KBs", cues: "Flat back. Drive through heels.", video: "https://www.youtube.com/embed/2A5tVpw3tRk" },
  "Single-Arm Overhead Press": { equipment: "12kg DB or 16kg KB", cues: "Brace core; press straight up.", video: "https://www.youtube.com/embed/qEwKCR5JCog" },
  "Kettlebell Clean": { equipment: "16kg KB", cues: "Keep bell close; tame the arc.", video: "https://www.youtube.com/embed/p5L2w2QxwY8" },
  "Kettlebell Clean and Press": { equipment: "16kg KB", cues: "Clean to rack, then press.", video: "https://www.youtube.com/embed/cFO2VYl9Dpo" },
  "Renegade Rows": { equipment: "10–12kg DBs", cues: "Strong plank; row without rotating hips.", video: "https://www.youtube.com/embed/2z8JmcrW-As" },
  "Leg Raises & Twists": { equipment: "Bodyweight / 10kg KB", cues: "15 leg raises then 20 Russian twists.", video: "https://www.youtube.com/embed/JB2oyawG9KI" },
  "Kettlebell Front Squats": { equipment: "10kg or 16kg KBs", cues: "Rack position; core engaged.", video: "https://www.youtube.com/embed/4QYyQF_5k3U" },
  "Push-ups": { equipment: "Bodyweight", cues: "Maintain a straight line head-to-heels.", video: "https://www.youtube.com/embed/IODxDxX7oi4" },
  "Alternating Lunges": { equipment: "12kg DBs", cues: "Step forward; drop back knee near floor.", video: "https://www.youtube.com/embed/QOVaHwm-Q6U" },
  "10-Minute AMRAP": { equipment: "10kg & 16kg KBs", cues: "8 Goblet Squats (16kg), 10 Swings (16kg), 12 Sit-ups.", video: "https://www.youtube.com/embed/3UWi44yN-wE" },
  "15-Minute AMRAP": { equipment: "10kg & 16kg KBs", cues: "Same circuit; go 15 minutes.", video: "https://www.youtube.com/embed/3UWi44yN-wE" },
};

const PHASE1 = {
  A: [
    { type: "power", name: "Two-Hand Kettlebell Swings", sets: 5, reps: 15, rest: 60 },
    { type: "strength", name: "Dumbbell Bench Press", sets: 4, reps: "8-12", rest: 90 },
    { type: "strength", name: "Goblet Squats", sets: 4, reps: 10, rest: 90 },
    { type: "accessory", name: "Bent-Over Dumbbell Rows", sets: 3, reps: "12-15", rest: 60 },
    { type: "core", name: "Plank Series", sets: 3, reps: "45s + 30s + 30s", rest: 30 },
  ],
  B: [
    { type: "strength", name: "Double Kettlebell Deadlifts", sets: 4, reps: 8, rest: 90 },
    { type: "strength", name: "Single-Arm Overhead Press", sets: 4, reps: "8-10 each", rest: 75 },
    { type: "accessory", name: "Renegade Rows", sets: 3, reps: "8-10 each", rest: 60 },
    { type: "endurance", name: "Kettlebell Clean", sets: 5, reps: "5 each", rest: 60 },
    { type: "core", name: "Leg Raises & Twists", sets: 3, reps: "15 + 20", rest: 45 },
  ],
  C: [
    { type: "complex", name: "Kettlebell Front Squats", sets: 4, reps: 10, rest: 90 },
    { type: "complex", name: "Push-ups", sets: 4, reps: "AMRAP", rest: 60 },
    { type: "complex", name: "Alternating Lunges", sets: 3, reps: "10 each", rest: 60 },
    { type: "finisher", name: "10-Minute AMRAP", sets: 1, reps: "As Many Rounds As Possible", rest: 0 },
  ],
};

function toPhase2(day) {
  return day.map((ex) => {
    const copy = { ...ex };
    if (typeof copy.rest === "number" && copy.rest > 0 && !MAIN_LIFTS.has(copy.name)) {
      copy.rest = Math.max(0, copy.rest - 15);
    }
    return copy;
  });
}

function phase2Workouts() {
  const A = toPhase2(PHASE1.A).map((ex) => ({ ...ex }));
  A.forEach((ex) => {
    if (ex.name === "Dumbbell Bench Press" || ex.name === "Goblet Squats") ex.sets = (ex.sets || 0) + 1;
  });

  const B = toPhase2(PHASE1.B).map((ex) => ({ ...ex }));
  const idx = B.findIndex((e) => e.name === "Single-Arm Overhead Press");
  if (idx !== -1) B.splice(idx, 1, { type: "strength", name: "Kettlebell Clean and Press", sets: 4, reps: "8-10 each", rest: 75 });

  const C = toPhase2(PHASE1.C).map((ex) => ({ ...ex }));
  const fIdx = C.findIndex((e) => (typeof e.name === 'string' && e.name.includes("AMRAP")));
  if (fIdx !== -1) C.splice(fIdx, 1, { type: "finisher", name: "15-Minute AMRAP", sets: 1, reps: "As Many Rounds As Possible", rest: 0 });

  return { A, B, C };
}

const defaultState = {
  onboarded: false,
  user: {
    equipment: {
      Swings: "16kg",
      DB_Bench: "12kg",
      Goblet_Squat: "20kg",
      Double_KB_DL: "16kg x2",
      SA_OHP: "12kg",
      Clean: "16kg",
      Clean_Press: "16kg",
      Renegade_Row: "10kg",
      Lunges: "12kg",
      AMRAP: "10 & 16kg",
    },
    schedule: ["Monday","Wednesday","Friday"],
    startDate: todayISO(),
  },
  sessions: [],
};

export default function App() {
  const [state, setState] = useState(() => loadState() ?? defaultState);
  useEffect(() => saveState(state), [state]);

  const currentWeek = useMemo(() => getWeekNumber(state.user.startDate), [state.user.startDate, state.sessions]);
  const isPhase2 = currentWeek >= 5;
  const workouts = useMemo(() => (isPhase2 ? phase2Workouts() : PHASE1), [isPhase2]);

  const scheduledToday = useMemo(() => {
    const todayName = dayNames[new Date().getDay()];
    return Array.isArray(state.user.schedule) && state.user.schedule.includes(todayName);
  }, [state.user.schedule]);

  const completedCount = Array.isArray(state.sessions) ? state.sessions.filter((s) => s.completed).length : 0;
  const nextWorkoutLetter = (['A','B','C'])[completedCount % 3];
  const todayWorkoutLetter = scheduledToday ? nextWorkoutLetter : null;

  const [tab, setTab] = useState("today");

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
      <div className="max-w-3xl mx-auto px-4 pb-24">
        <Header week={currentWeek} startDate={state.user.startDate} />
        {!state.onboarded ? (
          <Onboarding state={state} setState={setState} />
        ) : tab === "today" ? (
          <Today
            state={state}
            setState={setState}
            workouts={workouts}
            isPhase2={isPhase2}
            scheduledToday={scheduledToday}
            workoutLetter={todayWorkoutLetter}
            week={currentWeek}
          />
        ) : tab === "progress" ? (
          <Progress state={state} setState={setState} />
        ) : (
          <ExerciseLibrary />
        )}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function Header({ week, startDate }) {
  return (
    <header className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Progressive Performance Tracker</h1>
        <div className="text-sm text-neutral-400">
          {week === 0 ? (
            <span>Program starts on {startDate}</span>
          ) : (
            <span>Week {week}{week >= 5 && <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-300">Phase 2</span>}</span>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { key: "today", label: "Today" },
    { key: "progress", label: "Progress" },
    { key: "library", label: "Library" },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-3xl mx-auto flex">
        {items.map((it) => (
          <button key={it.key} className={`flex-1 py-3 text-sm ${tab === it.key ? 'text-white' : 'text-neutral-400'}`} onClick={() => setTab(it.key)}>
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Onboarding({ state, setState }) {
  const [schedule, setSchedule] = useState(Array.isArray(state.user.schedule) ? state.user.schedule : []);
  const [equipment, setEquipment] = useState({ ...(state.user.equipment || {}) });
  const [startDate, setStartDate] = useState(state.user.startDate || todayISO());

  const toggleDay = (d) => {
    setSchedule((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : prev.length < 3 ? [...prev, d] : prev));
  };

  const canFinish = schedule.length === 3;

  return (
    <section className="py-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Quick Setup</h2>
        <p className="text-sm text-neutral-400">Choose your equipment, training days (pick exactly 3), and Week 1 start date.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {dayNames.map((d) => (
          <button key={d} onClick={() => toggleDay(d)} className={`px-3 py-2 rounded-lg border text-sm ${schedule.includes(d) ? 'bg-emerald-700/20 border-emerald-700 text-emerald-300' : 'border-neutral-800 text-neutral-300'}`}>
            {d}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Equipment Profile</h3>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(equipment).map(([k, v]) => (
            <label key={k} className="flex items-center justify-between gap-3 text-sm bg-neutral-900 rounded-xl p-3 border border-neutral-800">
              <span className="text-neutral-300">{k.replace(/_/g, ' ')}</span>
              <input className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 w-36 text-right" value={v} onChange={(e) => setEquipment({ ...equipment, [k]: e.target.value })} />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-neutral-300">Week 1 start date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800" />
        <p className="text-[12px] text-neutral-500 mt-1">Pick the date you want to be treated as Week 1 start (use past dates to backfill).</p>
      </div>

      <button disabled={!canFinish} onClick={() => setState((s) => ({ ...s, onboarded: true, user: { ...s.user, schedule, equipment, startDate } }))} className={`w-full py-3 rounded-xl text-sm font-medium ${canFinish ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-500'}`}>
        Finish Setup
      </button>
    </section>
  );
}

function Today({ state, setState, workouts, isPhase2, scheduledToday, workoutLetter, week }) {
  const todayName = dayNames[new Date().getDay()];
  if (!scheduledToday || !workoutLetter) {
    return (
      <section className="py-8 space-y-4">
        <h2 className="text-xl font-semibold">Rest Day</h2>
        <p className="text-neutral-400 text-sm">Today ({todayName}) is not one of your scheduled training days. Recovery is part of the plan. ✌️</p>
      </section>
    );
  }

  const plan = (workouts && workouts[workoutLetter]) || [];
  return (
    <section className="py-6 space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold">Today's Workout</h2>
          <p className="text-sm text-neutral-400">Workout {workoutLetter} • Week {week}</p>
        </div>
        {isPhase2 && <span className="text-emerald-300 text-xs px-2 py-1 rounded bg-emerald-700/20 border border-emerald-700">Phase 2 Active</span>}
      </div>

      <LiveWorkout state={state} setState={setState} workoutLetter={workoutLetter} exercises={plan} isPhase2={isPhase2} />
    </section>
  );
}

function LiveWorkout({ state, setState, exercises, workoutLetter, isPhase2 }) {
  const makeEntries = (exs) => (Array.isArray(exs) ? exs.map((ex) => ({ exName: ex.name, sets: Array.from({ length: ex.sets || 0 }, () => ({ reps: "", weight: "" })) })) : []);
  const [active, setActive] = useState(false);
  const [entries, setEntries] = useState(() => makeEntries(exercises));
  const [notes, setNotes] = useState("");

  useEffect(() => setEntries(makeEntries(exercises)), [exercises]);

  const start = () => setActive(true);

  const complete = () => {
    const date = todayISO();
    const week = getWeekNumber(state.user.startDate, date);
    const session = { id: uid(), date, workout: workoutLetter, week, entries, notes, completed: true, phase2: isPhase2 };

    const bench = entries.find((e) => e.exName === "Dumbbell Bench Press");
    let alertMsg = null;
    if (bench) {
      const lastSet = bench.sets[bench.sets.length - 1] || {};
      const lastReps = parseInt(lastSet.reps || "0", 10);
      if (!Number.isNaN(lastReps) && lastReps >= 12) alertMsg = "Progress Alert! You've mastered your current weight for 12 reps. Try increasing next session.";
    }

    setState((s) => ({ ...s, sessions: Array.isArray(s.sessions) ? [...s.sessions, session] : [session] }));
    if (alertMsg) setTimeout(() => alert(alertMsg), 50);
  };

  return (
    <div className="space-y-4">
      {!active ? (
        <button onClick={start} className="w-full py-3 rounded-xl bg-white text-black text-sm font-medium">Start Workout</button>
      ) : (
        <p className="text-sm text-neutral-400">Live Mode: log each set below. Rest timer starts when you save a set.</p>
      )}

      <div className="space-y-3">
        {Array.isArray(exercises) && exercises.map((ex, i) => (
          <ExerciseCard key={ex.name + "_" + i} ex={ex} isPhase2={isPhase2} entry={entries[i]} setEntry={(newEntry) => setEntries((arr) => arr.map((e, idx) => (idx === i ? newEntry : e)))} />
        ))}
      </div>

      {active && (
        <div className="space-y-3 pt-2">
          <label className="block">
            <span className="text-sm text-neutral-300">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full h-20 p-3 rounded-xl bg-neutral-900 border border-neutral-800" placeholder="How did it feel?" />
          </label>
          <button onClick={complete} className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium">Mark Workout Complete</button>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ ex, entry, setEntry, isPhase2 }) {
  const [showInfo, setShowInfo] = useState(false);
  const rest = typeof ex.rest === 'number' ? ex.rest : 0;
  const sets = Array.isArray(entry?.sets) ? entry.sets : Array.from({ length: ex.sets || 0 }, () => ({ reps: "", weight: "" }));

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{ex.name}</h3>
          <p className="text-xs text-neutral-400">{EXERCISE_LIBRARY[ex.name]?.equipment || "—"} • Sets: {ex.sets} • Reps: {String(ex.reps)}</p>
          <p className="text-xs text-neutral-500 mt-1">Rest: {rest}s {isPhase2 && !MAIN_LIFTS.has(ex.name) && <span className="text-emerald-300">(−15s in Phase 2)</span>}</p>
        </div>
        <button className="text-xs text-neutral-400 underline" onClick={() => setShowInfo(true)}>cues</button>
      </div>

      <div className="mt-3 space-y-2">
        {sets.map((s, idx) => (
          <SetRow key={idx} idx={idx} ex={ex} setData={s} onChange={(newSet) => {
            if (typeof setEntry === 'function') {
              const updated = { ...entry, sets: (entry?.sets || []).map((t, i) => (i === idx ? newSet : t)) };
              setEntry(updated);
            }
          }} />
        ))}
      </div>

      {showInfo && <ExerciseModal name={ex.name} onClose={() => setShowInfo(false)} isPhase2={isPhase2} />}
    </div>
  );
}

function SetRow({ idx, ex, setData, onChange }) {
  const [reps, setReps] = useState(setData?.reps ?? "");
  const [weight, setWeight] = useState(setData?.weight ?? "");
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => { setReps(setData?.reps ?? ""); setWeight(setData?.weight ?? ""); }, [setData?.reps, setData?.weight]);

  const save = () => {
    if (typeof onChange === 'function') onChange({ reps, weight });
    if ((ex.rest ?? 0) > 0) setTimerKey((k) => k + 1);
  };

  return (
    <div className="rounded-xl bg-neutral-950/50 border border-neutral-800 p-3 flex items-center gap-3">
      <span className="text-xs text-neutral-400 w-10">Set {idx + 1}</span>
      <input type="text" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} placeholder={typeof ex.reps === 'number' ? String(ex.reps) : String(ex.reps)} className="flex-1 text-sm bg-neutral-950 border border-neutral-800 rounded px-2 py-2" />
      <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="weight used" className="w-32 text-sm bg-neutral-950 border border-neutral-800 rounded px-2 py-2 text-right" />
      <button onClick={save} className="px-3 py-2 rounded-lg bg-white text-black text-xs font-medium">Save</button>
      {ex.rest > 0 && <div className="ml-auto w-28"><RestTimer key={timerKey} seconds={ex.rest} /></div>}
    </div>
  );
}

function RestTimer({ seconds }) {
  const [s, setS] = useState(Math.max(0, Math.floor(Number(seconds) || 0)));
  const intervalRef = useRef(null);

  useEffect(() => {
    setS(Math.max(0, Math.floor(Number(seconds) || 0)));
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setS((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(intervalRef.current);
  }, [seconds]);

  useEffect(() => {
    if (s === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBIAAABAAEAQBQAAAwAABAAgAZGF0YQAAAAA=").play(); } catch (e) {}
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) window.navigator.vibrate(120);
    }
  }, [s]);

  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return <div className={`text-xs px-2 py-1 rounded-lg border text-center ${s === 0 ? 'border-emerald-700 text-emerald-300' : 'border-neutral-700 text-neutral-300'}`}>{mm}:{ss}</div>;
}

function ExerciseModal({ name, onClose, isPhase2 }) {
  const ex = EXERCISE_LIBRARY[name];
  if (!ex) return null;
  const cueExtra = isPhase2 && name === "Plank Series" ? " • Phase 2: try lifting one foot off the ground." : "";
  return (
    <div className="fixed inset-0 z-20 bg-black/70 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{name}</h4>
          <button onClick={onClose} className="text-neutral-400 text-sm">Close</button>
        </div>
        <p className="text-xs text-neutral-400">Equipment: {ex.equipment}</p>
        <p className="text-sm text-neutral-300">{ex.cues}{cueExtra}</p>
        {ex.video && (
          <div className="aspect-video rounded-xl overflow-hidden border border-neutral-800">
            <iframe className="w-full h-full" src={ex.video} title={name} allow="autoplay; encrypted-media" allowFullScreen />
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseLibrary() {
  const items = Object.entries(EXERCISE_LIBRARY);
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold mb-3">Exercise Library</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(([name, ex]) => <ExercisePreview key={name} name={name} ex={ex} />)}
      </div>
    </section>
  );
}

function ExercisePreview({ name, ex }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-xs text-neutral-400">{ex.equipment}</p>
        </div>
        <button className="text-xs text-neutral-300 underline" onClick={() => setOpen(true)}>Open</button>
      </div>
      {open && <ExerciseModal name={name} onClose={() => setOpen(false)} isPhase2={false} />}
    </div>
  );
}

function Progress({ state, setState }) {
  const [modalDate, setModalDate] = useState(null);
  const sessionsMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(state.sessions) ? state.sessions : []).forEach((s) => map.set(s.date, s));
    return map;
  }, [state.sessions]);

  const completed = (Array.isArray(state.sessions) ? state.sessions : []).filter((s) => s.completed);

  const volume = {};
  for (const s of completed) {
    for (const e of s.entries || []) {
      let total = 0;
      for (const st of e.sets || []) {
        const reps = parseInt(st.reps, 10);
        const w = parseFloat(String(st.weight).replace(/[^0-9.]/g, ''));
        if (!Number.isNaN(reps) && !Number.isNaN(w)) total += reps * w;
      }
      volume[e.exName] = (volume[e.exName] || 0) + total;
    }
  }

  const keyLifts = ["Dumbbell Bench Press", "Goblet Squats"];
  const maxVolume = Math.max(...keyLifts.map((n) => volume[n] || 0), 1);
  const prHighlights = computePRs(completed);
  const amrapHistory = computeAMRAP(completed);

  return (
    <section className="py-6 space-y-6">
      <h2 className="text-xl font-semibold">Progress</h2>

      <div>
        <Calendar startDate={state.user.startDate} sessions={sessionsMap} onEditDay={(iso) => setModalDate(iso)} />
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Volume Load</h3>
        <div className="grid grid-cols-1 gap-3">
          {keyLifts.map((name) => <MiniBar key={name} label={name} value={Math.round(volume[name] || 0)} max={maxVolume} />)}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">AMRAP Finisher (Workout C)</h3>
        <div className="space-y-2">
          {amrapHistory.length === 0 ? <p className="text-sm text-neutral-400">No AMRAP results yet.</p> : amrapHistory.map((r) => (
            <div key={r.date} className="flex items-center justify-between text-sm bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              <span className="text-neutral-300">{r.date} • {r.label}</span>
              <span className="font-medium">{r.rounds} rds {r.reps} reps</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Personal Records</h3>
        {prHighlights.length === 0 ? <p className="text-sm text-neutral-400">Log more sessions to unlock PRs.</p> : (
          <ul className="text-sm space-y-1">{prHighlights.map((p) => <li key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3"><span className="font-medium">{p.exercise}</span>: {p.reps} reps @ {p.weight}</li>)}</ul>
        )}
      </div>

      {modalDate && <HistoricalSessionModal isoDate={modalDate} existing={sessionsMap.get(modalDate)} startDate={state.user.startDate} onClose={() => setModalDate(null)} onSave={(session) => {
        setState((s) => {
          const others = (s.sessions || []).filter((x) => x.date !== session.date);
          return { ...s, sessions: [...others, session] };
        });
        setModalDate(null);
      }} />}
    </section>
  );
}

function Calendar({ startDate, sessions, onEditDay }) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 55);
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const s = sessions.get(iso);
    days.push({ iso, done: !!s, letter: s?.workout });
  }

  return (
    <div>
      <h3 className="font-medium mb-2">Workout Calendar</h3>
      <div className="grid grid-cols-8 gap-1">
        {days.map((d) => (
          <button key={d.iso} title={`${d.iso}${d.done ? ` • Workout ${d.letter}` : ''}`} onClick={() => typeof onEditDay === 'function' && onEditDay(d.iso)} className={`aspect-square rounded ${d.done ? 'bg-emerald-600' : 'bg-neutral-800'}`} />
        ))}
      </div>
      <p className="text-[11px] text-neutral-500 mt-1">Past 8 weeks — tap a day to add or edit a session</p>
    </div>
  );
}

function HistoricalSessionModal({ isoDate, existing, startDate, onClose, onSave }) {
  const initialLetter = existing?.workout || 'A';
  const [letter, setLetter] = useState(initialLetter);
  const [completed, setCompleted] = useState(typeof existing?.completed === 'boolean' ? existing.completed : true);
  const phase2AtDate = getWeekNumber(startDate, isoDate) >= 5;
  const plan = phase2AtDate ? phase2Workouts() : PHASE1;

  const makeDefaultEntries = (ltr) => (plan[ltr] || []).map((ex) => ({ exName: ex.name, sets: Array.from({ length: ex.sets || 0 }, () => ({ reps: "", weight: "" })) }));

  const [entries, setEntries] = useState(existing?.entries || makeDefaultEntries(letter));
  const [notes, setNotes] = useState(existing?.notes || "");

  useEffect(() => {
    if (!existing) setEntries(makeDefaultEntries(letter));
  }, [letter]);

  const save = () => {
    const week = getWeekNumber(startDate, isoDate);
    const session = { id: existing?.id || uid(), date: isoDate, workout: letter, week, entries, notes, completed, phase2: phase2AtDate };
    if (typeof onSave === 'function') onSave(session);
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="w-full sm:max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{isoDate} • Add / Edit Session</h4>
          <button onClick={onClose} className="text-neutral-400 text-sm">Close</button>
        </div>

        <div className="flex gap-2">
          <label className="flex-1">
            <div className="text-xs text-neutral-300">Workout</div>
            <select value={letter} onChange={(e) => setLetter(e.target.value)} className="mt-1 w-full p-2 rounded bg-neutral-900 border border-neutral-800">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </label>
          <label className="w-36">
            <div className="text-xs text-neutral-300">Completed</div>
            <select value={String(completed)} onChange={(e) => setCompleted(e.target.value === 'true')} className="mt-1 w-full p-2 rounded bg-neutral-900 border border-neutral-800">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <h5 className="font-medium">Entries</h5>
          <div className="space-y-2 max-h-64 overflow-auto">
            {entries.map((en, i) => (
              <div key={en.exName + "_" + i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{en.exName}</div>
                    <div className="text-xs text-neutral-400">Sets: {en.sets.length}</div>
                  </div>
                </div>
                <div className="mt-2 space-y-2">
                  {en.sets.map((s, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input value={s.reps} onChange={(e) => { const next = entries.map((x, ii) => ii === i ? { ...x, sets: x.sets.map((ss, jj) => jj === idx ? { ...ss, reps: e.target.value } : ss) } : x); setEntries(next); }} placeholder="reps" className="flex-1 p-2 rounded bg-neutral-950 border border-neutral-800" />
                      <input value={s.weight} onChange={(e) => { const next = entries.map((x, ii) => ii === i ? { ...x, sets: x.sets.map((ss, jj) => jj === idx ? { ...ss, weight: e.target.value } : ss) } : x); setEntries(next); }} placeholder="weight" className="w-28 p-2 rounded bg-neutral-950 border border-neutral-800 text-right" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <label>
          <div className="text-xs text-neutral-300">Notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full p-2 h-20 rounded bg-neutral-900 border border-neutral-800" />
        </label>

        <div className="flex gap-2">
          <button onClick={save} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white">Save Session</button>
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, value, max = 1 }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-neutral-300">{label}</span>
        <span className="font-medium">{value} kg·reps</span>
      </div>
      <div className="h-2 bg-neutral-800 rounded">
        <div className="h-2 rounded bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function computePRs(sessions) {
  const best = new Map();
  for (const s of sessions || []) {
    for (const e of s.entries || []) {
      for (const st of e.sets || []) {
        const reps = parseInt(st.reps, 10);
        const numericWeight = parseFloat(String(st.weight).replace(/[^0-9.]/g, ''));
        if (!Number.isNaN(reps) && !Number.isNaN(numericWeight)) {
          const k = e.exName;
          const prev = best.get(k);
          const score = numericWeight * reps;
          const prevScore = prev ? prev.numericWeight * prev.reps : -1;
          if (score > prevScore) best.set(k, { reps, weight: st.weight, numericWeight });
        }
      }
    }
  }
  return Array.from(best.entries()).map(([exercise, v]) => ({ id: exercise, exercise, reps: v.reps, weight: v.weight }));
}

function computeAMRAP(sessions) {
  const result = [];
  for (const s of sessions || []) {
    const fin = (s.entries || []).find((e) => typeof e.exName === 'string' && e.exName.includes("AMRAP"));
    if (fin) {
      const set0 = fin.sets && fin.sets[0] ? fin.sets[0] : {};
      const rounds = parseInt(set0.reps, 10);
      const reps = parseInt(set0.weight, 10) || 0;
      if (!Number.isNaN(rounds)) result.push({ date: s.date, rounds, reps, label: fin.exName });
    }
  }
  result.sort((a, b) => (a.date < b.date ? 1 : -1));
  return result;
}

