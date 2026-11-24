# SalaryCalc Pro

### Understand your pay. Plan with confidence.

SalaryCalc Pro is a responsive salary-planning web application that helps an individual or payroll user estimate gross pay, user-defined deductions and take-home pay from a small set of salary inputs. It presents the calculation in a clear breakdown and keeps a limited history in the current browser so previous estimates can be reviewed, loaded, deleted or exported.

**Developer:** Kisakye Paul — Software Developer  
**Default currency:** Uganda Shilling (UGX)  
**Application type:** Frontend web application / salary-planning calculator  
**Current architecture:** HTML5 + CSS3 + Tailwind CSS CDN + vanilla JavaScript  
**JavaScript dependencies:** None

> **Important:** SalaryCalc Pro currently applies a flat deduction percentage entered by the user. It is a planning estimator, not a statutory payroll, PAYE, NSSF, tax, accounting or legal-compliance system. Verify actual payroll obligations with current official guidance or a qualified payroll professional.

---

## Contents

- [SalaryCalc Pro](#salarycalc-pro)
  - [Understand your pay. Plan with confidence.](#understand-your-pay-plan-with-confidence)
  - [Contents](#contents)
  - [Project overview](#project-overview)
  - [Who the application is for](#who-the-application-is-for)
  - [Current features](#current-features)
    - [Interface sections](#interface-sections)
  - [How the calculation works](#how-the-calculation-works)
    - [Worked example](#worked-example)
  - [User workflow](#user-workflow)
    - [1. Enter salary information](#1-enter-salary-information)
    - [2. Enter the deduction rate](#2-enter-the-deduction-rate)
    - [3. Calculate and review](#3-calculate-and-review)
    - [4. Keep or export the estimate](#4-keep-or-export-the-estimate)
  - [Technology stack](#technology-stack)
  - [Project structure](#project-structure)
  - [Run the project locally](#run-the-project-locally)
    - [Option A — VS Code Live Server](#option-a--vs-code-live-server)
    - [Option B — Python static server](#option-b--python-static-server)
  - [JavaScript integration](#javascript-integration)
  - [History, storage and privacy](#history-storage-and-privacy)
    - [Privacy considerations](#privacy-considerations)
  - [Accessibility and user experience](#accessibility-and-user-experience)
  - [Security and technical limitations](#security-and-technical-limitations)
    - [External resources](#external-resources)
  - [Testing checklist](#testing-checklist)
    - [Salary calculations and validation](#salary-calculations-and-validation)
    - [History and export](#history-and-export)
    - [Copy, print and responsive interface](#copy-print-and-responsive-interface)
  - [Production roadmap](#production-roadmap)
    - [Phase 1 — Payroll calculation foundations](#phase-1--payroll-calculation-foundations)
    - [Phase 2 — Employee and employer management](#phase-2--employee-and-employer-management)
    - [Phase 3 — Payslips and reporting](#phase-3--payslips-and-reporting)
    - [Phase 4 — Integrations and operational controls](#phase-4--integrations-and-operational-controls)
    - [Phase 5 — Multi-country readiness](#phase-5--multi-country-readiness)
    - [Non-functional requirements for a production release](#non-functional-requirements-for-a-production-release)
  - [Business and client opportunities](#business-and-client-opportunities)
    - [Potential client solutions](#potential-client-solutions)
    - [Who may benefit from a tailored solution](#who-may-benefit-from-a-tailored-solution)
    - [Client enquiry call to action](#client-enquiry-call-to-action)
  - [Deployment](#deployment)
    - [GitHub Pages](#github-pages)
    - [Production deployment checks](#production-deployment-checks)
  - [Developer and contact](#developer-and-contact)
  - [License](#license)

---

## Project overview

Salary calculations can be difficult to understand when basic pay, allowances and deductions are presented without a simple explanation. SalaryCalc Pro focuses on making those figures easier to review.

The user enters a basic salary, combines applicable allowances, selects a pay-period label and enters a deduction percentage. The application calculates gross salary, estimated deductions and estimated take-home pay, then presents the values in a summary and detailed breakdown.

The interface is designed around a fast, focused workflow:

1. Enter salary details.
2. Set the deduction percentage to use for the estimate.
3. Calculate and review the result.
4. Copy, print or save the estimate in the browser's calculation history.
5. Return to previous records, search them or export the history as CSV.

The current release is intentionally frontend-only. It does not require an account, server, database or build tool.

## Who the application is for

The current calculator can be useful for:

- Employees who want to understand a simple salary estimate.
- Individuals comparing possible salary and allowance combinations.
- Small-business owners making preliminary compensation estimates.
- HR or payroll personnel preparing a basic planning estimate before a formal payroll process.
- Developers and business owners evaluating a branded calculator as part of a wider HR or payroll solution.

The application should not be used as the sole source for statutory payroll calculations, tax returns, employee payment decisions or regulatory reporting.

## Current features

The following features are implemented in the supplied HTML and JavaScript files.

| Feature                 | Current implementation                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Salary input            | Basic salary, total allowances and a user-defined deduction percentage                           |
| Employee reference      | Optional employee or calculation label, up to the input's configured character limit             |
| Pay period              | Monthly, weekly, bi-weekly and annual labels                                                     |
| Currency                | UGX is the currency currently offered by the page                                                |
| Gross pay               | Basic salary plus total allowances                                                               |
| Estimated deductions    | Gross salary multiplied by the selected flat percentage                                          |
| Estimated take-home pay | Gross salary less estimated deductions                                                           |
| Validation              | Required values, finite numeric values, non-negative amounts and a 0–100% rate range             |
| Currency formatting     | Browser `Intl.NumberFormat` API using the selected currency code                                 |
| Result status           | Indicates when a result has been calculated or needs recalculation after an input change         |
| Calculation history     | Latest 100 records stored in browser `localStorage`                                              |
| History search          | Filters saved calculations using the history search field                                        |
| Load history            | Restores a previously saved calculation into the calculator                                      |
| Delete history item     | Removes an individual saved record                                                               |
| Clear history           | Requires a second confirmation action before removing all records                                |
| CSV export              | Downloads saved records in CSV format for spreadsheet use                                        |
| Copy breakdown          | Copies the current calculation details to the clipboard, with a fallback attempt where supported |
| Print                   | Uses the browser print dialog and the page's print stylesheet                                    |
| User feedback           | Accessible status announcements and validation messages                                          |
| Safe text rendering     | User-entered text is rendered as text rather than being inserted as HTML                         |
| Storage fallback        | The calculator can still calculate if browser storage is unavailable; history may not persist    |
| Responsive layout       | Desktop, tablet and mobile layout rules                                                          |
| Reduced motion          | Respects the user's reduced-motion preference                                                    |
| SEO metadata            | Page title, description, author, theme color, social metadata and WebApplication structured data |

### Interface sections

The page includes:

- A branded header with navigation to the calculator, history, instructions and FAQs.
- A concise introduction and privacy reminder.
- Four salary summary cards for basic pay, gross pay, estimated deductions and estimated take-home pay.
- A salary information form.
- A detailed calculation result and action controls.
- A searchable calculation-history table.
- Feature/value explanations.
- A three-step "How it works" section.
- Frequently asked questions.
- A payroll disclaimer and developer contact links in the footer.

---

## How the calculation works

The calculator uses a deliberately simple flat-rate formula.

```text
Gross salary = Basic salary + Total allowances

Estimated deductions = Gross salary × (Deduction rate ÷ 100)

Estimated take-home pay = Gross salary − Estimated deductions
```

### Worked example

| Item                        |     Example value |
| --------------------------- | ----------------: |
| Basic salary                |     UGX 1,500,000 |
| Total allowances            |       UGX 200,000 |
| Gross salary                |     UGX 1,700,000 |
| User-defined deduction rate |               10% |
| Estimated deductions        |       UGX 170,000 |
| **Estimated take-home pay** | **UGX 1,530,000** |

The basic salary and allowances must use the same pay period. The pay-period selector is currently a label only; the application does not convert weekly values into monthly values or annualize a salary automatically.

The deduction percentage is supplied by the user. It is not inferred from legislation, tax bands, employee circumstances or contribution schedules.

## User workflow

### 1. Enter salary information

Optionally enter an employee or reference name. Choose the pay-period label and currency offered by the interface. Enter the basic salary and total allowances using the same period and currency.

### 2. Enter the deduction rate

Enter a flat percentage between 0 and 100. Use a rate that is appropriate for the planning scenario being evaluated. The application does not determine the legally correct rate for the user.

### 3. Calculate and review

Submit the form to view basic salary, allowances, gross salary, estimated deductions and estimated take-home pay. If a value is edited after calculation, the old result is marked as stale and must be recalculated before it can be copied or printed.

### 4. Keep or export the estimate

Completed calculations are saved to the current browser's history when storage is available. The user can search, load, delete, clear or export these records.

---

## Technology stack

| Technology                | Role                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| HTML5                     | Semantic page structure, form controls, navigation, tables and FAQ content         |
| CSS3                      | Responsive layout, visual system, component styling, focus states and print styles |
| Tailwind CSS CDN          | Utility CSS support and theme configuration in the page                            |
| Vanilla JavaScript (ES6+) | Validation, salary formulas, rendering, history and user interactions              |
| `Intl.NumberFormat`       | Currency display and locale-aware formatting                                       |
| `localStorage`            | Browser-local calculation history                                                  |
| Clipboard API             | Copying a salary breakdown, with a legacy fallback attempt                         |
| Blob and object URLs      | CSV file generation and download                                                   |
| Google Fonts — Inter      | Interface typography                                                               |

There is no package manager, bundler, framework runtime or third-party JavaScript library required by the current version.

## Project structure

```text
salarycalc-pro/
│
├── index.html
├── README.md
│
└── js/
    └── salary-calculator.js
```

`index.html` contains the page markup, embedded styles, Tailwind CDN configuration, SEO metadata, structured data and a small presentation helper for printing and history-row filtering.

`js/salary-calculator.js` contains the salary calculation logic, validation, result rendering, local history, search, load/delete/clear actions, CSV export and copy functionality.

The page references the JavaScript file using:

```html
<script src="./js/salary-calculator.js" defer></script>
```

Keep this relative path correct when moving or renaming the JavaScript file.

## Run the project locally

### Option A — VS Code Live Server

1. Extract or open the `salarycalc-pro` project folder in Visual Studio Code.
2. Confirm that `index.html` and `js/salary-calculator.js` are in the structure shown above.
3. Install or enable the Live Server extension if it is not already available.
4. Right-click `index.html` and select **Open with Live Server**.
5. Open the local URL provided by the extension.

### Option B — Python static server

Open a terminal in the project root and run:

```bash
python -m http.server 5500
```

Then visit:

```text
http://localhost:5500
```

Using `localhost` or HTTPS is recommended for browser features such as clipboard access. Opening the file directly with a `file://` URL may cause browser-specific permission or storage differences.

## JavaScript integration

The calculator logic is maintained separately from the page design. This makes it possible to improve the interface without placing the calculation engine directly inside the HTML.

The script looks up the following key elements by their IDs:

| Area                | Main element IDs                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Form                | `salary-calculator-form`, `basic-salary`, `allowances`, `deduction-rate`                                                                               |
| Employee and period | `employee-name`, `pay-period`, `currency-code`                                                                                                         |
| Validation          | `basic-salary-error`, `allowances-error`, `deduction-rate-error`, `salary-error-message`                                                               |
| Summary             | `summary-basic`, `summary-gross`, `summary-deductions`, `summary-net`                                                                                  |
| Result              | `salary-empty-state`, `salary-result`, `result-net`, `result-basic`, `result-allowances`, `result-gross`, `result-deduction-rate`, `result-deductions` |
| Actions             | `copy-salary-btn`, `print-salary-btn`, `new-calculation-btn`, `export-history-btn`, `clear-history-btn`                                                |
| History             | `history-search`, `salary-history-list`, `history-count`                                                                                               |
| Footer              | `current-year`                                                                                                                                         |

If you rename or remove any of these IDs, update the corresponding selectors in `salary-calculator.js` as part of the same change. The script checks for its required elements and logs a useful startup error if a required element is missing.

## History, storage and privacy

Calculation history is saved in the browser's `localStorage` using this key:

```text
salaryCalcPro.history.v1
```

The application retains up to 100 recent records in the current browser profile. The history is local to that browser and device; it is not synchronised to another browser, device or account.

### Privacy considerations

- No account registration or server-side data submission is included in the current version.
- Local browser storage is not encrypted by this application.
- Anyone who can access the same browser profile may be able to inspect its stored history.
- Clearing browser data may remove saved calculations.
- The local history is not a backup or records-management system.
- Avoid entering unnecessary personal identifiers or confidential employee information, especially on a shared computer.

For an employer-facing system, local storage should be replaced or supplemented by a properly secured backend with authentication, authorization, encryption, audit records, data retention policies and backups.

## Accessibility and user experience

The current interface includes several usability and accessibility practices:

- Semantic headings, navigation, sections, forms and table markup.
- Explicit labels for important form fields.
- Field-level error messages and `aria-invalid` state for invalid values.
- Status feedback using live regions.
- Visible keyboard focus styles.
- Responsive navigation and content layouts.
- Scrollable history table on narrow screens.
- Reduced-motion support through `prefers-reduced-motion`.
- Print-specific CSS to produce a cleaner salary result.
- Safe text rendering for user-supplied employee/reference labels.

Accessibility should still be validated with keyboard-only navigation, browser zoom, screen readers and real mobile devices before a production release.

## Security and technical limitations

This is a static, browser-only application. It has no server, authentication system, database, role management or multi-user controls.

The current design includes client-side validation and safe text rendering, but these do not make it suitable for storing sensitive employee payroll records in a shared or managed business environment. Client-side code can be inspected and modified by users, so it must never be treated as a trusted payroll authority.

For production use, consider:

- Server-side validation and calculation verification.
- Authentication and role-based access control.
- HTTPS-only deployment.
- Secure session handling and CSRF protections where applicable.
- Database encryption and restricted database permissions.
- Audit trails for payroll changes and approvals.
- Backup, recovery and retention policies.
- Dependency and security updates.
- Formal testing of jurisdiction-specific payroll rules.

### External resources

The page currently loads Tailwind CSS from its CDN and the Inter typeface from Google Fonts. These resources require network access. For a controlled production environment, consider compiling and self-hosting the required CSS and fonts, reviewing external-resource privacy implications and applying a suitable Content Security Policy.

---

## Testing checklist

Use this checklist when validating changes to the application.

### Salary calculations and validation

- [ ] Submit the form with the basic salary empty and confirm the required-field message.
- [ ] Enter a negative basic salary and confirm validation blocks calculation.
- [ ] Enter a negative allowance and confirm validation blocks calculation.
- [ ] Enter a deduction rate below 0 or above 100 and confirm validation blocks calculation.
- [ ] Enter non-numeric or extremely large values and confirm invalid values are handled safely.
- [ ] Calculate with basic salary `1500000`, allowances `200000` and deduction rate `10`.
- [ ] Confirm gross salary is `1700000`, estimated deductions are `170000` and take-home pay is `1530000`.
- [ ] Change an input after calculation and verify the old result is marked stale.
- [ ] Recalculate and confirm the displayed summary and detailed breakdown update.

### History and export

- [ ] Confirm a completed calculation is saved to history.
- [ ] Reload the page and confirm history remains in the same browser profile.
- [ ] Search by employee/reference name and salary record details.
- [ ] Load a saved record and confirm the form and result are restored.
- [ ] Delete one record and confirm other history records remain.
- [ ] Clear all history using the two-step confirmation.
- [ ] Export history to CSV and open the file in a spreadsheet application.
- [ ] Confirm history is capped at the latest 100 records.

### Copy, print and responsive interface

- [ ] Copy a current result and verify the copied breakdown.
- [ ] Change form values and confirm copying is unavailable until recalculation.
- [ ] Print a current result and review the print layout.
- [ ] Test keyboard navigation and visible focus states.
- [ ] Test desktop, tablet and mobile widths.
- [ ] Test with reduced motion enabled.
- [ ] Test behavior when local storage is unavailable or full.
- [ ] Test behavior when clipboard access is blocked.

---

## Production roadmap

The items below describe a possible finished business product. They are **not included in the current browser-only release**. A production payroll platform should be scoped, implemented and tested in stages.

### Phase 1 — Payroll calculation foundations

- Configurable earnings components such as housing, transport, overtime, commissions and bonuses.
- Configurable employee deductions and employer contributions.
- Versioned statutory rules by country, tax year and effective date.
- Unit tests and verified test cases for every payroll rule.
- Explicit separation of employee deductions and employer costs.
- Documented rounding, eligibility and exception rules.

### Phase 2 — Employee and employer management

- Employee profiles and employment details.
- Employer/business workspaces.
- Payroll periods and payroll runs.
- Role-based permissions for owners, HR staff, payroll officers and reviewers.
- Maker-checker approvals and audit history.
- Secure server-side database and backups.

### Phase 3 — Payslips and reporting

- Downloadable payslips in PDF format.
- Employee payroll statements and period comparisons.
- Payroll summaries and exportable reports.
- Department, branch and cost-centre reporting.
- Payroll review and approval workflow.
- Controlled email or employee-portal delivery.

### Phase 4 — Integrations and operational controls

- Accounting and bookkeeping exports.
- Approved bank or payment integrations where appropriate.
- Secure import of employee and payroll data.
- Notifications for payroll deadlines and incomplete records.
- Administrative configuration and system monitoring.
- Data retention, backup restoration and incident-response procedures.

### Phase 5 — Multi-country readiness

- Country-specific payroll configuration.
- Effective-dated tax and contribution schedules.
- Local currency, number and date formats.
- Jurisdiction-specific payslip and reporting requirements.
- Ongoing review when official regulations change.

### Non-functional requirements for a production release

| Area            | Production expectation                                                                |
| --------------- | ------------------------------------------------------------------------------------- |
| Accuracy        | Independently verified calculation rules, documented assumptions and regression tests |
| Security        | Authentication, authorization, HTTPS, secure secrets and protected employee data      |
| Privacy         | Clear purposes, access controls, retention rules and appropriate user notices         |
| Reliability     | Backups, restore testing, error handling and operational monitoring                   |
| Performance     | Fast page rendering, efficient payroll processing and tested capacity                 |
| Accessibility   | WCAG-oriented review and assistive-technology testing                                 |
| Maintainability | Modular services, documentation, code review and automated tests                      |
| Auditability    | Traceable payroll edits, approvals, rule versions and calculation outputs             |
| Scalability     | Database-backed architecture tested for expected employer and employee volumes        |
| Compatibility   | Tested current desktop and mobile browsers                                            |

A production release should not be advertised as compliant until its rules and controls have been reviewed against the relevant jurisdiction's current official requirements.

---

## Business and client opportunities

SalaryCalc Pro demonstrates how a focused business tool can turn a manual or confusing task into a clearer digital workflow. It can also act as a starting point for conversations with businesses that need more than a simple calculator.

### Potential client solutions

The project can be used to discuss tailored solutions such as:

- Branded salary and compensation calculators.
- Employee self-service portals.
- HR and payroll management dashboards.
- Payslip and payroll reporting systems.
- Staff records and leave-management applications.
- Custom business dashboards and internal workflow tools.
- Integration of web applications with existing business systems.

These are potential custom-development services and roadmap opportunities, not claims that those features are already present in this release.

### Who may benefit from a tailored solution

- Small and medium-sized businesses.
- HR and payroll consultancies.
- Schools and training institutions.
- Non-profit organizations.
- Multi-branch businesses.
- Companies that need a secure employee self-service experience.

### Client enquiry call to action

**Need a salary calculator or a custom HR/payroll system for your organization?**

Discuss a solution tailored to your business workflow, reporting needs and operational requirements.

- **Developer:** Kisakye Paul — Software Developer
- **Email:** [kisakyepaul73@gmail.com](mailto:kisakyepaul73@gmail.com?subject=SalaryCalc%20Pro%20-%20Custom%20Business%20Solution%20Enquiry)
- **Portfolio:** [Kisakye Paul — Software Developer](https://pauldeveloper73.github.io/Kisakye-Paul-Elite-Portifolio/)

When presenting the project to prospective clients, use the current application as a working frontend demonstration and explain which production capabilities would be scoped and delivered separately.

---

## Deployment

SalaryCalc Pro is a static website and can be hosted on any static web host that serves HTML, CSS and JavaScript files.

### GitHub Pages

1. Create a GitHub repository for the project.
2. Upload the `index.html`, `js/` folder and `README.md` while keeping the relative paths intact.
3. In the repository settings, open **Pages**.
4. Select the deployment source and branch/folder containing the project files.
5. Save the settings and wait for GitHub Pages to publish the site.
6. Open the published URL and test the calculator, history, copy, print and CSV export on the deployed HTTPS site.

If the site is published from a repository subpath, keep relative asset and script paths (such as `./js/salary-calculator.js`) valid.

### Production deployment checks

- Confirm the correct site title and description.
- Add a canonical URL and social preview image for the final domain.
- Add the actual favicon file referenced by the HTML, or update the reference if using another asset.
- Verify all assets and relative URLs on the final hosting path.
- Test the website over HTTPS.
- Review external CDN usage and consider self-hosting production assets.
- Test on actual mobile devices and current browsers.
- Review the payroll disclaimer and all product claims before publication.

---

## Developer and contact

**Kisakye Paul**  
Software Developer — Web & Mobile Application Development

- **Email:** [kisakyepaul73@gmail.com](mailto:kisakyepaul73@gmail.com)
- **Portfolio:** [pauldeveloper73.github.io/Kisakye-Paul-Elite-Portifolio](https://pauldeveloper73.github.io/Kisakye-Paul-Elite-Portifolio/)

For project discussions, include your organization type, the workflow you want to improve, the users who will use the system and any reporting or integration requirements.

---

## License

No open-source license is specified in this project at present. Unless a license is added to the repository, assume that reuse, redistribution and modification are not granted by default. Add a `LICENSE` file if you intend to publish the project under an open-source license or define specific client usage rights.

---

<p align="center">
  <strong>SalaryCalc Pro</strong><br />
  Understand your pay. Plan with confidence.<br />
  <sub>Developed by Kisakye Paul — Software Developer</sub>
</p>
