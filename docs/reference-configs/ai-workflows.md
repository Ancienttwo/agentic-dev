# AI-Assisted Development Workflows Reference

> Extracted from `07-footer.partial.md` — detailed AI workflow templates, session protocol, and pair programming modes.

## 10 AI Workflows

```yaml
# ===== 1. Code Review =====
AI_CODE_REVIEW:
  TRIGGER: Before commit / PR
  COMMAND: /review
  CHECKS:
    - Security vulnerabilities (OWASP Top 10)
    - Performance anti-patterns
    - Code style violations
    - Missing error handling
    - Test coverage gaps
  OUTPUT: Inline comments + Summary

# ===== 2. Test Generation =====
AI_TEST_GENERATION:
  TRIGGER: After feature implementation
  COMMAND: /generate-tests
  TYPES:
    - Unit tests (function level)
    - Integration tests (API level)
    - E2E tests (critical paths)
  COVERAGE_TARGET: 80%+

# ===== 3. Documentation =====
AI_DOCUMENTATION:
  AUTO_GENERATE:
    - API documentation from code
    - README from project structure
    - JSDoc/TSDoc from function signatures
  KEEP_IN_SYNC: On every commit

# ===== 4. Refactoring Suggestions =====
AI_REFACTORING:
  TRIGGER: Code smell detected
  SUGGESTIONS:
    - Extract function/component
    - Simplify conditionals
    - Remove duplication
    - Improve naming
  APPROVAL: Human review required

# ===== 5. Dependency Management =====
AI_DEPENDENCY_AUDIT:
  TRIGGER: Weekly / Before release
  CHECKS:
    - Outdated packages
    - Security vulnerabilities (npm audit)
    - License compliance
    - Bundle size impact
  AUTO_PR: For patch updates only

# ===== 6. Error Analysis =====
AI_ERROR_ANALYSIS:
  TRIGGER: Production error
  PROCESS:
    1. Parse error stack trace
    2. Find related code context
    3. Search for similar issues (GitHub/SO)
    4. Suggest fix with confidence score
  OUTPUT: Fix PR or investigation notes

# ===== 7. Performance Profiling =====
AI_PERFORMANCE:
  TRIGGER: Before release / On demand
  ANALYZE:
    - Bundle size changes
    - Render performance
    - API response times
    - Memory leaks
  COMPARE: Against previous version

# ===== 8. Database Migration =====
AI_MIGRATION:
  TRIGGER: Schema change detected
  GENERATE:
    - Migration script
    - Rollback script
    - Data validation queries
  REVIEW: DBA approval for production

# ===== 9. API Design Review =====
AI_API_REVIEW:
  TRIGGER: New endpoint added
  CHECK:
    - RESTful conventions
    - Response format consistency
    - Error handling standards
    - Rate limiting considerations
    - Documentation completeness

# ===== 10. Security Scan =====
AI_SECURITY:
  TRIGGER: Before deploy
  SCAN:
    - Secrets in code
    - SQL injection
    - XSS vulnerabilities
    - CSRF protection
    - Auth/AuthZ issues
  BLOCK_DEPLOY: On critical findings
```

## Session Continuity Protocol

```yaml
SESSION_HANDOFF:
  BEFORE_END:
    1. Update tasks/todo.md review section with completion evidence
    2. Append new patterns to tasks/lessons.md after corrections
    3. Update plan status in plans/ (Executing -> Archived on completion)
    4. Update tasks/research.md if new hidden contracts or findings were discovered
    5. Update `tasks/workstreams/` only when durable capability progress changed
    6. Document any blockers or decisions needed
    7. Create an explicit commit if the work should be checkpointed

  NEXT_SESSION_START:
    1. AI reads tasks/todo.md for active execution checklist
    2. AI reads tasks/lessons.md for prevention rules
    3. AI reads tasks/research.md (if exists)
    4. AI checks latest plan status in plans/
    5. AI reads `tasks/workstreams/` only for durable capability context
    6. AI checks git status for uncommitted changes

  CONTEXT_PRESERVATION:
    - Key decisions -> docs/architecture/decisions/
    - Technical debt -> tasks/todo.md (Backlog section)
    - Learnings -> tasks/lessons.md
    - Durable progress -> tasks/workstreams/
```

## AI Pair Programming Modes

```yaml
MODES:
  DRIVER:
    # AI writes code, human reviews
    - AI implements based on spec
    - Human provides feedback
    - AI iterates until approved

  NAVIGATOR:
    # Human writes code, AI reviews
    - Human implements
    - AI provides real-time suggestions
    - AI catches errors before commit

  ENSEMBLE:
    # Multiple AI agents collaborate
    - Architect designs
    - Developer implements
    - Reviewer critiques
    - Human makes final call

  RUBBER_DUCK:
    # AI asks clarifying questions
    - Human explains intent
    - AI identifies gaps in logic
    - Better solutions emerge through dialogue
```
