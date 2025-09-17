"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import Fuse from "fuse.js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

type Student = {
  student_id: string;
  name: string;
  class: string;
  comprehension: number;
  attention: number;
  focus: number;
  retention: number;
  assessment_score: number;
  engagement_time: number;
  persona: string;
};

type SortConfig = { key: keyof Student; direction: "asc" | "desc" } | null;

function computeCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  const ax = a.slice(0, n);
  const bx = b.slice(0, n);
  const meanA = ax.reduce((s, v) => s + v, 0) / n;
  const meanB = bx.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = ax[i] - meanA;
    const db = bx[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA) * Math.sqrt(denB);
  return den === 0 ? 0 : num / den;
}

function inferPersona(s: Student): string {
  const high = (v: number) => v >= 70;
  const low = (v: number) => v < 50;
  if (high(s.attention) && high(s.focus) && high(s.retention)) return "Engaged Achiever";
  if (high(s.comprehension) && low(s.attention)) return "Independent Learner";
  if (low(s.retention) && high(s.attention)) return "Active but Forgetful";
  if (low(s.focus) && low(s.attention)) return "Needs Guidance";
  return "General";
}

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const parseCsv = (path: string) =>
      new Promise<Student[]>((resolve) => {
        Papa.parse(path, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (result: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsed: Student[] = (result.data as any[]).map((row) => {
              const rec: Student = {
                student_id: String(row.student_id ?? ""),
                name: String(row.name ?? ""),
                class: String(row.class ?? ""),
                comprehension: Number(row.comprehension) || 0,
                attention: Number(row.attention) || 0,
                focus: Number(row.focus) || 0,
                retention: Number(row.retention) || 0,
                assessment_score: Number(row.assessment_score) || 0,
                engagement_time: Number(row.engagement_time) || 0,
                persona: String(row.persona ?? ""),
              };
              if (!rec.persona) rec.persona = inferPersona(rec);
              return rec;
            });
            resolve(parsed);
          },
          error: () => resolve([]),
        });
      });

    // Try augmented CSV first, fall back to base dataset
    parseCsv("/synthetic_students_with_personas.csv").then((data) => {
      if (data.length > 0) {
        setStudents(data);
      } else {
        parseCsv("/synthetic_students.csv").then((fallback) => setStudents(fallback));
      }
    });
  }, []);

  const overview = useMemo(() => {
    if (students.length === 0) return null;
    const avg = (k: keyof Student) =>
      Math.round(
        (students.reduce((s, r) => s + (r[k] as number), 0) / students.length) * 10
      ) / 10;
    return {
      avgScore: avg("assessment_score"),
      avgComprehension: avg("comprehension"),
      avgAttention: avg("attention"),
      avgFocus: avg("focus"),
      avgRetention: avg("retention"),
      avgEngagement: avg("engagement_time"),
    };
  }, [students]);

  const byClassForBar = useMemo(() => {
    const map: Record<string, { class: string; avg_score: number; count: number }> = {};
    students.forEach((s) => {
      if (!map[s.class]) map[s.class] = { class: s.class, avg_score: 0, count: 0 };
      map[s.class].avg_score += s.assessment_score;
      map[s.class].count += 1;
    });
    return Object.values(map).map((r) => ({
      class: r.class,
      avg_score: Math.round((r.avg_score / Math.max(1, r.count)) * 10) / 10,
    }));
  }, [students]);

  const correlations = useMemo(() => {
    const x = students.map((s) => s.assessment_score);
    const corr = (k: keyof Student) => Math.round(computeCorrelation(students.map((s) => s[k] as number), x) * 100) / 100;
    return [
      { skill: "Attention", r: corr("attention") },
      { skill: "Focus", r: corr("focus") },
      { skill: "Comprehension", r: corr("comprehension") },
      { skill: "Retention", r: corr("retention") },
      { skill: "Engagement", r: corr("engagement_time") },
    ].sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [students]);

  const fuse = useMemo(() => new Fuse(students, { keys: ["name", "class", "persona"], threshold: 0.3 }), [students]);

  const filtered = useMemo(() => {
    const base = query ? fuse.search(query).map((r) => r.item) : students;
    if (!sortConfig) return base;
    const sorted = [...base].sort((a, b) => {
      const va = a[sortConfig.key];
      const vb = b[sortConfig.key];
      if (typeof va === "number" && typeof vb === "number") {
        return sortConfig.direction === "asc" ? va - vb : vb - va;
      }
      return String(va).localeCompare(String(vb)) * (sortConfig.direction === "asc" ? 1 : -1);
    });
    return sorted;
  }, [students, query, sortConfig, fuse]);

  const header = (label: string, key: keyof Student) => (
    <button
      className="w-full text-left px-2 py-1"
      onClick={() =>
        setSortConfig((prev) => {
          if (!prev || prev.key !== key) return { key, direction: "asc" };
          return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
        })
      }
    >
      {label}
      {sortConfig?.key === key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : ""}
    </button>
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">📊 Student Analytics Dashboard</h1>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border p-3">
          <h3 className="font-semibold">Overview</h3>
          <div className="text-sm mt-2 space-y-1">
            <div>Total Students: {students.length}</div>
            {overview && (
              <>
                <div>Avg Score: {overview.avgScore}</div>
                <div>Avg Attention: {overview.avgAttention}</div>
                <div>Avg Focus: {overview.avgFocus}</div>
                <div>Avg Comprehension: {overview.avgComprehension}</div>
              </>
            )}
          </div>
        </div>
        <div className="rounded border p-3 md:col-span-2">
          <h3 className="font-semibold mb-2">Insights</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {correlations.slice(0, 3).map((c, i) => (
              <li key={i}><b>{c.skill}</b> correlation with score: {c.r}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Average Assessment Score by Class</h2>
        <BarChart width={700} height={300} data={byClassForBar}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="class" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="avg_score" fill="#6366f1" />
        </BarChart>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Attention vs Assessment Score</h2>
        <ScatterChart width={700} height={300}>
          <CartesianGrid />
          <XAxis dataKey="attention" name="Attention" />
          <YAxis dataKey="assessment_score" name="Score" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={students} fill="#10b981" />
        </ScatterChart>
      </section>

      {students.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Student Profile</h2>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm">Select student:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
            >
              {students.map((s, i) => (
                <option key={s.student_id || i} value={i}>{s.name} ({s.class})</option>
              ))}
            </select>
          </div>
          <RadarChart outerRadius={90} width={600} height={380}
            data={[
              { skill: "Comprehension", value: students[selectedIndex].comprehension },
              { skill: "Attention", value: students[selectedIndex].attention },
              { skill: "Focus", value: students[selectedIndex].focus },
              { skill: "Retention", value: students[selectedIndex].retention },
              { skill: "Engagement", value: students[selectedIndex].engagement_time },
            ]}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name={students[selectedIndex].name} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
          </RadarChart>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-2">Student Table</h2>
        <div className="flex items-center gap-2 mb-2">
          <input
            className="border border-gray-700 bg-gray-900 text-white rounded px-2 py-1 text-sm w-80 placeholder-gray-400"
            placeholder="Search name, class, persona..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <table className="border border-gray-700 w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-700">{header("ID", "student_id")}</th>
              <th className="border border-gray-700">{header("Name", "name")}</th>
              <th className="border border-gray-700">{header("Class", "class")}</th>
              <th className="border border-gray-700">{header("Score", "assessment_score")}</th>
              <th className="border border-gray-700">{header("Persona", "persona")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, idx) => (
              <tr key={idx} className="odd:bg-gray-900 even:bg-gray-800 text-white">
                <td className="border border-gray-700 px-2 py-1">{s.student_id}</td>
                <td className="border border-gray-700 px-2 py-1">{s.name}</td>
                <td className="border border-gray-700 px-2 py-1">{s.class}</td>
                <td className="border border-gray-700 px-2 py-1">{s.assessment_score}</td>
                <td className="border border-gray-700 px-2 py-1">{s.persona}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
