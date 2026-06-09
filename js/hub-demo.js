(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  const hubState = {
    tokens: {},
    vacationDone: false,
    contractReady: false,
    printComplete: false,
    activeHubTab: "vacation",
  };

  const AGE_EXTRA = [
    [45, 10],
    [43, 9],
    [41, 8],
    [39, 7],
    [37, 6],
    [35, 5],
    [33, 4],
    [31, 3],
    [28, 2],
    [25, 1],
  ];

  let printRunning = false;

  function ageExtraDays(age) {
    for (const [limit, extra] of AGE_EXTRA) {
      if (age >= limit) return extra;
    }
    return 0;
  }

  function childDays(count) {
    if (count >= 3) return 7;
    if (count === 2) return 4;
    if (count === 1) return 2;
    return 0;
  }

  function calcAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function prorateVacation(fullYearDays, startDate) {
    const joinDate = new Date(startDate);
    const endOfYear = new Date(joinDate.getFullYear(), 11, 31);
    const daysWorked = Math.floor((endOfYear - joinDate) / 86400000) + 1;
    const totalDays = isLeapYear(joinDate.getFullYear()) ? 366 : 365;
    const exact = fullYearDays * (daysWorked / totalDays);
    const fraction = exact - Math.floor(exact);
    return fraction >= 0.5 ? Math.ceil(exact) : Math.floor(exact);
  }

  function parseBirthInput(input) {
    const raw = String(input || "").trim();
    if (!raw) return null;

    const iso = new Date(raw);
    if (!isNaN(iso.getTime()) && raw.includes("-")) return iso;

    if (/^\d{4}$/.test(raw)) {
      return new Date(parseInt(raw, 10), 0, 1);
    }

    const normalized = raw.replace(/\s/g, "").replace(/\.$/, "");
    const dotted = normalized.split(".");
    if (dotted.length === 3) {
      const y = parseInt(dotted[0], 10);
      const m = parseInt(dotted[1], 10) - 1;
      const d = parseInt(dotted[2], 10);
      const parsed = new Date(y, m, d);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    if (!isNaN(iso.getTime())) return iso;
    return null;
  }

  function parseStartInput(input) {
    const raw = String(input || "").trim();
    if (!raw) return null;

    if (raw.includes("-")) {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }

    const normalized = raw.replace(/\s/g, "").replace(/\.$/, "");
    const dotted = normalized.split(".");
    if (dotted.length === 3) {
      const y = parseInt(dotted[0], 10);
      const m = parseInt(dotted[1], 10) - 1;
      const d = parseInt(dotted[2], 10);
      const parsed = new Date(y, m, d);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    const fallback = new Date(raw);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  function computeVacation(birthInput, childrenInput, startInput) {
    const birthDate = parseBirthInput(birthInput);
    const startDate = parseStartInput(startInput);
    if (!birthDate || !startDate) return null;

    const children = Math.max(0, parseInt(childrenInput, 10) || 0);
    const age = calcAge(birthDate);
    const extra = ageExtraDays(age);
    const baseDays = 20 + extra;
    const childFull = childDays(children);
    const proratedBase = prorateVacation(baseDays, startDate);
    const proratedChild = childFull
      ? prorateVacation(childFull, startDate)
      : 0;

    return {
      age,
      extra,
      baseDays,
      childFull,
      proratedBase,
      proratedChild,
      children,
    };
  }

  function showVacationMsg(text, type) {
    const el = document.getElementById("vacation-msg");
    if (!el) return;
    el.className = "demo-msg" + (type ? " " + type : "");
    el.textContent = text;
  }

  function showPrintMsg(text, type) {
    const el = document.getElementById("print-msg");
    if (!el) return;
    el.className = "demo-msg" + (type ? " " + type : "");
    el.textContent = text;
  }

  function showContractMsg(text, type) {
    const el = document.getElementById("contract-msg");
    if (!el) return;
    el.className = "demo-msg" + (type ? " " + type : "");
    el.textContent = text;
  }

  function invalidateFromContract() {
    hubState.contractReady = false;
    hubState.printComplete = false;
    const preview = document.getElementById("contract-preview-area");
    if (preview && hubState.vacationDone) {
      preview.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-text">Fields changed — generate preview again</div></div>';
    }
    const printOutput = document.getElementById("print-output");
    if (printOutput) {
      printOutput.innerHTML =
        '<div class="empty-state"><div class="empty-icon">🖨️</div><div class="empty-text">Generate a contract first, then start the print run</div></div>';
    }
    showPrintMsg("", "");
    updateHubBridge();
  }

  function invalidateFromVacation() {
    hubState.vacationDone = false;
    hubState.tokens = {};
    invalidateFromContract();
  }

  function getEmployeeLabel() {
    const name = document.getElementById("c-name")?.value.trim();
    if (name) return name;
    const stored = hubState.tokens["{{EMPLOYEE_NAME}}"];
    if (stored && !stored.startsWith("{{")) return stored;
    return "Employee";
  }

  function updateHubBridge() {
    const bridge = document.getElementById("hub-bridge");
    if (!bridge) return;

    const tokenParts = [];
    const t = hubState.tokens;
    if (t["{{EMPLOYEE_NAME}}"] && !t["{{EMPLOYEE_NAME}}"].startsWith("{{")) {
      tokenParts.push(`{{EMPLOYEE_NAME}} = ${t["{{EMPLOYEE_NAME}}"]}`);
    }
    if (t["{{VACATION}}"]) {
      tokenParts.push(`{{VACATION}} = ${t["{{VACATION}}"]}`);
    }
    if (t["{{VACATION_CHILD}}"]) {
      tokenParts.push(`{{VACATION_CHILD}} = ${t["{{VACATION_CHILD}}"]}`);
    }

    const statusParts = [
      `Contract: ${hubState.contractReady ? "ready" : "pending"}`,
      `Print: ${hubState.printComplete ? "complete" : "pending"}`,
    ];

    let bridgeText = "<strong>Shared state:</strong> ";
    if (tokenParts.length === 0 && !hubState.vacationDone) {
      bridgeText += "No tokens yet — start with Vacation Calc";
    } else {
      bridgeText += [...tokenParts, ...statusParts].join(" · ");
    }
    bridge.innerHTML = bridgeText;

    ["vacation", "contract", "print"].forEach((step, i) => {
      const el = document.getElementById("hub-step-" + (i + 1));
      if (!el) return;
      const done =
        i === 0
          ? hubState.vacationDone
          : i === 1
            ? hubState.contractReady
            : hubState.printComplete;
      const active = hubState.activeHubTab === step;
      el.classList.toggle("done", done);
      el.classList.toggle("active", active && !done);
    });

    ["vacation", "contract", "print"].forEach((step) => {
      const chip = document.getElementById("hub-chip-" + step);
      if (!chip) return;
      const done =
        step === "vacation"
          ? hubState.vacationDone
          : step === "contract"
            ? hubState.contractReady
            : hubState.printComplete;
      chip.classList.toggle("active", hubState.activeHubTab === step);
      chip.classList.toggle("done", done && hubState.activeHubTab !== step);
    });
  }

  function switchHubTab(id) {
    hubState.activeHubTab = id;
    ["vacation", "contract", "print"].forEach((tab) => {
      document
        .getElementById("hub-tab-" + tab)
        ?.classList.toggle("active", tab === id);
    });
    updateHubBridge();
    if (id === "contract") syncStartDates("vacation");
    if (id === "vacation") syncStartDates("contract");
  }

  function syncStartDates(from) {
    const vStart = document.getElementById("v-start");
    const cDate = document.getElementById("c-date");
    if (!vStart || !cDate) return;
    if (from === "vacation" && vStart.value) cDate.value = vStart.value;
    if (from === "contract" && cDate.value) vStart.value = cDate.value;
  }

  function onStartDateChanged(from) {
    syncStartDates(from);
    if (hubState.vacationDone || hubState.contractReady) {
      invalidateFromVacation();
      showVacationMsg("Start date changed — recalculate vacation.", "error");
    }
  }

  function calculateVacation() {
    const birth = document.getElementById("v-birth")?.value;
    const children = document.getElementById("v-children")?.value;
    const start = document.getElementById("v-start")?.value;
    const result = computeVacation(birth, children, start);

    if (!result) {
      showVacationMsg(
        "Enter a valid birth date (year or YYYY.MM.DD) and start date.",
        "error",
      );
      return;
    }

    if (hubState.vacationDone) invalidateFromContract();

    hubState.tokens["{{BIRTHDATE}}"] = birth;
    hubState.tokens["{{CHILDREN_COUNT}}"] = String(result.children);
    hubState.tokens["{{START_DATE}}"] = start;
    hubState.tokens["{{VACATION}}"] = String(result.proratedBase);
    hubState.tokens["{{VACATION_CHILD}}"] = String(result.proratedChild);
    hubState.vacationDone = true;

    const breakdown = `Age: ${result.age} years
Base entitlement: ${result.baseDays} days (20 + ${result.extra} age bonus)
Child allowance (full year): ${result.childFull} days (${result.children} children)
Prorated base: ${result.proratedBase} days
Prorated child: ${result.proratedChild} days

Tokens written:
  {{VACATION}} = ${result.proratedBase}
  {{VACATION_CHILD}} = ${result.proratedChild}`;

    document.getElementById("vacation-output").innerHTML =
      `<pre class="demo-pre">${escapeHtml(breakdown)}</pre>`;
    showVacationMsg(
      "Vacation tokens ready — apply to contract or continue.",
      "success",
    );
    syncStartDates("vacation");
    updateHubBridge();
  }

  function applyVacationToContract() {
    if (!hubState.vacationDone) {
      calculateVacation();
      if (!hubState.vacationDone) return;
    }
    syncStartDates("vacation");
    switchHubTab("contract");
    generateContract();
  }

  function drawProgressBar(current, total, barLength = 20) {
    const percent = total > 0 ? current / total : 1;
    const filled = Math.round(percent * barLength);
    const arrow = "█".repeat(filled);
    const spaces = "░".repeat(barLength - filled);
    return `[${arrow}${spaces}] ${Math.round(percent * 100)}% (${current}/${total} jobs)`;
  }

  function startPrintRun() {
    if (printRunning) return;
    if (!hubState.contractReady) {
      showPrintMsg("Generate a contract preview first (step 2).", "error");
      return;
    }

    const employee = getEmployeeLabel();
    const jobs = [];
    if (document.getElementById("p-job-contract")?.checked) {
      jobs.push(`${employee} — employment contract (.docx)`);
    }
    if (document.getElementById("p-job-medical")?.checked) {
      jobs.push(`${employee} — medical form (PDF)`);
    }
    if (document.getElementById("p-job-separator")?.checked) {
      jobs.push(`${employee} — separator sheet (PDF)`);
    }
    if (jobs.length === 0) {
      showPrintMsg("Select at least one print job.", "error");
      return;
    }

    const printer =
      document.getElementById("p-printer")?.value.trim() || "PULLPRINT";
    const duplex = document.getElementById("p-duplex")?.value || "none";
    const output = document.getElementById("print-output");
    printRunning = true;
    hubState.printComplete = false;
    showPrintMsg("", "");

    const lines = [
      `Printer: ${printer}`,
      `Duplex: ${duplex}`,
      `Employee: ${employee}`,
      `Queue: ${jobs.length} job(s)`,
      "",
    ];
    output.innerHTML = `<pre class="demo-pre" id="print-log"></pre>`;
    const logEl = document.getElementById("print-log");

    let jobIdx = 0;
    let subStep = 0;

    function renderLog() {
      let text = lines.join("\n");
      if (jobIdx < jobs.length) {
        text +=
          `\n→ Sending: ${jobs[jobIdx]}\n` +
          `Progress: ${drawProgressBar(subStep, 4)}`;
      }
      logEl.textContent = text;
    }

    function tick() {
      if (jobIdx >= jobs.length) {
        lines.push(
          `\n✓ ${jobs.length}/${jobs.length} jobs sent to ${printer} (${duplex} duplex)`,
        );
        logEl.textContent = lines.join("\n");
        hubState.printComplete = true;
        printRunning = false;
        showPrintMsg("Print run complete.", "success");
        updateHubBridge();
        return;
      }
      subStep++;
      renderLog();
      if (subStep >= 4) {
        lines.push(`  ✓ Done: ${jobs[jobIdx]}`);
        subStep = 0;
        jobIdx++;
      }
      setTimeout(tick, 400);
    }
    tick();
  }

  function getContractTokens() {
    const tokens = {
      EMPLOYEE_NAME:
        document.getElementById("c-name")?.value.trim() || "{{EMPLOYEE_NAME}}",
      POSITION:
        document.getElementById("c-pos")?.value.trim() || "{{POSITION}}",
      DEPARTMENT:
        document.getElementById("c-dept")?.value.trim() || "{{DEPARTMENT}}",
      BASE_SALARY:
        document.getElementById("c-salary")?.value.trim() || "{{BASE_SALARY}}",
      CONTRACT_TYPE:
        document.getElementById("c-type")?.value.trim() || "{{CONTRACT_TYPE}}",
      VACATION: hubState.tokens["{{VACATION}}"] || "{{VACATION}}",
      VACATION_CHILD:
        hubState.tokens["{{VACATION_CHILD}}"] || "{{VACATION_CHILD}}",
    };
    const dateRaw = document.getElementById("c-date")?.value;
    tokens.START_DATE = dateRaw
      ? new Date(dateRaw).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "{{START_DATE}}";
    if (tokens.EMPLOYEE_NAME && !tokens.EMPLOYEE_NAME.startsWith("{{")) {
      hubState.tokens["{{EMPLOYEE_NAME}}"] = tokens.EMPLOYEE_NAME;
    }
    return tokens;
  }

  function isContractValid(tokens) {
    return (
      tokens.EMPLOYEE_NAME &&
      !tokens.EMPLOYEE_NAME.startsWith("{{") &&
      tokens.START_DATE &&
      !tokens.START_DATE.startsWith("{{")
    );
  }

  function generateContract() {
    const tokens = getContractTokens();

    if (!isContractValid(tokens)) {
      showContractMsg("Employee name and start date are required.", "error");
      hubState.contractReady = false;
      updateHubBridge();
      return;
    }

    showContractMsg("", "");
    hubState.printComplete = false;

    const hasVacation = !String(tokens.VACATION).startsWith("{{");

    let template = `EMPLOYMENT CONTRACT

This contract is entered into between Ericsson Hungary Ltd. (the "Company")
and {{EMPLOYEE_NAME}} (the "Employee").

Position:       {{POSITION}}
Department:     {{DEPARTMENT}}
Start date:     {{START_DATE}}
Contract type:  {{CONTRACT_TYPE}}
Base salary:    {{BASE_SALARY}} HUF
Location:       Budapest, Hungary`;

    if (hasVacation) {
      template += `
Annual leave:   {{VACATION}} days
Child allowance: {{VACATION_CHILD}} days`;
    }

    const val = (s, raw) =>
      raw.startsWith("{{")
        ? `<span class="field-value">${raw}</span>`
        : `<span class="field-value">${escapeHtml(s)}</span>`;

    const vacationLines = hasVacation
      ? `<div class="contract-line"><strong>Annual leave:</strong> ${val(tokens.VACATION, tokens.VACATION)} days</div>
          <div class="contract-line"><strong>Child allowance:</strong> ${val(tokens.VACATION_CHILD, tokens.VACATION_CHILD)} days</div>`
      : "";

    hubState.contractReady = true;
    updateHubBridge();

    document.getElementById("contract-preview-area").innerHTML = `
    <div class="demo-split">
      <div class="demo-split-block">
        <div class="demo-output-title">Template (tokens)</div>
        <pre class="demo-pre">${escapeHtml(template)}</pre>
      </div>
      <div class="demo-split-block">
        <div class="demo-output-title">Document preview<span class="contract-engine-badge">Document Engine</span></div>
        <div class="contract-preview">
          <h4>EMPLOYMENT CONTRACT</h4>
          <div class="contract-line">This contract is entered into between <strong>Ericsson Hungary Ltd.</strong> (the "Company") and ${val(tokens.EMPLOYEE_NAME, tokens.EMPLOYEE_NAME)} (the "Employee").</div>
          <br>
          <div class="contract-line"><strong>Position:</strong> ${val(tokens.POSITION, tokens.POSITION)}</div>
          <div class="contract-line"><strong>Department:</strong> ${val(tokens.DEPARTMENT, tokens.DEPARTMENT)}</div>
          <div class="contract-line"><strong>Start date:</strong> ${val(tokens.START_DATE, tokens.START_DATE)}</div>
          <div class="contract-line"><strong>Contract type:</strong> ${val(tokens.CONTRACT_TYPE, tokens.CONTRACT_TYPE)}</div>
          <div class="contract-line"><strong>Base salary:</strong> ${val(tokens.BASE_SALARY, tokens.BASE_SALARY)} HUF</div>
          <div class="contract-line"><strong>Location:</strong> Budapest, Hungary</div>
          ${vacationLines}
          <br>
          <div class="contract-line" style="font-size:12px;color:var(--muted);border-top:1px dashed var(--border);padding-top:10px;margin-top:4px;">
            Blank optional fields are pruned from the real document engine — entire paragraphs or table rows are removed when a token resolves empty.
          </div>
        </div>
      </div>
    </div>`;
  }

  function resetHubWorkflow() {
    printRunning = false;
    hubState.tokens = {};
    hubState.vacationDone = false;
    hubState.contractReady = false;
    hubState.printComplete = false;
    hubState.activeHubTab = "vacation";

    ["v-birth", "v-start", "c-name", "c-pos", "c-dept", "c-salary", "c-type"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      },
    );
    const cDate = document.getElementById("c-date");
    if (cDate) cDate.value = "";
    const children = document.getElementById("v-children");
    if (children) children.value = "0";

    document.getElementById("vacation-output").innerHTML =
      '<div class="empty-state"><div class="empty-icon">🏖️</div><div class="empty-text">Enter dates and calculate prorated vacation days</div></div>';
    document.getElementById("contract-preview-area").innerHTML =
      '<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-text">Fill the fields and generate</div></div>';
    document.getElementById("print-output").innerHTML =
      '<div class="empty-state"><div class="empty-icon">🖨️</div><div class="empty-text">Generate a contract first, then start the print run</div></div>';

    showVacationMsg("", "");
    showContractMsg("", "");
    showPrintMsg("", "");
    switchHubTab("vacation");
  }

  function bindHubListeners() {
    document.getElementById("v-start")?.addEventListener("change", () => {
      onStartDateChanged("vacation");
    });
    document.getElementById("c-date")?.addEventListener("change", () => {
      onStartDateChanged("contract");
    });

    ["c-name", "c-pos", "c-dept", "c-salary", "c-type"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => {
        if (hubState.contractReady || hubState.printComplete) {
          invalidateFromContract();
          showContractMsg("Contract fields changed — generate preview again.", "error");
        }
      });
    });

    ["v-birth", "v-children"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => {
        if (hubState.vacationDone) {
          invalidateFromVacation();
          showVacationMsg("Inputs changed — recalculate vacation.", "error");
        }
      });
    });
  }

  window.switchHubTab = switchHubTab;
  window.calculateVacation = calculateVacation;
  window.applyVacationToContract = applyVacationToContract;
  window.generateContract = generateContract;
  window.startPrintRun = startPrintRun;
  window.resetHubWorkflow = resetHubWorkflow;

  bindHubListeners();
  updateHubBridge();
})();
