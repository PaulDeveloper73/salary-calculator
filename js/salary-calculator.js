/* ============================================================================
 * SalaryCalc Pro — Salary Calculator
 * Developer: Kisakye Paul — Software Developer
 * ---------------------------------------------------------------------------
 * Calculates:
 *   Gross salary      = Basic salary + Total allowances
 *   Estimated deduction = Gross salary × User-defined rate ÷ 100
 *   Take-home pay     = Gross salary − Estimated deduction
 *
 * IMPORTANT:
 * This is a flat-rate planning estimate. It does not calculate statutory
 * PAYE, NSSF, local service tax, employer contributions, or legal payroll
 * obligations. Do not use it as a statutory payroll-compliance engine.
 *
 * Features:
 * - Input validation and accessible field-level error messages
 * - UGX / selected-currency formatting via Intl.NumberFormat
 * - Salary summaries and detailed breakdown
 * - Browser-local calculation history (up to 100 records)
 * - Search, load, delete and clear history
 * - CSV export, copy breakdown and print integration
 * - Safe DOM rendering (user-entered names are never inserted as HTML)
 * - Graceful fallback when localStorage or Clipboard API is unavailable
 *
 * No external JavaScript dependencies.
 * ========================================================================== */

(() => {
  "use strict";

  const CONFIG = Object.freeze({
    storageKey: "salaryCalcPro.history.v1",
    maxHistoryRecords: 100,
    defaultCurrency: "UGX",
    defaultPayPeriod: "Monthly",
    defaultDeductionRate: 10,
    locale: "en-UG",
    clearConfirmDuration: 4500,
  });

  const ALLOWED_PERIODS = new Set(["Monthly", "Weekly", "Bi-weekly", "Annual"]);
  const $ = (id) => document.getElementById(id);

  const elements = {
    form: $("salary-calculator-form"),
    employeeName: $("employee-name"),
    payPeriod: $("pay-period"),
    currency: $("currency-code"),
    basicSalary: $("basic-salary"),
    allowances: $("allowances"),
    deductionRate: $("deduction-rate"),
    basicError: $("basic-salary-error"),
    allowancesError: $("allowances-error"),
    rateError: $("deduction-rate-error"),
    generalError: $("salary-error-message"),
    calculateButton: $("calculate-salary-btn"),
    resetButton: $("reset-salary-btn"),
    summaryBasic: $("summary-basic"),
    summaryGross: $("summary-gross"),
    summaryDeductions: $("summary-deductions"),
    summaryNet: $("summary-net"),
    status: $("calculation-status"),
    emptyState: $("salary-empty-state"),
    result: $("salary-result"),
    resultsTitle: $("results-title"),
    resultNet: $("result-net"),
    resultPeriod: $("result-period-label"),
    resultBasic: $("result-basic"),
    resultAllowances: $("result-allowances"),
    resultGross: $("result-gross"),
    resultRate: $("result-deduction-rate"),
    resultDeductions: $("result-deductions"),
    copyButton: $("copy-salary-btn"),
    printButton: $("print-salary-btn"),
    newCalculationButton: $("new-calculation-btn"),
    historyCount: $("history-count"),
    historySearch: $("history-search"),
    historyList: $("salary-history-list"),
    exportButton: $("export-history-btn"),
    clearHistoryButton: $("clear-history-btn"),
    currentYear: $("current-year"),
  };

  const requiredElements = [
    "form",
    "basicSalary",
    "allowances",
    "deductionRate",
    "summaryBasic",
    "summaryGross",
    "summaryDeductions",
    "summaryNet",
    "status",
    "emptyState",
    "result",
    "historyList",
  ];

  const missingElements = requiredElements.filter((key) => !elements[key]);
  if (missingElements.length) {
    console.error(
      "SalaryCalc Pro could not start. Missing HTML elements:",
      missingElements.join(", ")
    );
    return;
  }

  let historyRecords = [];
  let currentResult = null;
  let resultIsStale = false;
  let storageAvailable = true;
  let storageWarningShown = false;
  let clearConfirmTimer = null;
  let toastRegion = null;
  const formatterCache = new Map();

  /* ------------------------------------------------------------------------
   * Formatting and shared helpers
   * --------------------------------------------------------------------- */

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function safeCurrencyCode(value) {
    const code = String(value || CONFIG.defaultCurrency).trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) return CONFIG.defaultCurrency;

    try {
      // Validate that Intl recognises the supplied three-letter code.
      new Intl.NumberFormat(CONFIG.locale, {
        style: "currency",
        currency: code,
      });
      return code;
    } catch (_error) {
      return CONFIG.defaultCurrency;
    }
  }

  function formatMoney(value, currency = CONFIG.defaultCurrency) {
    const code = safeCurrencyCode(currency);
    let formatter = formatterCache.get(code);

    if (!formatter) {
      formatter = new Intl.NumberFormat(CONFIG.locale, {
        style: "currency",
        currency: code,
        currencyDisplay: "code",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      formatterCache.set(code, formatter);
    }

    return formatter.format(Number.isFinite(Number(value)) ? Number(value) : 0);
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown date";

    try {
      return new Intl.DateTimeFormat(CONFIG.locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch (_error) {
      return date.toLocaleString();
    }
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `salary-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function setText(element, value) {
    if (element) element.textContent = String(value);
  }

  function setStatus(message, ready = false) {
    setText(elements.status, message);
    elements.status.classList.toggle("ready", Boolean(ready));
  }

  function clearFieldError(input, errorElement) {
    if (input) input.removeAttribute("aria-invalid");
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.hidden = true;
    }
  }

  function setFieldError(input, errorElement, message) {
    if (input) input.setAttribute("aria-invalid", "true");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.hidden = false;
    }
  }

  function clearValidation() {
    clearFieldError(elements.basicSalary, elements.basicError);
    clearFieldError(elements.allowances, elements.allowancesError);
    clearFieldError(elements.deductionRate, elements.rateError);

    if (elements.generalError) {
      elements.generalError.textContent = "";
      elements.generalError.hidden = true;
    }
  }

  function showGeneralError(message) {
    if (!elements.generalError) return;
    elements.generalError.textContent = message;
    elements.generalError.hidden = false;
    elements.generalError.style.borderColor = "#f0caca";
    elements.generalError.style.background = "#fff5f5";
    elements.generalError.style.color = "#a93e3e";
  }

  function announce(message, duration = 3200) {
    if (!toastRegion) {
      toastRegion = document.createElement("div");
      toastRegion.className = "salarycalc-toast-region";
      toastRegion.setAttribute("aria-live", "polite");
      toastRegion.setAttribute("aria-atomic", "false");
      toastRegion.style.cssText = [
        "position:fixed",
        "right:18px",
        "bottom:18px",
        "z-index:9999",
        "display:grid",
        "gap:8px",
        "width:min(360px,calc(100vw - 36px))",
        "pointer-events:none",
      ].join(";");
      document.body.appendChild(toastRegion);
    }

    const toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.textContent = message;
    toast.style.cssText = [
      "padding:12px 15px",
      "border:1px solid rgba(255,255,255,.12)",
      "border-radius:12px",
      "background:#103d3b",
      "color:#fff",
      "box-shadow:0 12px 35px rgba(15,23,42,.2)",
      "font:600 13px/1.5 Inter,Avenir,system-ui,sans-serif",
      "pointer-events:auto",
    ].join(";");
    toastRegion.appendChild(toast);

    window.setTimeout(() => {
      toast.style.transition = "opacity .2s ease, transform .2s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(5px)";
      window.setTimeout(() => toast.remove(), 240);
    }, duration);
  }

  function setActionButtonsEnabled(enabled) {
    if (elements.copyButton) elements.copyButton.disabled = !enabled;
    if (elements.printButton) elements.printButton.disabled = !enabled;
  }

  function updateCurrencyPrefixes() {
    const currency = safeCurrencyCode(elements.currency?.value);
    document.querySelectorAll("#calculator .input-prefix").forEach((prefix) => {
      prefix.textContent = currency;
    });
  }

  /* ------------------------------------------------------------------------
   * Input validation and calculation
   * --------------------------------------------------------------------- */

  function readNonNegativeNumber(input, label, errorElement, required = false) {
    const rawValue = String(input?.value ?? "").trim();

    if (!rawValue) {
      if (required) {
        setFieldError(input, errorElement, `${label} is required.`);
        return { valid: false, value: 0 };
      }
      clearFieldError(input, errorElement);
      return { valid: true, value: 0 };
    }

    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      setFieldError(input, errorElement, `Enter a valid ${label.toLowerCase()}.`);
      return { valid: false, value: 0 };
    }

    if (value < 0) {
      setFieldError(input, errorElement, `${label} cannot be negative.`);
      return { valid: false, value: 0 };
    }

    clearFieldError(input, errorElement);
    return { valid: true, value: roundMoney(value) };
  }

  function readDeductionRate() {
    const rawValue = String(elements.deductionRate.value ?? "").trim();

    if (!rawValue) {
      setFieldError(elements.deductionRate, elements.rateError, "Deduction rate is required.");
      return { valid: false, value: 0 };
    }

    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      setFieldError(elements.deductionRate, elements.rateError, "Enter a valid deduction rate.");
      return { valid: false, value: 0 };
    }

    if (value < 0 || value > 100) {
      setFieldError(elements.deductionRate, elements.rateError, "Enter a rate from 0% to 100%.");
      return { valid: false, value: 0 };
    }

    clearFieldError(elements.deductionRate, elements.rateError);
    return { valid: true, value: value };
  }

  function getFormValues() {
    clearValidation();

    const basic = readNonNegativeNumber(
      elements.basicSalary,
      "Basic salary",
      elements.basicError,
      true
    );
    const allowances = readNonNegativeNumber(
      elements.allowances,
      "Total allowances",
      elements.allowancesError,
      false
    );
    const rate = readDeductionRate();

    if (!basic.valid || !allowances.valid || !rate.valid) {
      showGeneralError("Please correct the highlighted fields before calculating your salary.");
      const firstInvalid = [
        [basic.valid, elements.basicSalary],
        [allowances.valid, elements.allowances],
        [rate.valid, elements.deductionRate],
      ].find(([valid]) => !valid);
      firstInvalid?.[1]?.focus();
      return null;
    }

    const basicSalary = basic.value;
    const totalAllowances = allowances.value;
    const deductionRate = rate.value;
    const grossSalary = roundMoney(basicSalary + totalAllowances);
    const deductions = roundMoney((grossSalary * deductionRate) / 100);
    const netSalary = roundMoney(grossSalary - deductions);

    if (![grossSalary, deductions, netSalary].every(Number.isFinite)) {
      showGeneralError("These figures are too large to calculate safely. Please check your entries.");
      return null;
    }

    const payPeriod = ALLOWED_PERIODS.has(elements.payPeriod?.value)
      ? elements.payPeriod.value
      : CONFIG.defaultPayPeriod;
    const currency = safeCurrencyCode(elements.currency?.value);
    const employeeName = String(elements.employeeName?.value ?? "").trim().slice(0, 80);

    return {
      id: createId(),
      createdAt: new Date().toISOString(),
      employeeName: employeeName || "Personal estimate",
      payPeriod,
      currency,
      basicSalary,
      allowances: totalAllowances,
      grossSalary,
      deductionRate,
      deductions,
      netSalary,
    };
  }

  function calculateSalary(event) {
    if (event) event.preventDefault();

    const calculation = getFormValues();
    if (!calculation) {
      resultIsStale = true;
      setStatus("Check the highlighted fields");
      setActionButtonsEnabled(false);
      return;
    }

    currentResult = calculation;
    resultIsStale = false;
    renderResult(calculation, "Calculation complete");
    addHistoryRecord(calculation);

    if (storageAvailable) {
      announce("Salary calculated and saved in this browser.");
    } else {
      announce("Salary calculated. Browser storage is unavailable, so this record is temporary.");
    }
  }

  /* ------------------------------------------------------------------------
   * Results and summaries
   * --------------------------------------------------------------------- */

  function renderSummary(record) {
    const currency = record.currency;
    setText(elements.summaryBasic, formatMoney(record.basicSalary, currency));
    setText(elements.summaryGross, formatMoney(record.grossSalary, currency));
    setText(elements.summaryDeductions, formatMoney(record.deductions, currency));
    setText(elements.summaryNet, formatMoney(record.netSalary, currency));
  }

  function renderResult(record, statusMessage = "Calculation complete") {
    renderSummary(record);

    setText(elements.resultNet, formatMoney(record.netSalary, record.currency));
    setText(elements.resultPeriod, `${record.payPeriod} · ${record.currency}`);
    setText(elements.resultBasic, formatMoney(record.basicSalary, record.currency));
    setText(elements.resultAllowances, formatMoney(record.allowances, record.currency));
    setText(elements.resultGross, formatMoney(record.grossSalary, record.currency));
    setText(elements.resultRate, `${record.deductionRate}% of gross salary · user-defined estimate`);
    setText(elements.resultDeductions, `− ${formatMoney(record.deductions, record.currency)}`);

    if (elements.resultsTitle) {
      const name = record.employeeName && record.employeeName !== "Personal estimate"
        ? record.employeeName
        : "Your salary breakdown";
      setText(elements.resultsTitle, name === "Your salary breakdown" ? name : `${name} — salary breakdown`);
    }

    elements.emptyState.hidden = true;
    elements.result.hidden = false;
    setStatus(statusMessage, true);
    setActionButtonsEnabled(true);
  }

  function clearSummary() {
    const currency = safeCurrencyCode(elements.currency?.value);
    setText(elements.summaryBasic, formatMoney(0, currency));
    setText(elements.summaryGross, formatMoney(0, currency));
    setText(elements.summaryDeductions, formatMoney(0, currency));
    setText(elements.summaryNet, formatMoney(0, currency));
  }

  function resetResults() {
    currentResult = null;
    resultIsStale = false;
    clearValidation();
    clearSummary();
    elements.emptyState.hidden = false;
    elements.result.hidden = true;
    if (elements.resultsTitle) setText(elements.resultsTitle, "Your salary breakdown");
    setStatus("Awaiting calculation");
    setActionButtonsEnabled(false);
    updateCurrencyPrefixes();
  }

  function markCurrentResultStale() {
    if (!currentResult || resultIsStale) return;
    resultIsStale = true;
    setStatus("Inputs changed — recalculate");
    setActionButtonsEnabled(false);
  }

  /* ------------------------------------------------------------------------
   * History data safety and browser storage
   * --------------------------------------------------------------------- */

  function normaliseHistoryRecord(raw) {
    if (!raw || typeof raw !== "object") return null;

    const basicSalary = Number(raw.basicSalary);
    const allowances = Number(raw.allowances);
    const deductionRate = Number(raw.deductionRate);
    if (
      !Number.isFinite(basicSalary) || basicSalary < 0 ||
      !Number.isFinite(allowances) || allowances < 0 ||
      !Number.isFinite(deductionRate) || deductionRate < 0 || deductionRate > 100
    ) {
      return null;
    }

    const grossSalary = roundMoney(basicSalary + allowances);
    const deductions = roundMoney((grossSalary * deductionRate) / 100);
    const netSalary = roundMoney(grossSalary - deductions);
    if (![grossSalary, deductions, netSalary].every(Number.isFinite)) return null;

    const parsedDate = new Date(raw.createdAt);
    const createdAt = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();

    const period = ALLOWED_PERIODS.has(raw.payPeriod) ? raw.payPeriod : CONFIG.defaultPayPeriod;

    return {
      id: typeof raw.id === "string" && raw.id.length <= 120 ? raw.id : createId(),
      createdAt,
      employeeName: typeof raw.employeeName === "string"
        ? raw.employeeName.slice(0, 80)
        : "Personal estimate",
      payPeriod: period,
      currency: safeCurrencyCode(raw.currency),
      basicSalary: roundMoney(basicSalary),
      allowances: roundMoney(allowances),
      grossSalary,
      deductionRate,
      deductions,
      netSalary,
    };
  }

  function loadHistory() {
    try {
      const saved = window.localStorage.getItem(CONFIG.storageKey);
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map(normaliseHistoryRecord)
        .filter(Boolean)
        .slice(0, CONFIG.maxHistoryRecords)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      storageAvailable = false;
      console.warn("SalaryCalc Pro could not read browser history:", error);
      return [];
    }
  }

  function persistHistory() {
    try {
      window.localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(historyRecords.slice(0, CONFIG.maxHistoryRecords))
      );
      storageAvailable = true;
      return true;
    } catch (error) {
      storageAvailable = false;
      if (!storageWarningShown) {
        storageWarningShown = true;
        console.warn("SalaryCalc Pro could not save browser history:", error);
      }
      return false;
    }
  }

  function addHistoryRecord(record) {
    historyRecords = [record, ...historyRecords.filter((item) => item.id !== record.id)]
      .slice(0, CONFIG.maxHistoryRecords);
    persistHistory();
    renderHistory();
  }

  /* ------------------------------------------------------------------------
   * History table — build nodes safely instead of injecting HTML strings
   * --------------------------------------------------------------------- */

  function makeHistoryButton(label, action, id, className = "text-btn") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.dataset.historyAction = action;
    button.dataset.historyId = id;
    button.setAttribute("aria-label", `${label} calculation`);
    if (label === "Delete") button.style.color = "#c94f4f";
    return button;
  }

  function renderHistory() {
    const searchTerm = String(elements.historySearch?.value ?? "").trim().toLowerCase();
    const filteredRecords = historyRecords.filter((record) => {
      if (!searchTerm) return true;
      const searchText = [
        record.employeeName,
        record.payPeriod,
        record.currency,
        formatDate(record.createdAt),
        record.basicSalary,
        record.grossSalary,
        record.deductions,
        record.netSalary,
      ].join(" ").toLowerCase();
      return searchText.includes(searchTerm);
    });

    if (elements.historyCount) {
      const total = historyRecords.length;
      setText(
        elements.historyCount,
        searchTerm ? `${filteredRecords.length} of ${total} records` : `${total} ${total === 1 ? "record" : "records"}`
      );
    }

    const fragment = document.createDocumentFragment();

    if (filteredRecords.length === 0) {
      const row = document.createElement("tr");
      row.id = "empty-history-row";
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.className = "empty-history";
      cell.textContent = historyRecords.length
        ? "No calculations match your search. Try another name, date or amount."
        : "No salary calculations saved yet. Your completed calculations will appear here.";
      row.appendChild(cell);
      fragment.appendChild(row);
    } else {
      filteredRecords.forEach((record) => {
        const row = document.createElement("tr");
        row.dataset.recordId = record.id;

        const dateCell = document.createElement("td");
        const dateText = document.createElement("strong");
        dateText.textContent = formatDate(record.createdAt);
        const nameText = document.createElement("div");
        nameText.style.cssText = "margin-top:4px;color:#94a0ab;font-size:.64rem;max-width:150px;overflow:hidden;text-overflow:ellipsis;";
        nameText.textContent = record.employeeName;
        dateCell.append(dateText, nameText);

        const basicCell = document.createElement("td");
        basicCell.textContent = formatMoney(record.basicSalary, record.currency);
        const grossCell = document.createElement("td");
        grossCell.textContent = formatMoney(record.grossSalary, record.currency);
        const deductionsCell = document.createElement("td");
        deductionsCell.textContent = formatMoney(record.deductions, record.currency);
        const netCell = document.createElement("td");
        const netStrong = document.createElement("strong");
        netStrong.textContent = formatMoney(record.netSalary, record.currency);
        netCell.appendChild(netStrong);

        const actionCell = document.createElement("td");
        actionCell.style.cssText = "display:flex;align-items:center;gap:8px;";
        actionCell.append(
          makeHistoryButton("Load", "load", record.id),
          makeHistoryButton("Delete", "delete", record.id)
        );

        row.append(dateCell, basicCell, grossCell, deductionsCell, netCell, actionCell);
        fragment.appendChild(row);
      });
    }

    elements.historyList.replaceChildren(fragment);
  }

  function loadHistoryRecord(id) {
    const record = historyRecords.find((item) => item.id === id);
    if (!record) {
      announce("That saved calculation could not be found.");
      return;
    }

    elements.employeeName.value = record.employeeName === "Personal estimate" ? "" : record.employeeName;
    elements.payPeriod.value = record.payPeriod;

    const currencyOptionExists = Array.from(elements.currency.options || [])
      .some((option) => option.value === record.currency);
    if (currencyOptionExists) elements.currency.value = record.currency;

    elements.basicSalary.value = String(record.basicSalary);
    elements.allowances.value = String(record.allowances);
    elements.deductionRate.value = String(record.deductionRate);

    clearValidation();
    updateCurrencyPrefixes();
    currentResult = { ...record };
    resultIsStale = false;
    renderResult(currentResult, "Loaded from saved history");
    announce("Saved calculation loaded. Edit any field and recalculate to create a new record.");

    document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteHistoryRecord(id) {
    const originalLength = historyRecords.length;
    historyRecords = historyRecords.filter((record) => record.id !== id);
    if (historyRecords.length === originalLength) return;

    persistHistory();
    renderHistory();
    announce("Calculation removed from history.");
  }

  function clearHistory() {
    historyRecords = [];
    persistHistory();
    renderHistory();
    announce("Calculation history cleared.");
  }

  function armClearHistoryConfirmation() {
    const button = elements.clearHistoryButton;
    if (!button) return;

    if (button.dataset.confirming === "true") {
      window.clearTimeout(clearConfirmTimer);
      button.dataset.confirming = "false";
      button.textContent = "Clear history";
      button.removeAttribute("aria-label");
      clearHistory();
      return;
    }

    button.dataset.confirming = "true";
    button.textContent = "Confirm clear?";
    button.setAttribute("aria-label", "Confirm clearing all saved salary calculations");
    announce("Select Confirm clear? again to permanently remove saved history.");

    window.clearTimeout(clearConfirmTimer);
    clearConfirmTimer = window.setTimeout(() => {
      button.dataset.confirming = "false";
      button.textContent = "Clear history";
      button.removeAttribute("aria-label");
    }, CONFIG.clearConfirmDuration);
  }

  /* ------------------------------------------------------------------------
   * Copy and CSV export
   * --------------------------------------------------------------------- */

  function buildBreakdownText(record) {
    return [
      "SALARYCALC PRO — SALARY ESTIMATE",
      "=================================",
      `Employee / Reference: ${record.employeeName}`,
      `Pay period: ${record.payPeriod}`,
      `Currency: ${record.currency}`,
      `Calculated: ${formatDate(record.createdAt)}`,
      "",
      `Basic salary: ${formatMoney(record.basicSalary, record.currency)}`,
      `Total allowances: ${formatMoney(record.allowances, record.currency)}`,
      `Gross salary: ${formatMoney(record.grossSalary, record.currency)}`,
      `Estimated deductions (${record.deductionRate}%): ${formatMoney(record.deductions, record.currency)}`,
      `Estimated take-home pay: ${formatMoney(record.netSalary, record.currency)}`,
      "",
      "Method: Gross salary = basic salary + allowances.",
      "Estimated deductions = gross salary × user-defined rate ÷ 100.",
      "Take-home pay = gross salary − estimated deductions.",
      "",
      "NOTICE: This is a flat-rate planning estimate, not a statutory payroll, tax or legal compliance calculation.",
      "Generated by SalaryCalc Pro.",
    ].join("\n");
  }

  async function copyBreakdown() {
    if (!currentResult || resultIsStale) {
      announce("Recalculate your salary before copying the breakdown.");
      return;
    }

    const text = buildBreakdownText(currentResult);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      announce("Salary breakdown copied to clipboard.");
    } catch (_error) {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = text;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
      document.body.appendChild(temporaryInput);
      temporaryInput.select();

      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (_fallbackError) {
        copied = false;
      }
      temporaryInput.remove();
      announce(copied ? "Salary breakdown copied to clipboard." : "Copy was unavailable in this browser.");
    }
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportHistory() {
    if (!historyRecords.length) {
      announce("There are no saved calculations to export yet.");
      return;
    }

    const headers = [
      "Created At",
      "Employee / Reference",
      "Pay Period",
      "Currency",
      "Basic Salary",
      "Allowances",
      "Gross Salary",
      "Deduction Rate (%)",
      "Estimated Deductions",
      "Estimated Take-Home Pay",
    ];

    const rows = historyRecords.map((record) => [
      formatDate(record.createdAt),
      record.employeeName,
      record.payPeriod,
      record.currency,
      record.basicSalary,
      record.allowances,
      record.grossSalary,
      record.deductionRate,
      record.deductions,
      record.netSalary,
    ]);

    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `salarycalc-pro-history-${dateStamp}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce("Calculation history exported as a CSV file.");
  }

  /* ------------------------------------------------------------------------
   * Event listeners and application startup
   * --------------------------------------------------------------------- */

  function handleHistoryTableClick(event) {
    const button = event.target.closest("button[data-history-action]");
    if (!button || !elements.historyList.contains(button)) return;

    const { historyAction, historyId } = button.dataset;
    if (!historyId) return;

    if (historyAction === "load") loadHistoryRecord(historyId);
    if (historyAction === "delete") deleteHistoryRecord(historyId);
  }

  function handleFormReset() {
    // The browser restores default field values after the reset event.
    window.setTimeout(() => {
      resetResults();
    }, 0);
  }

  function startNewCalculation() {
    elements.form.reset();
    // The reset event handler updates the results after native field reset.
    window.setTimeout(() => {
      document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
      elements.basicSalary.focus({ preventScroll: true });
    }, 30);
  }

  function bindEvents() {
    elements.form.addEventListener("submit", calculateSalary);
    elements.form.addEventListener("reset", handleFormReset);

    [elements.basicSalary, elements.allowances, elements.deductionRate, elements.employeeName, elements.payPeriod, elements.currency]
      .filter(Boolean)
      .forEach((input) => {
        input.addEventListener("input", () => {
          markCurrentResultStale();
          if (input === elements.basicSalary) clearFieldError(input, elements.basicError);
          if (input === elements.allowances) clearFieldError(input, elements.allowancesError);
          if (input === elements.deductionRate) clearFieldError(input, elements.rateError);
          if (elements.generalError && !elements.generalError.hidden) {
            elements.generalError.hidden = true;
          }
        });
        input.addEventListener("change", () => {
          markCurrentResultStale();
          if (input === elements.currency) updateCurrencyPrefixes();
        });
      });

    elements.copyButton?.addEventListener("click", copyBreakdown);
    elements.newCalculationButton?.addEventListener("click", startNewCalculation);
    elements.exportButton?.addEventListener("click", exportHistory);
    elements.clearHistoryButton?.addEventListener("click", armClearHistoryConfirmation);
    elements.historySearch?.addEventListener("input", renderHistory);
    elements.historyList.addEventListener("click", handleHistoryTableClick);

    // Printing is handled by the small presentation helper already in the HTML.
    // Keep the print control disabled until a current calculation exists.
  }

  function initialise() {
    if (elements.currentYear) setText(elements.currentYear, new Date().getFullYear());

    historyRecords = loadHistory();
    renderHistory();
    clearSummary();
    updateCurrencyPrefixes();
    setActionButtonsEnabled(false);
    setStatus("Awaiting calculation");
    bindEvents();

    if (!storageAvailable && !storageWarningShown) {
      storageWarningShown = true;
      announce("Browser storage is unavailable. Calculations will work, but history may not persist.", 5000);
    }
  }

  initialise();
})();
