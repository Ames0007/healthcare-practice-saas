# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added

- Repository governance structure
- Specification organization
- Claude Code implementation tracking
- Architectural decision log
- Risk/blocker register
- Laravel 13.26.1 backend bootstrap under `backend/` (TASK-002): modular-monolith
  structural convention (`backend/app/Modules/`, `backend/ARCHITECTURE.md`),
  `/api/v1` route-loading convention, `/api/v1/health` liveness endpoint,
  environment-driven CORS configuration. No business functionality.
