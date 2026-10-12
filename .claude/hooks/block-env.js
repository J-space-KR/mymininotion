// PreToolUse 훅: Claude가 .env 파일(.env, .env.local 등)을 읽거나 고치거나 지우지 못하게 막는다.
// .env.example / .env.sample / .env.template 같은 "견본" 파일은 비밀값이 없으므로 허용한다.
const path = require("path");

const ALLOWED_SUFFIXES = new Set(["example", "sample", "template"]);

// 파일 이름이 .env 또는 .env.<무엇> 이면서 견본 파일이 아니면 true
function isSecretEnvName(name) {
  const m = /^\.env(?:\.(.+))?$/i.exec(name);
  if (!m) return false;
  return !(m[1] && ALLOWED_SUFFIXES.has(m[1].toLowerCase()));
}

function isSecretEnvPath(p) {
  if (typeof p !== "string" || !p) return false;
  return isSecretEnvName(path.basename(p.replace(/[\\/]+$/, "")));
}

// 셸 명령 안에서 .env / .env.local / .env* 같은 토큰을 찾는다 (process.env 같은 코드는 제외)
function commandTouchesEnv(cmd) {
  if (typeof cmd !== "string") return false;
  const re = /(?:^|[\s"'`=\/\\:<>|;&(])\.env(?:\.([A-Za-z0-9_-]+))?(?=$|[\s"'`\/\\;&|)<>*?\[{,])/gi;
  let m;
  while ((m = re.exec(cmd)) !== null) {
    if (!(m[1] && ALLOWED_SUFFIXES.has(m[1].toLowerCase()))) return true;
  }
  return false;
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const tool = input.tool_name || "";
  const ti = input.tool_input || {};
  const reason =
    ".env 파일은 비밀값(키·비밀번호)이 들어 있어서 훅으로 접근이 막혀 있어요. 필요한 변수 이름은 .env.example을 보거나 사용자에게 물어보세요.";

  if (tool === "Bash" || tool === "PowerShell") {
    if (commandTouchesEnv(ti.command)) deny(reason);
    process.exit(0);
  }

  const candidates = [ti.file_path, ti.notebook_path, ti.path];
  if (candidates.some(isSecretEnvPath)) deny(reason);

  // Glob/Grep의 패턴으로 .env 파일을 겨냥하는 경우
  if (tool === "Glob" || tool === "Grep") {
    const pats = [ti.pattern, ti.glob].filter((p) => typeof p === "string");
    const targetsEnv = pats.some((p) =>
      p.split(/[\\/]/).some((seg) => /^\.env(?![.](example|sample|template)$)/i.test(seg)),
    );
    if (targetsEnv && tool === "Glob") deny(reason);
    if (tool === "Grep" && typeof ti.glob === "string" && /(^|[\\/])\.env/i.test(ti.glob) && !/\.env\.(example|sample|template)$/i.test(ti.glob)) deny(reason);
  }
  process.exit(0);
});
