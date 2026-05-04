// src/ui/routes.ts
function buildRunRoute(runId) {
  return `/runs/${encodeURIComponent(runId)}`;
}
function buildArtifactRoute(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error(`Invalid artifact path: ${relativePath}`);
  }
  return `/artifacts/${segments.map(encodeURIComponent).join("/")}`;
}

// src/ui/format.ts
function formatLongDuration(durationMs) {
  const ms = Number(durationMs || 0);
  if (ms <= 0) {
    return "0s";
  }
  const duration = Math.round(ms / 1e3);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor(duration % 3600 / 60);
  const seconds = duration % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
function formatStepDuration(durationMs) {
  const seconds = Number(durationMs || 0) / 1e3;
  return seconds >= 10 ? `${seconds.toFixed(0)}s` : `${seconds.toFixed(1)}s`;
}
function successRateTone(rate) {
  if (rate >= 80) return "success";
  if (rate >= 50) return "warning";
  return "danger";
}
function summaryIconStyle(tone) {
  if (tone === "accent") return "color: var(--accent); background: rgba(67, 24, 255, 0.1);";
  if (tone === "success") return "color: var(--success); background: rgba(5, 205, 153, 0.12);";
  if (tone === "warning") return "color: var(--warning); background: rgba(255, 146, 12, 0.12);";
  if (tone === "danger") return "color: var(--failure); background: rgba(238, 93, 80, 0.12);";
  return "color: var(--text); background: var(--panel-alt);";
}
function statusPillLabel(status) {
  if (status === "success") return "Passed";
  if (status === "aborted") return "Aborted";
  if (status === "failure") return "Failed";
  if (status === "error") return "Error";
  return "Not Executed";
}

// src/ui/components/SummaryCard.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function SummaryCard({
  label,
  value,
  tone,
  iconSvg
}) {
  return /* @__PURE__ */ jsxs("div", { className: "summary-card", children: [
    /* @__PURE__ */ jsx(
      "span",
      {
        className: "summary-card-icon",
        style: inlineStyleFromString(summaryIconStyle(tone)),
        dangerouslySetInnerHTML: { __html: iconSvg }
      }
    ),
    /* @__PURE__ */ jsxs("span", { children: [
      /* @__PURE__ */ jsx("div", { className: "summary-card-label", children: label }),
      /* @__PURE__ */ jsx("div", { className: "summary-card-value", children: value })
    ] })
  ] });
}
function inlineStyleFromString(css) {
  const result = {};
  for (const rule of css.split(";")) {
    const [rawProp, ...rest] = rule.split(":");
    if (!rawProp || rest.length === 0) continue;
    const prop = rawProp.trim();
    const value = rest.join(":").trim();
    if (!prop || !value) continue;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    result[camel] = value;
  }
  return result;
}

// src/ui/components/StatusPill.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function StatusPill({ status }) {
  return /* @__PURE__ */ jsx2("span", { className: `status-pill ${status}`, children: statusPillLabel(status) });
}

// src/ui/components/TintedPngIcon.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
function TintedPngIcon({ src }) {
  const style = { "--icon-mask": `url('${src}')` };
  return /* @__PURE__ */ jsx3("span", { className: "tinted-png-icon", style, "aria-hidden": "true" });
}

