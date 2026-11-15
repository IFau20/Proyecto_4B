# Google sign-in implementation

1. Add a failing Google authorization/code/token/session test, then extend the existing OIDC handler with fixed Google endpoints and claim validation. Keep Microsoft regression coverage.
2. Add a failing rendered button/translation test, then implement provider-specific label.
3. Add environment permissions, Google local configurator and diagnostics; document OAuth registration and institutional-independent activation.
4. Run complete backend/frontend suites and production build. Review diff and publish develop without modifying main.

Evidence: Google backend and frontend tests both failed on missing behavior before implementation. External credentials are not available; real-account activation remains an explicit user setup step.

Validation: 112 backend tests and 47 frontend tests passed; production build passed. Public Google discovery metadata matched all fixed endpoints. Independent review found no important issues. auth:status correctly reports missing Google credentials without printing secrets. PowerShell is not installed in the Linux test environment, so Windows configurator execution remains unverified here.
