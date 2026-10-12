// Stop 훅: Claude가 작업을 끝낼 때마다 코드를 훑어서
//  1) process.env.XXX 로 쓰는 환경변수 이름을 모으고
//  2) 코드에 직접 박혀 있는(하드코딩된) 키·URL 같은 값을 찾아
// .env.example 에 "이름만" 적어 둔다. 실제 값은 절대 적지 않는다.
const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const OUT = path.join(ROOT, ".env.example");
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", ".claude", ".specify", "specs", "coverage", "out", "build", "dist"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

// 이름이 정해진 비밀값 모양 → 추천 변수 이름
const KNOWN = [
  [/https:\/\/[a-z0-9]{20}\.supabase\.co\b/, "NEXT_PUBLIC_SUPABASE_URL"],
  [/\bsb_publishable_[A-Za-z0-9_-]{10,}/, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  [/\bsb_secret_[A-Za-z0-9_-]{10,}/, "SUPABASE_SECRET_KEY"],
  [/\bsbp_[A-Za-z0-9]{20,}/, "SUPABASE_ACCESS_TOKEN"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, "SUPABASE_ANON_KEY"],
  [/\bsk-ant-[A-Za-z0-9_-]{20,}/, "ANTHROPIC_API_KEY"],
  [/\bsk-(?:proj-)?[A-Za-z0-9]{20,}/, "OPENAI_API_KEY"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, "GITHUB_TOKEN"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS_ACCESS_KEY_ID"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "GOOGLE_API_KEY"],
  [/\bGOCSPX-[A-Za-z0-9_-]{20,}/, "GOOGLE_CLIENT_SECRET"],
];
// const API_KEY = "..." 처럼 이름이 비밀값 같은데 값이 무작위 문자열인 경우
const GENERIC = /\b([A-Za-z_][A-Za-z0-9_]*(?:key|secret|token|password|passwd|pwd)[A-Za-z0-9_]*)\s*[:=]\s*["'`]([^"'`\s]{16,})["'`]/gi;

const toEnvName = (id) =>
  id.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9]+/g, "_").toUpperCase();
const looksRandom = (v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v) && !/^https?:\/\//.test(v);

function walk(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), files);
    } else if (EXTS.has(path.extname(e.name)) && !/\.(test|spec)\./.test(e.name)) {
      files.push(path.join(dir, e.name));
    }
  }
  return files;
}

const used = new Set(); // 코드에서 process.env 로 쓰는 이름
const hardcoded = new Map(); // 변수 이름 → [파일:줄]

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/process\.env(?:\.([A-Z_][A-Z0-9_]*)|\[\s*["'`]([A-Z_][A-Z0-9_]*)["'`]\s*\])/g)) {
      const name = m[1] || m[2];
      if (name !== "NODE_ENV") used.add(name);
    }
    const where = `${rel}:${i + 1}`;
    const add = (name) => {
      if (!hardcoded.has(name)) hardcoded.set(name, []);
      if (!hardcoded.get(name).includes(where)) hardcoded.get(name).push(where);
    };
    for (const [re, name] of KNOWN) if (re.test(line)) add(name);
    for (const m of line.matchAll(GENERIC)) if (looksRandom(m[2])) add(toEnvName(m[1]));
  });
}

// 기존 .env.example 내용은 그대로 두고, 빠진 이름만 뒤에 붙인다
let existing = "";
try {
  existing = fs.readFileSync(OUT, "utf8");
} catch {}
const already = new Set([...existing.matchAll(/^\s*#?\s*([A-Z_][A-Z0-9_]*)\s*=/gm)].map((m) => m[1]));
const missing = [...new Set([...used, ...hardcoded.keys()])].filter((n) => !already.has(n)).sort();

if (missing.length) {
  let text = existing;
  if (!text) text = "# 이 프로젝트에 필요한 환경변수 목록 (실제 값은 .env.local 에 적으세요)\n# Claude Code Stop 훅(.claude/hooks/env-example.js)이 자동으로 갱신해요.\n";
  if (!text.endsWith("\n")) text += "\n";
  for (const n of missing) {
    if (hardcoded.has(n)) text += `# 코드에 값이 직접 적혀 있어요: ${hardcoded.get(n).join(", ")}\n`;
    text += `${n}=\n`;
  }
  fs.writeFileSync(OUT, text);
}

const msgs = [];
if (missing.length) msgs.push(`.env.example에 환경변수 ${missing.length}개를 추가했어요: ${missing.join(", ")}`);
if (hardcoded.size) {
  const list = [...hardcoded].map(([n, w]) => `${n} (${w.join(", ")})`).join("; ");
  msgs.push(`⚠ 코드에 직접 적힌 비밀값/주소가 있어요. process.env로 바꾸는 걸 권해요: ${list}`);
}
if (msgs.length) process.stdout.write(JSON.stringify({ systemMessage: msgs.join("\n") }));
process.exit(0);