// src/ui/icons.ts
function svgDataUri(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
var TEST_ICON_SRC = svgDataUri(
  '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.023 6.44581L10.7376 0.160415C10.6334 0.0562284 10.4916 -0.00178609 10.3433 -0.000865207C10.195 5.56883e-05 10.0525 0.0598365 9.94698 0.165326C9.84149 0.270815 9.78171 0.413371 9.78079 0.561635C9.77987 0.709898 9.83788 0.851723 9.94207 0.95591L10.2838 1.29768L1.18337 10.3981C0.432289 11.1492 0.00665178 12.1642 9.49964e-05 13.2199C-0.00646187 14.2755 0.4066 15.2853 1.14841 16.0271C1.89022 16.7689 2.90002 17.182 3.95565 17.1754C5.01129 17.1689 6.02629 16.7432 6.77737 15.9921L15.8778 6.89168L16.2275 7.2413C16.3316 7.34549 16.4735 7.40351 16.6217 7.40258C16.77 7.40166 16.9126 7.34188 17.018 7.23639C17.1235 7.1309 17.1833 6.98835 17.1842 6.84008C17.1852 6.69182 17.1271 6.55 17.023 6.44581ZM13.1471 8.0589C12.6386 8.15099 10.8743 8.36749 9.64093 7.43637C8.84698 6.83875 7.93683 6.41188 6.96677 6.18217L11.0675 2.08139L15.0961 6.10993L13.1471 8.0589Z" fill="#707EAE"/></svg>'
);
var TEST_SUITE_ICON_SRC = svgDataUri(
  '<svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.978 0.621055H11.4888C11.6596 0.621055 11.7993 0.484423 11.7993 0.310527C11.7993 0.139736 11.6596 0 11.4888 0H5.90248C5.72858 0 5.59195 0.139736 5.59195 0.310527C5.59195 0.484423 5.72858 0.621055 5.90248 0.621055H7.03434V5.14551C7.03434 5.21383 7.01261 5.27904 6.97224 5.33183L4.85449 8.18868C5.80782 7.92162 7.30771 7.75394 8.84156 8.58616C10.5402 9.50842 12.2449 9.01157 12.9405 8.73521L10.4189 5.33183C10.3786 5.27904 10.3568 5.21383 10.3568 5.14551V0.621055H10.978Z" fill="#707EAE"/><path d="M13.3226 9.24894C12.9189 9.42905 12.0526 9.74889 10.9843 9.74889C10.239 9.74889 9.39748 9.59362 8.54656 9.13403C6.52818 8.04098 4.51895 8.9353 4.17434 9.10609L4.17123 9.10919L0.233844 14.4254C-0.0363199 14.7887 -0.0735832 15.2483 0.128265 15.652C0.333203 16.0557 0.724477 16.2979 1.17474 16.2979H16.2168C16.667 16.2979 17.0583 16.0557 17.2633 15.652C17.4651 15.2483 17.4278 14.7887 17.1577 14.4254L13.3226 9.24894ZM4.22104 11.6555L1.98524 14.6739C1.92624 14.7546 1.83309 14.7981 1.73682 14.7981C1.67161 14.7981 1.6064 14.7795 1.55051 14.736C1.41387 14.6335 1.38593 14.441 1.4884 14.3012L3.7242 11.286C3.82667 11.1463 4.0192 11.1183 4.15894 11.2208C4.29557 11.3233 4.32351 11.5157 4.22104 11.6555ZM5.23337 10.286L4.98185 10.6307C4.91974 10.7146 4.82658 10.758 4.73033 10.758C4.66512 10.758 4.60301 10.7394 4.54711 10.6959C4.40738 10.5966 4.37943 10.4009 4.4819 10.2643L4.73653 9.91961C4.83589 9.77987 5.03153 9.75192 5.16816 9.8544C5.3079 9.95377 5.33584 10.1494 5.23337 10.286Z" fill="#707EAE"/></svg>'
);
var LOCAL_ICON_SRC = svgDataUri(
  '<svg width="65" height="48" viewBox="0 0 65 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="63" height="42" rx="8" stroke="#707EAE" stroke-width="2"/><line x1="16" y1="47" x2="52" y2="47" stroke="#707EAE" stroke-width="2" stroke-linecap="round"/></svg>'
);
var PLAY_CIRCLE_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M10.4 8.8l5.2 3.2-5.2 3.2z" fill="currentColor" stroke="none"></path></svg>';
var CHECK_CIRCLE_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M8.8 12.2l2.1 2.1 4.3-4.6"></path></svg>';
var TIMER_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7"></circle><path d="M12 13V9.5"></path><path d="M15 5h-6"></path></svg>';
var BACK_ARROW_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5L9 12l5.5 5.5"></path></svg>';
var PLAY_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6.5v11l9-5.5-9-5.5z"></path></svg>';

// src/ui/pages/RunIndexView.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function RunIndexView({
  index,
  navigate
}) {
  return /* @__PURE__ */ jsx4("div", { className: "fr-report-ui", children: /* @__PURE__ */ jsxs2("main", { className: "page history-list-page", children: [
    /* @__PURE__ */ jsx4("section", { className: "history-page-header", children: /* @__PURE__ */ jsxs2("div", { children: [
      /* @__PURE__ */ jsx4("h1", { children: "Test Runs" }),
      /* @__PURE__ */ jsx4("p", { children: "Local UsbUiTest run history for the current workspace." })
    ] }) }),
    /* @__PURE__ */ jsxs2("section", { className: "summary-grid", children: [
      /* @__PURE__ */ jsx4(
        SummaryCard,
        {
          label: "Total Runs",
          value: String(index.summary.totalRuns),
          tone: "accent",
          iconSvg: PLAY_CIRCLE_ICON_SVG
        }
      ),
      /* @__PURE__ */ jsx4(
        SummaryCard,
        {
          label: "Test Success Rate",
          value: `${index.summary.totalSuccessRate.toFixed(1)}%`,
          tone: successRateTone(index.summary.totalSuccessRate),
          iconSvg: CHECK_CIRCLE_ICON_SVG
        }
      ),
      /* @__PURE__ */ jsx4(
        SummaryCard,
        {
          label: "Total time saved",
          value: formatLongDuration(index.summary.totalDurationMs),
          tone: "neutral",
          iconSvg: TIMER_ICON_SVG
        }
      )
    ] }),
    /* @__PURE__ */ jsxs2("section", { className: "runs-shell", children: [
      /* @__PURE__ */ jsxs2("div", { className: "runs-shell-header", children: [
        /* @__PURE__ */ jsx4("h2", { children: "Run history" }),
        /* @__PURE__ */ jsx4("p", { children: "Open a completed run to inspect the suite or individual test report." })
      ] }),
      index.runs.length === 0 ? /* @__PURE__ */ jsx4("div", { className: "empty-state", children: "No UsbUiTest reports found." }) : /* @__PURE__ */ jsxs2("table", { children: [
        /* @__PURE__ */ jsx4("thead", { children: /* @__PURE__ */ jsxs2("tr", { children: [
          /* @__PURE__ */ jsx4("th", { children: "TEST NAME" }),
          /* @__PURE__ */ jsx4("th", { children: "APPS" }),
          /* @__PURE__ */ jsx4("th", { children: "DURATION" }),
          /* @__PURE__ */ jsx4("th", { children: "STATUS" }),
          /* @__PURE__ */ jsx4("th", { children: "RESULT" }),
          /* @__PURE__ */ jsx4("th", { children: "RAN ON" }),
          /* @__PURE__ */ jsx4("th", { children: "Triggered From" })
        ] }) }),
        /* @__PURE__ */ jsx4("tbody", { children: index.runs.map((run) => /* @__PURE__ */ jsx4(RunIndexRow, { run, navigate }, run.runId)) })
      ] })
    ] })
  ] }) });
}
function RunIndexRow({ run, navigate }) {
  const resultLabel = run.passedCount + run.failedCount === 0 ? "NA" : `${run.passedCount} / ${run.selectedTestCount}`;
  const href = buildRunRoute(run.runId);
  const iconSrc = run.displayKind === "suite" ? TEST_SUITE_ICON_SRC : TEST_ICON_SRC;
  const onRowClick = () => {
    if (navigate) navigate(href);
    else window.location.href = href;
  };
  const onLinkClick = (event) => {
    if (!navigate) return;
    event.preventDefault();
    event.stopPropagation();
    navigate(href);
  };
  return /* @__PURE__ */ jsxs2("tr", { className: "history-row", onClick: onRowClick, children: [
    /* @__PURE__ */ jsx4("td", { children: /* @__PURE__ */ jsxs2("div", { className: "run-name-cell", children: [
      /* @__PURE__ */ jsx4(TintedPngIcon, { src: iconSrc }),
      /* @__PURE__ */ jsxs2("div", { className: "run-name-copy", children: [
        /* @__PURE__ */ jsx4("a", { className: "run-name-link", href, onClick: onLinkClick, children: run.displayName }),
        /* @__PURE__ */ jsx4("div", { className: "run-secondary", children: run.runId })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx4("td", { children: run.appLabel }),
    /* @__PURE__ */ jsx4("td", { children: run.durationMs > 0 ? formatLongDuration(run.durationMs) : "NA" }),
    /* @__PURE__ */ jsx4("td", { children: /* @__PURE__ */ jsx4(StatusPill, { status: run.success ? "success" : "failure" }) }),
    /* @__PURE__ */ jsx4("td", { children: resultLabel }),
    /* @__PURE__ */ jsx4("td", { children: /* @__PURE__ */ jsxs2("span", { className: "run-on-badge", children: [
      /* @__PURE__ */ jsx4("img", { className: "png-icon", src: LOCAL_ICON_SRC, alt: "" }),
      /* @__PURE__ */ jsx4("span", { children: "Local" })
    ] }) }),
    /* @__PURE__ */ jsx4("td", { children: run.triggeredFrom })
  ] });
}

// src/ui/pages/RunDetailView.tsx
import { useEffect, useMemo } from "react";

// src/ui/viewModel.ts
function toReportViewModel(manifest) {
  const runId = manifest.run.runId;
  return {
    ...manifest,
    input: {
      ...manifest.input,
      suite: manifest.input.suite ? {
        ...manifest.input.suite,
        snapshotYamlPath: manifest.input.suite.snapshotYamlPath ? buildRunScopedArtifactPath(runId, manifest.input.suite.snapshotYamlPath) : void 0,
        snapshotJsonPath: manifest.input.suite.snapshotJsonPath ? buildRunScopedArtifactPath(runId, manifest.input.suite.snapshotJsonPath) : void 0
      } : void 0,
      tests: manifest.input.tests.map((test) => toSelectedTestViewModel(runId, test))
    },
    tests: manifest.tests.map((test) => toTestViewModel(runId, test)),
    paths: {
      ...manifest.paths,
      runJson: buildRunScopedArtifactPath(runId, manifest.paths.runJson),
      summaryJson: buildRunScopedArtifactPath(runId, manifest.paths.summaryJson),
      log: buildRunScopedArtifactPath(runId, manifest.paths.log),
      runContextJson: manifest.paths.runContextJson ? buildRunScopedArtifactPath(runId, manifest.paths.runContextJson) : void 0
    }
  };
}
function toSelectedTestViewModel(runId, test) {
  return {
    ...test,
    snapshotYamlPath: test.snapshotYamlPath ? buildRunScopedArtifactPath(runId, test.snapshotYamlPath) : void 0,
    snapshotJsonPath: test.snapshotJsonPath ? buildRunScopedArtifactPath(runId, test.snapshotJsonPath) : void 0
  };
}
function toTestViewModel(runId, test) {
  return {
    ...test,
    snapshotYamlPath: test.snapshotYamlPath ? buildRunScopedArtifactPath(runId, test.snapshotYamlPath) : void 0,
    snapshotJsonPath: test.snapshotJsonPath ? buildRunScopedArtifactPath(runId, test.snapshotJsonPath) : void 0,
    previewScreenshotPath: test.previewScreenshotPath ? buildRunScopedArtifactPath(runId, test.previewScreenshotPath) : void 0,
    resultJsonPath: test.resultJsonPath ? buildRunScopedArtifactPath(runId, test.resultJsonPath) : void 0,
    recordingFile: test.recordingFile ? buildRunScopedArtifactPath(runId, test.recordingFile) : void 0,
    deviceLogFile: test.deviceLogFile ? buildRunScopedArtifactPath(runId, test.deviceLogFile) : void 0,
    steps: test.steps.map((step) => ({
      ...step,
      screenshotFile: step.screenshotFile ? buildRunScopedArtifactPath(runId, step.screenshotFile) : void 0,
      stepJsonFile: step.stepJsonFile ? buildRunScopedArtifactPath(runId, step.stepJsonFile) : void 0
    })),
    firstFailure: test.firstFailure ? {
      ...test.firstFailure,
      screenshotPath: test.firstFailure.screenshotPath ? buildRunScopedArtifactPath(runId, test.firstFailure.screenshotPath) : void 0,
      stepJsonPath: test.firstFailure.stepJsonPath ? buildRunScopedArtifactPath(runId, test.firstFailure.stepJsonPath) : void 0
    } : void 0
  };
}
function buildRunScopedArtifactPath(runId, relativePath) {
  if (isAbsoluteHttpUrl(relativePath)) return relativePath;
  return buildArtifactRoute(`${runId}/${relativePath}`);
}
function isAbsoluteHttpUrl(value) {
  return /^(?:https?:)?\/\//i.test(value);
}
function buildTestListItems(manifest) {
  const executedById = new Map(manifest.tests.map((test) => [test.testId, test]));
  const selectedTests = manifest.input.tests;
  if (selectedTests.length === 0) {
    return manifest.tests.map((test) => ({
      input: {
        testId: test.testId,
        name: test.testName,
        relativePath: test.relativePath,
        workspaceSourcePath: test.workspaceSourcePath,
        snapshotYamlPath: test.snapshotYamlPath,
        snapshotJsonPath: test.snapshotJsonPath,
        snapshotYamlText: test.snapshotYamlText,
        bindingReferences: test.bindingReferences,
        setup: [],
        steps: [],
        expected_state: []
      },
      executed: test,
      status: classifyTestStatus(test),
      durationLabel: formatLongDuration(test.durationMs)
    }));
  }
  return selectedTests.map((selected) => {
    const executed = executedById.get(selected.testId);
    return {
      input: selected,
      executed,
      status: executed ? classifyTestStatus(executed) : "not_executed",
      durationLabel: executed ? formatLongDuration(executed.durationMs) : "NA"
    };
  });
}
function summarizeTestItems(items) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1;
      if (item.status === "success") summary.success += 1;
      else if (item.status === "aborted") summary.aborted += 1;
      else if (item.status === "failure") summary.failure += 1;
      else if (item.status === "error") summary.error += 1;
      else summary.notExecuted += 1;
      return summary;
    },
    { total: 0, success: 0, aborted: 0, failure: 0, error: 0, notExecuted: 0 }
  );
}
function classifyTestStatus(test) {
  if (test.status === "aborted") return "aborted";
  if (test.success) return "success";
  if (test.steps[0]?.actionType === "run_failure") return "error";
  return "failure";
}
function resolveRunTarget(manifest) {
  return manifest.run.target ?? { type: "direct" };
}
function deriveReportTitle(manifest) {
  const target = resolveRunTarget(manifest);
  if (target.type === "suite" && target.suiteName) {
    return target.suiteName;
  }
  if (manifest.input.tests.length === 1) {
    return manifest.input.tests[0]?.name || manifest.run.runId;
  }
  if (manifest.input.tests.length > 1) {
    const first = manifest.input.tests[0];
    return `${first?.name || "Selected tests"} +${manifest.input.tests.length - 1} more`;
  }
  return manifest.run.runId;
}
function resolveStepReasoning(step) {
  const title = normalizeStepText(step.naturalLanguageAction || step.actionType);
  for (const candidate of [step.thought?.think, step.thought?.plan, step.reason]) {
    const normalized = normalizeStepText(candidate);
    if (!normalized || normalized === title) {
      continue;
    }
    return normalized;
  }
  return void 0;
}
function normalizeStepText(value) {
  const normalized = value?.trim();
  return normalized ? normalized : void 0;
}
function formatRelativeTime(timestamp) {
  const deltaMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const totalMinutes = Math.floor(deltaMs / 6e4);
  if (totalMinutes < 1) return "just now";
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours}h`;
  const totalDays = Math.floor(totalHours / 24);
  if (totalDays < 7) return `${totalDays}d`;
  const totalWeeks = Math.floor(totalDays / 7);
  return `${totalWeeks}w`;
}
function formatVideoTimestamp(videoOffsetMs) {
  if (videoOffsetMs === void 0) return "00:00";
  const wholeSeconds = Math.floor(Math.max(0, videoOffsetMs / 1e3));
  const minutesPart = Math.floor(wholeSeconds / 60);
  const secondsPart = wholeSeconds % 60;
  return `${String(minutesPart).padStart(2, "0")}:${String(secondsPart).padStart(2, "0")}`;
}
function statusLabelLong(status) {
  if (status === "error") return "Error";
  if (status === "aborted") return "Aborted";
  if (status === "failure") return "Failed";
  if (status === "not_executed") return "Not executed";
  return "Passed";
}
function reportPayloadForController(manifest) {
  return {
    tests: manifest.tests.map((test) => ({
      testId: test.testId,
      recordingFile: test.recordingFile,
      steps: test.steps.map((step) => ({
        videoOffsetMs: step.videoOffsetMs,
        screenshotFile: step.screenshotFile
      }))
    }))
  };
}

// src/ui/components/DetailSectionCard.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function DetailSectionCard({
  title,
  subtitle,
  content,
  action,
  cardClass
}) {
  return /* @__PURE__ */ jsx5("div", { className: "detail-section-shell", children: /* @__PURE__ */ jsxs3("div", { className: `detail-section-card ${cardClass ?? ""}`.trim(), children: [
    /* @__PURE__ */ jsxs3("div", { className: "detail-section-header", children: [
      /* @__PURE__ */ jsxs3("div", { className: "detail-section-copy", children: [
        /* @__PURE__ */ jsx5("h3", { className: "detail-section-title", children: title }),
        /* @__PURE__ */ jsx5("p", { className: "detail-section-subtitle", children: subtitle })
      ] }),
      action
    ] }),
    content
  ] }) });
}

// src/ui/client/runDetailController.ts
var payload = { tests: [] };
var testMap = {};
function initRunDetailController(next) {
  payload = next;
  testMap = Object.fromEntries(payload.tests.map((test) => [test.testId, test]));
  document.addEventListener("click", handleLogLineClick);
  document.addEventListener("input", handleInputDelegation);
  document.addEventListener("keydown", handleCmdF);
  const logInlines = document.querySelectorAll(".device-log-inline");
  for (let li = 0; li < logInlines.length; li++) {
    const countEl = logInlines[li].querySelector(".device-log-match-count");
    const total = logInlines[li].querySelectorAll(".device-log-line").length;
    if (countEl) countEl.textContent = total + " lines";
  }
  updatePrimaryBackButton();
  for (const test of payload.tests) {
    if (test.steps.length > 0) {
      selectStep(test.testId, 0);
    }
  }
  return () => {
    document.removeEventListener("click", handleLogLineClick);
    document.removeEventListener("input", handleInputDelegation);
    document.removeEventListener("keydown", handleCmdF);
  };
}
function switchTab(button) {
  const panel = button.closest(".tabs-panel");
  if (!panel) return;
  const tabName = button.dataset.tab;
  for (const btn of panel.querySelectorAll(".tab-button")) {
    btn.classList.toggle("is-active", btn.dataset.tab === tabName);
  }
  for (const content of panel.querySelectorAll(".tab-content")) {
    content.classList.toggle("is-active", content.dataset.tabContent === tabName);
  }
  if (tabName === "logs") {
    const container = panel.closest("[data-step-detail]");
    const video = container ? container.querySelector('[data-role="recording-video"]') : null;
    if (container && video && Number.isFinite(video.currentTime)) {
      highlightNearestLogLine(container, video.currentTime);
    }
  }
}
function clearTestSelection() {
  const overview = document.getElementById("suite-overview");
  if (overview) {
    overview.style.display = "block";
  }
  for (const panel of document.querySelectorAll("[data-test-panel]")) {
    panel.classList.remove("is-visible");
  }
  updatePrimaryBackButton();
}
function selectTest(testId) {
  const overview = document.getElementById("suite-overview");
  if (overview) {
    overview.style.display = "none";
  }
  for (const panel of document.querySelectorAll("[data-test-panel]")) {
    panel.classList.toggle("is-visible", panel.dataset.testPanel === testId);
  }
  if (testMap[testId] && testMap[testId].steps.length > 0) {
    selectStep(testId, 0);
  }
  updatePrimaryBackButton();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function hasVisibleTestPanel() {
  for (const panel of document.querySelectorAll("[data-test-panel]")) {
    if (panel.classList.contains("is-visible")) {
      return true;
    }
  }
  return false;
}
function updatePrimaryBackButton() {
  const button = document.getElementById("primary-back-button");
  if (!button) {
    return;
  }
  const label = hasVisibleTestPanel() ? "Back to suite overview" : "Back to run history";
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
}
function handlePrimaryBack(event) {
  if (!hasVisibleTestPanel()) {
    return true;
  }
  event.preventDefault();
  clearTestSelection();
  window.scrollTo({ top: 0, behavior: "smooth" });
  return false;
}
function selectStep(testId, stepIndex) {
  const test = testMap[testId];
  const step = test?.steps?.[stepIndex];
  const container = document.querySelector('[data-step-detail="' + testId + '"]');
  if (!container || !step) {
    return;
  }
  setSelectedStep(testId, stepIndex);
  syncRecording(container, test, step);
}
function setSelectedStep(testId, stepIndex) {
  for (const button of document.querySelectorAll('[data-test-id="' + testId + '"][data-step-index]')) {
    button.classList.toggle("is-selected", Number(button.dataset.stepIndex) === stepIndex);
  }
}
function selectNearestStepForTime(testId, targetSeconds) {
  const test = testMap[testId];
  if (!test) {
    return;
  }
  const nearestStepIndex = findNearestStepIndex(test, targetSeconds);
  if (nearestStepIndex === null) {
    return;
  }
  const step = test.steps[nearestStepIndex];
  const container = document.querySelector('[data-step-detail="' + testId + '"]');
  if (!container || !step) {
    return;
  }
  setSelectedStep(testId, nearestStepIndex);
  updateRecordingCaption(container, test, step, targetSeconds);
}
function findNearestStepIndex(test, targetSeconds) {
  let nearestIndex = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const [index, step] of test.steps.entries()) {
    if (typeof step.videoOffsetMs !== "number") {
      continue;
    }
    const stepSeconds = Math.max(0, step.videoOffsetMs / 1e3);
    const distance = Math.abs(stepSeconds - targetSeconds);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }
  return nearestIndex;
}
function formatVideoClock(totalSeconds) {
  const wholeSeconds = Math.floor(Math.max(0, Number(totalSeconds || 0)));
  const minutesPart = Math.floor(wholeSeconds / 60);
  const secondsPart = wholeSeconds % 60;
  return String(minutesPart).padStart(2, "0") + ":" + String(secondsPart).padStart(2, "0");
}
function highlightNearestLogLine(container, targetSeconds) {
  const logContainer = container.querySelector(".device-log-inline");
  if (!logContainer) return;
  const recordingStarted = logContainer.dataset.recordingStarted;
  if (!recordingStarted) return;
  const recStartMs = new Date(recordingStarted).getTime();
  if (!Number.isFinite(recStartMs)) return;
  let nearest = null;
  let nearestDist = Infinity;
  const lines = logContainer.querySelectorAll(".device-log-line[data-log-ts]:not(.is-hidden)");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ts = line.dataset.logTs;
    if (!ts) continue;
    const lineMs = new Date(ts).getTime();
    if (!Number.isFinite(lineMs)) continue;
    const lineSeconds = Math.max(0, (lineMs - recStartMs) / 1e3);
    const dist = Math.abs(lineSeconds - targetSeconds);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = line;
    }
  }
  const active = logContainer.querySelectorAll(".device-log-line.is-active");
  for (let j = 0; j < active.length; j++) {
    active[j].classList.remove("is-active");
  }
  if (nearest) {
    nearest.classList.add("is-active");
    nearest.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
function handleLogLineClick(event) {
  const target = event.target;
  const line = target?.closest(".device-log-line");
  if (!line) return;
  const logTs = line.dataset.logTs;
  if (!logTs) return;
  const container = line.closest(".workspace");
  if (!container) return;
  const logContainer = line.closest(".device-log-inline");
  const recordingStarted = logContainer ? logContainer.dataset.recordingStarted : null;
  if (!recordingStarted) return;
  const logTimeMs = new Date(logTs).getTime();
  const recStartMs = new Date(recordingStarted).getTime();
  if (!Number.isFinite(logTimeMs) || !Number.isFinite(recStartMs)) return;
  const offsetSeconds = Math.max(0, (logTimeMs - recStartMs) / 1e3);
  const video = container.querySelector('[data-role="recording-video"]');
  if (video) {
    const anyVideo = video;
    if (typeof anyVideo.fastSeek === "function") {
      anyVideo.fastSeek(offsetSeconds);
    } else {
      video.currentTime = offsetSeconds;
    }
  }
  const seekbar = container.querySelector('[data-role="recording-seekbar"]');
  if (seekbar) {
    seekbar.value = String(offsetSeconds);
  }
  const currentDisplay = container.querySelector('[data-role="recording-current"]');
  if (currentDisplay) {
    currentDisplay.textContent = formatVideoClock(offsetSeconds);
  }
  if (logContainer) {
    const activeLines = logContainer.querySelectorAll(".device-log-line.is-active");
    for (let i = 0; i < activeLines.length; i++) {
      activeLines[i].classList.remove("is-active");
    }
  }
  line.classList.add("is-active");
  const testId = container.dataset.stepDetail;
  if (testId) {
    selectNearestStepForTime(testId, offsetSeconds);
  }
}
function applyLogVisibility(logInline) {
  const searchInput = logInline.querySelector(".device-log-search");
  const term = (searchInput ? searchInput.value : "").toLowerCase();
  const activeFilters = [];
  const chips = logInline.querySelectorAll(".log-filter-chip");
  for (let c = 0; c < chips.length; c++) {
    const chip = chips[c];
    if (chip.classList.contains("is-active") && chip.dataset.logLevel !== "all") {
      activeFilters.push(chip.dataset.logLevel);
    }
  }
  const allChip = logInline.querySelector('.log-filter-chip[data-log-level="all"]');
  const showAll = Boolean(allChip && allChip.classList.contains("is-active"));
  const lines = logInline.querySelectorAll(".device-log-line");
  let visible = 0;
  const total = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.textContent || "";
    const matchesSearch = !term || text.toLowerCase().indexOf(term) !== -1;
    const matchesLevel = showAll || activeFilters.indexOf(line.dataset.logLevel) !== -1;
    if (matchesSearch && matchesLevel) {
      line.classList.remove("is-hidden");
      visible++;
    } else {
      line.classList.add("is-hidden");
    }
  }
  const countEl = logInline.querySelector(".device-log-match-count");
  if (countEl) {
    countEl.textContent = term || !showAll ? visible + " / " + total + " lines" : total + " lines";
  }
}
function handleLogSearch(input) {
  const logInline = input.closest(".device-log-inline");
  if (logInline) applyLogVisibility(logInline);
}
function handleLogFilter(chip) {
  const logInline = chip.closest(".device-log-inline");
  if (!logInline) return;
  const level = chip.dataset.logLevel;
  if (level === "all") {
    const chips = logInline.querySelectorAll(".log-filter-chip");
    for (let i = 0; i < chips.length; i++) {
      chips[i].classList.toggle("is-active", chips[i].dataset.logLevel === "all");
    }
  } else {
    const allChip = logInline.querySelector('.log-filter-chip[data-log-level="all"]');
    chip.classList.toggle("is-active");
    let anyActive = false;
    const levelChips = logInline.querySelectorAll('.log-filter-chip:not([data-log-level="all"])');
    for (let j = 0; j < levelChips.length; j++) {
      if (levelChips[j].classList.contains("is-active")) anyActive = true;
    }
    if (allChip) {
      allChip.classList.toggle("is-active", !anyActive);
    }
  }
  applyLogVisibility(logInline);
}
function handleInputDelegation(e) {
  const target = e.target;
  if (target && target.classList && target.classList.contains("device-log-search")) {
    handleLogSearch(target);
  }
}
function handleCmdF(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    const activePanel = document.querySelector("[data-test-panel].is-visible");
    const activeLogTab = activePanel ? activePanel.querySelector('.tab-content.is-active[data-tab-content="logs"]') : null;
    if (activeLogTab) {
      const searchInput = activeLogTab.querySelector(".device-log-search");
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    }
  }
}
function syncRecordingShell(container, video) {
  const shell = container.querySelector(".recording-shell");
  if (!shell) {
    return;
  }
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    shell.style.setProperty("--recording-aspect-ratio", String(video.videoWidth) + " / " + String(video.videoHeight));
    return;
  }
  shell.style.removeProperty("--recording-aspect-ratio");
}
function ensureRecordingControls(container) {
  const video = container.querySelector('[data-role="recording-video"]');
  const seekbar = container.querySelector('[data-role="recording-seekbar"]');
  const playPause = container.querySelector('[data-role="recording-playpause"]');
  const speed = container.querySelector('[data-role="recording-speed"]');
  if (!video || !seekbar || !playPause || video.dataset.seekbarBound === "1") {
    return;
  }
  const syncControls = () => {
    syncRecordingShell(container, video);
    updateRecordingControls(container, video);
  };
  const applySeek = () => {
    const nextTime = Number(seekbar.value || 0);
    if (!Number.isFinite(nextTime)) {
      return;
    }
    const anyVideo = video;
    if (typeof anyVideo.fastSeek === "function") {
      anyVideo.fastSeek(nextTime);
    } else {
      video.currentTime = nextTime;
    }
    syncControls();
    const testId = container.getAttribute("data-step-detail");
    if (testId) {
      selectNearestStepForTime(testId, nextTime);
    }
    highlightNearestLogLine(container, nextTime);
  };
  const togglePlayback = async () => {
    const screenshot = container.querySelector('[data-role="recording-screenshot"]');
    if (screenshot && screenshot.style.display !== "none") {
      screenshot.style.display = "none";
      video.style.display = "block";
    }
    try {
      if (video.paused || video.ended) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (err) {
      console.warn("[usb-ui-test-report] video play() failed:", err);
    }
    syncControls();
  };
  const applyPlaybackRate = () => {
    if (!speed) {
      return;
    }
    const nextRate = Number(speed.value || 2);
    if (!Number.isFinite(nextRate) || nextRate <= 0) {
      return;
    }
    video.playbackRate = nextRate;
    syncControls();
  };
  video.addEventListener("loadedmetadata", syncControls);
  video.addEventListener("durationchange", syncControls);
  video.addEventListener("timeupdate", syncControls);
  video.addEventListener("play", syncControls);
  video.addEventListener("pause", syncControls);
  video.addEventListener("ended", syncControls);
  video.addEventListener("emptied", syncControls);
  video.addEventListener("ratechange", syncControls);
  seekbar.addEventListener("input", applySeek);
  seekbar.addEventListener("change", applySeek);
  playPause.addEventListener("click", togglePlayback);
  if (speed) {
    speed.value = speed.value || "2";
    video.playbackRate = Number(speed.value || 2);
    speed.addEventListener("change", applyPlaybackRate);
  }
  let lastLogHighlightTime = 0;
  video.addEventListener("timeupdate", () => {
    const now = Date.now();
    if (now - lastLogHighlightTime < 500) return;
    lastLogHighlightTime = now;
    highlightNearestLogLine(container, video.currentTime);
  });
  video.dataset.seekbarBound = "1";
}
function updateRecordingControls(container, video) {
  const seekbar = container.querySelector('[data-role="recording-seekbar"]');
  const current = container.querySelector('[data-role="recording-current"]');
  const duration = container.querySelector('[data-role="recording-duration"]');
  const playPause = container.querySelector('[data-role="recording-playpause"]');
  const speed = container.querySelector('[data-role="recording-speed"]');
  if (!seekbar || !current || !duration || !playPause) {
    return;
  }
  const totalSeconds = Number.isFinite(video.duration) ? Math.max(video.duration, 0) : 0;
  const currentSeconds = Number.isFinite(video.currentTime) ? Math.max(video.currentTime, 0) : 0;
  seekbar.max = String(totalSeconds);
  seekbar.value = String(Math.min(currentSeconds, totalSeconds || currentSeconds));
  seekbar.disabled = totalSeconds <= 0;
  current.textContent = formatVideoClock(currentSeconds);
  duration.textContent = totalSeconds > 0 ? formatVideoClock(totalSeconds) : "--:--";
  playPause.innerHTML = video.paused || video.ended ? PLAY_ICON_SVG2 : PAUSE_ICON_SVG;
  playPause.setAttribute("aria-label", video.paused || video.ended ? "Play recording" : "Pause recording");
  playPause.setAttribute("title", video.paused || video.ended ? "Play recording" : "Pause recording");
  if (speed) {
    speed.disabled = !(video.currentSrc || video.src);
  }
}
function syncRecording(container, test, step) {
  const video = container.querySelector('[data-role="recording-video"]');
  const screenshot = container.querySelector('[data-role="recording-screenshot"]');
  const empty = container.querySelector('[data-role="empty-recording"]');
  const controls = container.querySelector('[data-role="recording-controls"]');
  const hasVideoSync = Boolean(test.recordingFile) && step.videoOffsetMs !== void 0 && step.videoOffsetMs !== null;
  const hasScreenshot = Boolean(step.screenshotFile);
  if (!test.recordingFile && !hasScreenshot) {
    if (empty) empty.style.display = "block";
    if (video) video.style.display = "none";
    if (screenshot) screenshot.style.display = "none";
    if (controls) controls.style.display = "none";
    if (video) syncRecordingShell(container, video);
    updateRecordingCaption(container, test);
    return;
  }
  if (empty) empty.style.display = "none";
  if (!hasVideoSync && hasScreenshot && screenshot) {
    if (video) video.style.display = "none";
    if (controls) controls.style.display = test.recordingFile ? "block" : "none";
    screenshot.style.display = "block";
    if (step.screenshotFile && screenshot.getAttribute("src") !== step.screenshotFile) {
      screenshot.src = step.screenshotFile;
    }
    if (video) ensureRecordingControls(container);
    updateRecordingCaption(container, test, step);
    return;
  }
  if (!video) return;
  ensureRecordingControls(container);
  if (screenshot) screenshot.style.display = "none";
  video.style.display = "block";
  if (controls) controls.style.display = "block";
  if (step.videoOffsetMs === void 0 || step.videoOffsetMs === null) {
    video.pause();
    updateRecordingControls(container, video);
    updateRecordingCaption(container, test, step);
    return;
  }
  const seekSeconds = Math.max(0, step.videoOffsetMs / 1e3);
  updateRecordingCaption(container, test, step);
  const applySeek = () => {
    const duration = Number.isFinite(video.duration) ? video.duration : void 0;
    const clampedSeconds = duration === void 0 ? seekSeconds : Math.min(seekSeconds, Math.max(duration - 0.05, 0));
    video.pause();
    const anyVideo = video;
    if (typeof anyVideo.fastSeek === "function") {
      anyVideo.fastSeek(clampedSeconds);
    } else {
      video.currentTime = clampedSeconds;
    }
    syncRecordingShell(container, video);
    updateRecordingControls(container, video);
  };
  if (video.readyState >= 1) {
    applySeek();
    return;
  }
  const handleLoadedMetadata = () => {
    video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    applySeek();
  };
  video.addEventListener("loadedmetadata", handleLoadedMetadata);
  video.load();
}
function updateRecordingCaption(container, test, step, currentSeconds) {
  const label = container.querySelector('[data-role="recording-caption"]');
  if (!label) {
    return;
  }
  if (!test.recordingFile) {
    label.textContent = "No session recording was captured for this test.";
    return;
  }
  if (!step) {
    label.textContent = "No recorded actions are available for this test.";
    return;
  }
  if (step.videoOffsetMs === void 0 || step.videoOffsetMs === null) {
    label.textContent = "No synced recording timestamp is available for the selected step.";
    return;
  }
  if (typeof currentSeconds === "number" && Number.isFinite(currentSeconds)) {
    label.textContent = "Viewing " + formatVideoClock(currentSeconds) + " with the nearest recorded action selected.";
    return;
  }
  label.textContent = "Paused at " + formatVideoClock(step.videoOffsetMs / 1e3) + " for the selected step.";
}
var PLAY_ICON_SVG2 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6.5v11l9-5.5-9-5.5z"></path></svg>';
var PAUSE_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6.5h3.5v11H7zm6.5 0H17v11h-3.5z"></path></svg>';

// src/ui/components/StepButton.tsx
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function StepButton({
  testId,
  step,
  index
}) {
  const statusClass = step.success ? "success" : step.actionType === "run_failure" ? "error" : "failure";
  const reasoning = resolveStepReasoning(step);
  const glyph = statusClass === "success" ? "\u2713" : "!";
  const title = step.naturalLanguageAction || step.actionType;
  const durationMs = step.durationMs ?? step.trace?.totalMs ?? 0;
  const duration = durationMs > 0 ? formatStepDuration(durationMs) : null;
  return /* @__PURE__ */ jsxs4(
    "button",
    {
      className: `step-button${index === 0 ? " is-selected" : ""}`,
      "data-test-id": testId,
      "data-step-index": index,
      onClick: () => selectStep(testId, index),
      type: "button",
      children: [
        /* @__PURE__ */ jsxs4("div", { className: "step-row", children: [
          /* @__PURE__ */ jsx6("span", { className: `step-icon ${statusClass}`, children: glyph }),
          /* @__PURE__ */ jsx6("div", { className: "step-copy", children: /* @__PURE__ */ jsx6("div", { className: "step-title", children: title }) }),
          duration ? /* @__PURE__ */ jsx6("div", { className: "duration-chip", children: duration }) : null
        ] }),
        reasoning ? /* @__PURE__ */ jsx6("div", { className: "step-expanded", children: /* @__PURE__ */ jsx6("div", { className: "step-reasoning-copy", children: reasoning }) }) : null
      ]
    }
  );
}

// src/ui/components/VideoPanel.tsx
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function VideoPanel({
  testId,
  recordingFile,
  initialVideoOffsetMs,
  initialScreenshotFile
}) {
  const recordingSpeedId = `recording-speed-${testId}`;
  const initialSeekValue = initialVideoOffsetMs !== void 0 ? String(Math.max(0, initialVideoOffsetMs / 1e3)) : "0";
  const showScreenshotInitially = initialVideoOffsetMs === void 0 && Boolean(initialScreenshotFile);
  return /* @__PURE__ */ jsxs5("div", { className: "video-panel", children: [
    /* @__PURE__ */ jsxs5("div", { className: "media-shell recording-shell", children: [
      recordingFile ? /* @__PURE__ */ jsx7(
        "video",
        {
          "data-role": "recording-video",
          playsInline: true,
          preload: "metadata",
          src: recordingFile,
          style: showScreenshotInitially ? { display: "none" } : void 0
        }
      ) : null,
      initialScreenshotFile ? /* @__PURE__ */ jsx7(
        "img",
        {
          "data-role": "recording-screenshot",
          src: initialScreenshotFile,
          alt: "",
          style: showScreenshotInitially ? void 0 : { display: "none" }
        }
      ) : null,
      !recordingFile && !initialScreenshotFile ? /* @__PURE__ */ jsx7("div", { className: "empty-shot", "data-role": "empty-recording", children: "No session recording was captured for this test." }) : null,
      recordingFile ? /* @__PURE__ */ jsx7(
        "div",
        {
          className: "empty-shot",
          "data-role": "empty-recording",
          style: { display: "none" },
          children: "No session recording was captured for this test."
        }
      ) : null
    ] }),
    /* @__PURE__ */ jsx7(
      "div",
      {
        className: "recording-controls",
        "data-role": "recording-controls",
        style: { display: recordingFile ? "block" : "none" },
        children: /* @__PURE__ */ jsxs5("div", { className: "recording-control-row", children: [
          /* @__PURE__ */ jsx7(
            "button",
            {
              className: "recording-icon-button primary",
              "data-role": "recording-playpause",
              type: "button",
              "aria-label": "Play recording",
              title: "Play recording",
              dangerouslySetInnerHTML: { __html: PLAY_ICON_SVG }
            }
          ),
          /* @__PURE__ */ jsx7("span", { className: "recording-time", "data-role": "recording-current", children: formatVideoTimestamp(initialVideoOffsetMs) }),
          /* @__PURE__ */ jsx7(
            "input",
            {
              className: "recording-timeline",
              "data-role": "recording-seekbar",
              type: "range",
              min: "0",
              max: initialSeekValue,
              step: "0.1",
              defaultValue: initialSeekValue,
              "aria-label": "Seek recording timeline"
            }
          ),
          /* @__PURE__ */ jsx7("span", { className: "recording-time", "data-role": "recording-duration", children: "--:--" }),
          /* @__PURE__ */ jsx7("label", { className: "visually-hidden", htmlFor: recordingSpeedId, children: "Playback speed" }),
          /* @__PURE__ */ jsxs5(
            "select",
            {
              className: "recording-speed",
              "data-role": "recording-speed",
              id: recordingSpeedId,
              "aria-label": "Playback speed",
              defaultValue: "2",
              children: [
                /* @__PURE__ */ jsx7("option", { value: "1", children: "1x" }),
                /* @__PURE__ */ jsx7("option", { value: "2", children: "2x" }),
                /* @__PURE__ */ jsx7("option", { value: "4", children: "4x" }),
                /* @__PURE__ */ jsx7("option", { value: "8", children: "8x" })
              ]
            }
          )
        ] })
      }
    )
  ] });
}

// src/ui/logs.ts
function parseLogTimestamp(line, referenceDate) {
  const androidMatch = /^(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})/.exec(line);
  if (androidMatch) {
    const [, month, day, hour, min, sec, ms] = androidMatch;
    const year = referenceDate ? new Date(referenceDate).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear();
    return new Date(
      year,
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(min, 10),
      parseInt(sec, 10),
      parseInt(ms, 10)
    ).toISOString();
  }
  const iosMatch = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})/.exec(line);
  if (iosMatch) {
    return (/* @__PURE__ */ new Date(`${iosMatch[1]}T${iosMatch[2]}`)).toISOString();
  }
  return void 0;
}
function parseLogLevel(line) {
  const iosError = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+(E|Ef)\s/.exec(line);
  if (iosError) return "error";
  const iosWarn = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+(W|Wf)\s/.exec(line);
  if (iosWarn) return "warn";
  const androidMatch = /^\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+\d+\s+\d+\s+([FEWDIV])\s/.exec(line);
  if (androidMatch) {
    const level = androidMatch[1];
    if (level === "F" || level === "E") return "error";
    if (level === "W") return "warn";
  }
  return "info";
}
function parseDeviceLogLines(logText, recordingStartedAt) {
  if (!logText) return [];
  const recStartMs = recordingStartedAt ? new Date(recordingStartedAt).getTime() : void 0;
  return logText.split("\n").filter((line) => {
    if (line.length === 0) return false;
    if (recStartMs === void 0) return true;
    const ts = parseLogTimestamp(line, recordingStartedAt);
    if (!ts) return true;
    const tsMs = new Date(ts).getTime();
    return !Number.isFinite(tsMs) || tsMs >= recStartMs;
  }).map((line) => ({
    text: line,
    timestamp: parseLogTimestamp(line, recordingStartedAt),
    level: parseLogLevel(line)
  }));
}

// src/ui/components/DeviceLogPanel.tsx
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function DeviceLogPanel({
  logText,
  recordingStartedAt,
  deviceLogFileUrl
}) {
  const lines = parseDeviceLogLines(logText, recordingStartedAt);
  return /* @__PURE__ */ jsxs6("div", { className: "device-log-inline", "data-recording-started": recordingStartedAt ?? "", children: [
    /* @__PURE__ */ jsxs6("div", { className: "device-log-toolbar", children: [
      /* @__PURE__ */ jsx8("input", { className: "device-log-search", type: "text", placeholder: "Search logs..." }),
      /* @__PURE__ */ jsx8("span", { className: "device-log-match-count" }),
      /* @__PURE__ */ jsxs6("div", { className: "device-log-filters", children: [
        /* @__PURE__ */ jsx8(
          "button",
          {
            className: "log-filter-chip is-active",
            "data-log-level": "all",
            onClick: (e) => handleLogFilter(e.currentTarget),
            type: "button",
            children: "All"
          }
        ),
        /* @__PURE__ */ jsx8(
          "button",
          {
            className: "log-filter-chip",
            "data-log-level": "error",
            onClick: (e) => handleLogFilter(e.currentTarget),
            type: "button",
            children: "Errors"
          }
        ),
        /* @__PURE__ */ jsx8(
          "button",
          {
            className: "log-filter-chip",
            "data-log-level": "warn",
            onClick: (e) => handleLogFilter(e.currentTarget),
            type: "button",
            children: "Warnings"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx8("div", { className: "device-log-lines", children: lines.length === 0 ? /* @__PURE__ */ jsx8("div", { className: "device-log-line muted", children: "No log content available." }) : lines.map((line, i) => /* @__PURE__ */ jsx8(
      "div",
      {
        className: "device-log-line",
        "data-log-ts": line.timestamp ?? "",
        "data-log-level": line.level,
        children: line.text
      },
      i
    )) }),
    /* @__PURE__ */ jsx8("a", { className: "device-log-download", href: deviceLogFileUrl, download: true, children: "Download full log" })
  ] });
}

// src/ui/components/RunContextSummary.tsx
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
function RunContextSummary({ manifest }) {
  return /* @__PURE__ */ jsxs7("div", { className: "run-context-summary", children: [
    /* @__PURE__ */ jsx9(ContextItem, { label: "Environment", value: manifest.input.environment.envName }),
    /* @__PURE__ */ jsx9(ContextItem, { label: "Platform", value: manifest.run.platform }),
    /* @__PURE__ */ jsx9(ContextItem, { label: "Model", value: manifest.run.model.label }),
    /* @__PURE__ */ jsx9(ContextItem, { label: "App", value: manifest.run.app.label })
  ] });
}
function ContextItem({ label, value }) {
  return /* @__PURE__ */ jsxs7("div", { className: "context-summary-item", children: [
    /* @__PURE__ */ jsx9("span", { className: "context-summary-label", children: label }),
    /* @__PURE__ */ jsx9("div", { className: "context-summary-value", children: value })
  ] });
}

// src/ui/components/TestDetailSection.tsx
import { jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
function TestDetailSection({
  item,
  visible,
  parentLabel,
  manifest
}) {
  const detailSubtitle = parentLabel ? `${parentLabel} \xB7 ${item.input.relativePath ?? ""}` : item.input.relativePath ?? "";
  const test = item.executed;
  const initialStep = test?.steps[0];
  const statusText = statusLabelLong(item.status);
  const analysisText = test ? test.analysis || test.message || "No overall analysis recorded." : "This test was selected for the run, but it never started. The batch ended before this test could execute.";
  const snapshotYamlText = test?.snapshotYamlText ?? item.input.snapshotYamlText;
  const snapshotYamlPath = test?.snapshotYamlPath ?? item.input.snapshotYamlPath;
  const stepCount = test?.steps.length ?? 0;
  return /* @__PURE__ */ jsxs8(
    "section",
    {
      className: `detail-shell${visible ? " is-visible" : ""}`,
      "data-test-panel": item.input.testId,
      children: [
        /* @__PURE__ */ jsxs8("div", { className: "detail-header", children: [
          /* @__PURE__ */ jsx10("div", { className: "detail-header-main", children: /* @__PURE__ */ jsxs8("div", { className: "detail-header-copy", children: [
            /* @__PURE__ */ jsx10("h2", { children: item.input.name }),
            /* @__PURE__ */ jsx10("p", { children: detailSubtitle })
          ] }) }),
          /* @__PURE__ */ jsx10(StatusPill, { status: item.status })
        ] }),
        /* @__PURE__ */ jsxs8("div", { className: "detail-meta", children: [
          /* @__PURE__ */ jsx10(MetaCard, { label: "Status", value: statusText }),
          /* @__PURE__ */ jsx10(MetaCard, { label: "Duration", value: test ? formatLongDuration(test.durationMs) : "NA" }),
          /* @__PURE__ */ jsx10(MetaCard, { label: "Steps", value: `${stepCount} recorded` }),
          /* @__PURE__ */ jsx10(MetaCard, { label: "Path", value: item.input.relativePath ?? "" })
        ] }),
        /* @__PURE__ */ jsx10(TestSpecSection, { snapshotYamlPath, snapshotYamlText }),
        manifest ? /* @__PURE__ */ jsx10(
          DetailSectionCard,
          {
            title: "Run Context",
            subtitle: "Inputs and environment captured for this report.",
            content: /* @__PURE__ */ jsx10(RunContextSummary, { manifest })
          }
        ) : null,
        /* @__PURE__ */ jsx10(
          DetailSectionCard,
          {
            title: "Analysis",
            subtitle: "Overall result commentary captured for this test.",
            action: /* @__PURE__ */ jsx10(StatusPill, { status: item.status }),
            cardClass: `analysis-card ${item.status}`,
            content: /* @__PURE__ */ jsx10("div", { className: "analysis-copy", children: analysisText })
          }
        ),
        /* @__PURE__ */ jsxs8("div", { className: "workspace", "data-step-detail": item.input.testId, children: [
          /* @__PURE__ */ jsx10(
            VideoPanel,
            {
              testId: item.input.testId,
              recordingFile: test?.recordingFile ?? void 0,
              initialVideoOffsetMs: initialStep?.videoOffsetMs ?? void 0,
              initialScreenshotFile: initialStep?.screenshotFile ?? void 0
            }
          ),
          /* @__PURE__ */ jsxs8("div", { className: "tabs-panel", children: [
            /* @__PURE__ */ jsxs8("div", { className: "tab-bar", children: [
              /* @__PURE__ */ jsx10(
                "button",
                {
                  className: "tab-button is-active",
                  "data-tab": "actions",
                  onClick: (e) => switchTab(e.currentTarget),
                  type: "button",
                  children: "Actions"
                }
              ),
              test?.deviceLogFile ? /* @__PURE__ */ jsx10(
                "button",
                {
                  className: "tab-button",
                  "data-tab": "logs",
                  onClick: (e) => switchTab(e.currentTarget),
                  type: "button",
                  children: "Device Logs"
                }
              ) : null
            ] }),
            /* @__PURE__ */ jsx10("div", { className: "tab-content is-active", "data-tab-content": "actions", children: /* @__PURE__ */ jsx10("div", { className: "timeline-scroll", children: test && test.steps.length > 0 ? test.steps.map((step, index) => /* @__PURE__ */ jsx10(StepButton, { testId: test.testId, step, index }, index)) : /* @__PURE__ */ jsx10("div", { className: "empty-panel", children: "No steps were recorded for this test." }) }) }),
            test?.deviceLogFile ? /* @__PURE__ */ jsx10("div", { className: "tab-content", "data-tab-content": "logs", children: /* @__PURE__ */ jsx10(
              DeviceLogPanel,
              {
                logText: test.deviceLogTailText ?? "",
                recordingStartedAt: test.recordingStartedAt ?? void 0,
                deviceLogFileUrl: test.deviceLogFile
              }
            ) }) : null
          ] })
        ] })
      ]
    }
  );
}
function TestSpecSection({
  snapshotYamlPath,
  snapshotYamlText
}) {
  const content = snapshotYamlText ? /* @__PURE__ */ jsx10("div", { className: "yaml-shell", children: /* @__PURE__ */ jsx10("pre", { className: "yaml-block", children: /* @__PURE__ */ jsx10("code", { children: snapshotYamlText }) }) }) : /* @__PURE__ */ jsx10("div", { className: "empty-panel", children: "Snapshot YAML was not available for this report." });
  const action = snapshotYamlPath ? /* @__PURE__ */ jsx10("a", { className: "detail-section-link", href: snapshotYamlPath, children: "Open raw YAML" }) : void 0;
  return /* @__PURE__ */ jsx10(
    DetailSectionCard,
    {
      title: "Test",
      subtitle: "Captured YAML snapshot for this test.",
      action,
      content
    }
  );
}
function MetaCard({ label, value }) {
  return /* @__PURE__ */ jsxs8("div", { className: "detail-meta-card", children: [
    /* @__PURE__ */ jsx10("strong", { children: label }),
    /* @__PURE__ */ jsx10("span", { children: value })
  ] });
}

// src/ui/components/SegmentSummary.tsx
import { Fragment, jsx as jsx11, jsxs as jsxs9 } from "react/jsx-runtime";
var SEGMENTS = [
  { label: "Success", className: "success", bg: "var(--success)" },
  { label: "Aborted", className: "aborted", bg: "var(--aborted)" },
  { label: "Failure", className: "failure", bg: "var(--failure)" },
  { label: "Error", className: "error", bg: "var(--warning)" },
  { label: "Not Executed", className: "not-executed", bg: "var(--icon)" }
];
function SegmentSummary({ summary }) {
  const entries = SEGMENTS.map((s) => ({
    ...s,
    count: countFor(s.className, summary)
  }));
  return /* @__PURE__ */ jsxs9(Fragment, { children: [
    /* @__PURE__ */ jsx11("div", { className: "segment-bar", children: entries.filter((e) => e.count > 0).map((e) => {
      const width = summary.total === 0 ? 0 : e.count / summary.total * 100;
      return /* @__PURE__ */ jsx11(
        "div",
        {
          className: `segment ${e.className}`,
          style: { width: `${width.toFixed(2)}%` }
        },
        e.className
      );
    }) }),
    /* @__PURE__ */ jsx11("div", { className: "segment-legend", children: entries.map((e) => {
      const percent = summary.total === 0 ? 0 : Math.round(e.count / summary.total * 100);
      return /* @__PURE__ */ jsxs9("span", { className: "segment-legend-item", children: [
        /* @__PURE__ */ jsx11(
          "span",
          {
            className: `segment-legend-dot ${e.className}`,
            style: { background: e.bg }
          }
        ),
        /* @__PURE__ */ jsxs9("span", { children: [
          e.label,
          " - ",
          percent,
          "%"
        ] })
      ] }, e.className);
    }) })
  ] });
}
function countFor(name, summary) {
  if (name === "success") return summary.success;
  if (name === "aborted") return summary.aborted;
  if (name === "failure") return summary.failure;
  if (name === "error") return summary.error;
  return summary.notExecuted;
}

// src/ui/pages/RunDetailView.tsx
import { Fragment as Fragment2, jsx as jsx12, jsxs as jsxs10 } from "react/jsx-runtime";
function RunDetailView({
  manifest: raw,
  navigate,
  initialTestId,
  backHref = "/"
}) {
  const manifest = useMemo(() => toReportViewModel(raw), [raw]);
  const testItems = useMemo(() => buildTestListItems(manifest), [manifest]);
  const isSingleTest = testItems.length <= 1;
  const outcomeSummary = summarizeTestItems(testItems);
  const initialTest = testItems[0];
  const reportTitle = deriveReportTitle(manifest);
  const suiteLabel = reportTitle;
  const run = manifest.run;
  useEffect(() => {
    const cleanup = initRunDetailController(reportPayloadForController(manifest));
    const requested = initialTestId ?? readTestIdFromUrl();
    if (requested && !isSingleTest) {
      const exists = testItems.some((item) => item.input.testId === requested);
      if (exists) selectTest(requested);
    }
    return cleanup;
  }, [manifest, initialTestId, isSingleTest, testItems]);
  return /* @__PURE__ */ jsx12("div", { className: "fr-report-ui", children: /* @__PURE__ */ jsxs10("main", { className: "page report-page", children: [
    /* @__PURE__ */ jsxs10("section", { className: "report-header", children: [
      /* @__PURE__ */ jsxs10("div", { className: "report-header-main", children: [
        /* @__PURE__ */ jsx12(
          "a",
          {
            className: "back-button",
            id: isSingleTest ? "report-back-button" : "primary-back-button",
            href: backHref,
            "aria-label": "Back to run history",
            title: "Back to run history",
            onClick: (e) => {
              if (!isSingleTest && !handlePrimaryBack(e.nativeEvent)) {
                return;
              }
              if (navigate) {
                e.preventDefault();
                navigate(backHref);
              }
            },
            dangerouslySetInnerHTML: { __html: BACK_ARROW_ICON_SVG }
          }
        ),
        /* @__PURE__ */ jsxs10("div", { children: [
          /* @__PURE__ */ jsx12("div", { className: "report-eyebrow", children: "Run history" }),
          /* @__PURE__ */ jsx12("h1", { className: "report-title", children: reportTitle }),
          /* @__PURE__ */ jsxs10("p", { className: "report-subtitle", children: [
            run.runId,
            " \xB7 Completed ",
            formatRelativeTime(run.completedAt),
            " ago"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx12(StatusPill, { status: run.success ? "success" : "failure" })
    ] }),
    isSingleTest ? /* @__PURE__ */ jsx12(SingleTestPage, { manifest, item: initialTest }) : /* @__PURE__ */ jsx12(
      SuiteRunPage,
      {
        manifest,
        items: testItems,
        summary: outcomeSummary,
        suiteLabel
      }
    )
  ] }) });
}
function SingleTestPage({
  manifest,
  item
}) {
  if (!item) {
    return /* @__PURE__ */ jsx12("section", { className: "overview-panel", children: /* @__PURE__ */ jsx12("div", { className: "overview-panel-body", children: /* @__PURE__ */ jsx12("div", { className: "empty-panel", children: "No test details were recorded for this run." }) }) });
  }
  return /* @__PURE__ */ jsx12(TestDetailSection, { item, visible: true, manifest });
}
function SuiteRunPage({
  manifest,
  items,
  summary,
  suiteLabel
}) {
  return /* @__PURE__ */ jsxs10(Fragment2, { children: [
    /* @__PURE__ */ jsxs10("section", { id: "suite-overview", className: "overview-grid", children: [
      /* @__PURE__ */ jsx12("section", { className: "overview-panel", children: /* @__PURE__ */ jsxs10("div", { className: "overview-panel-body", children: [
        /* @__PURE__ */ jsx12("h2", { className: "overview-title", children: "Run summary" }),
        /* @__PURE__ */ jsx12("p", { className: "overview-subtitle", children: "Completed suite-level view based on the locally captured report artifacts." }),
        /* @__PURE__ */ jsxs10("div", { className: "segment-summary", children: [
          /* @__PURE__ */ jsx12("div", { className: "segment-shell", children: /* @__PURE__ */ jsx12(SegmentSummary, { summary }) }),
          /* @__PURE__ */ jsxs10("div", { className: "metric-cards", children: [
            /* @__PURE__ */ jsxs10("div", { className: "metric-card", children: [
              /* @__PURE__ */ jsxs10("div", { className: "metric-value", children: [
                summary.success,
                "/",
                summary.total
              ] }),
              /* @__PURE__ */ jsx12("div", { className: "metric-label", children: "Tests passed" })
            ] }),
            /* @__PURE__ */ jsxs10("div", { className: "metric-card", children: [
              /* @__PURE__ */ jsx12("div", { className: "metric-value", children: formatLongDuration(manifest.run.durationMs) }),
              /* @__PURE__ */ jsx12("div", { className: "metric-label", children: "Run duration" })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx12("section", { className: "overview-panel", children: /* @__PURE__ */ jsxs10("div", { className: "overview-panel-body", children: [
        /* @__PURE__ */ jsx12("h2", { className: "overview-title", children: "Run Context" }),
        /* @__PURE__ */ jsx12("p", { className: "overview-subtitle", children: "Inputs and environment captured for this report." }),
        /* @__PURE__ */ jsx12(RunContextSummary, { manifest })
      ] }) }),
      /* @__PURE__ */ jsxs10("section", { className: "suite-list-shell", children: [
        /* @__PURE__ */ jsx12("h2", { children: "Executed tests" }),
        /* @__PURE__ */ jsx12("p", { children: "Select a test to inspect the detailed step-by-step report." }),
        /* @__PURE__ */ jsxs10("table", { children: [
          /* @__PURE__ */ jsx12("thead", { children: /* @__PURE__ */ jsxs10("tr", { children: [
            /* @__PURE__ */ jsx12("th", { children: "TEST NAME" }),
            /* @__PURE__ */ jsx12("th", { children: "APPS" }),
            /* @__PURE__ */ jsx12("th", { children: "DURATION" }),
            /* @__PURE__ */ jsx12("th", { children: "STATUS" })
          ] }) }),
          /* @__PURE__ */ jsx12("tbody", { children: items.map((item) => /* @__PURE__ */ jsx12(SuiteRow, { item, appLabel: manifest.run.app.label }, item.input.testId)) })
        ] })
      ] })
    ] }),
    items.map((item) => /* @__PURE__ */ jsx12(
      TestDetailSection,
      {
        item,
        visible: false,
        parentLabel: suiteLabel,
        manifest
      },
      item.input.testId
    ))
  ] });
}
function readTestIdFromUrl() {
  if (typeof window === "undefined") return void 0;
  const params = new URLSearchParams(window.location.search);
  return params.get("test") ?? void 0;
}
function SuiteRow({ item, appLabel }) {
  return /* @__PURE__ */ jsxs10("tr", { className: "suite-row", onClick: () => selectTest(item.input.testId), children: [
    /* @__PURE__ */ jsx12("td", { children: /* @__PURE__ */ jsxs10("div", { className: "run-name-cell", children: [
      /* @__PURE__ */ jsx12(TintedPngIcon, { src: TEST_ICON_SRC }),
      /* @__PURE__ */ jsxs10("div", { className: "run-name-copy", children: [
        /* @__PURE__ */ jsx12("span", { className: "run-name-link", children: item.input.name }),
        /* @__PURE__ */ jsx12("div", { className: "run-secondary", children: item.input.relativePath ?? "" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx12("td", { children: appLabel }),
    /* @__PURE__ */ jsx12("td", { children: item.durationLabel }),
    /* @__PURE__ */ jsx12("td", { children: /* @__PURE__ */ jsx12(StatusPill, { status: item.status }) })
  ] });
}
export {
  DetailSectionCard,
  DeviceLogPanel,
  RunContextSummary,
  RunDetailView,
  RunIndexView,
  SegmentSummary,
  StatusPill,
  StepButton,
  SummaryCard,
  TestDetailSection,
  TintedPngIcon,
  VideoPanel,
  buildArtifactRoute,
  buildRunRoute,
  buildTestListItems,
  classifyTestStatus,
  clearTestSelection,
  deriveReportTitle,
  formatLongDuration,
  formatRelativeTime,
  formatStepDuration,
  formatVideoTimestamp,
  handleLogFilter,
  handlePrimaryBack,
  initRunDetailController,
  parseDeviceLogLines,
  parseLogLevel,
  parseLogTimestamp,
  selectStep,
  selectTest,
  statusLabelLong,
  statusPillLabel,
  successRateTone,
  summarizeTestItems,
  summaryIconStyle,
  switchTab,
  toReportViewModel
};
//# sourceMappingURL=index.mjs.map