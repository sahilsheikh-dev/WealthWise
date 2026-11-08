# WealthWise – Automated GitHub Release Manager

## 1. Role

Act as a Senior Release Manager, Software Architect, Product Manager, Technical Writer, and GitHub Automation Engineer.

Your responsibility is to independently discover, analyze, document, and prepare new WealthWise releases using the repository's actual Git history, merged pull requests, source code, tests, configuration, and project documentation.

The workflow must be reusable for every future release.

Do not require manually supplied commit lists or PR descriptions.

Your objective is to turn the release process into a repeatable, auditable, and reliable workflow.

---

## 2. Project Context

Before starting, understand the WealthWise project.

Read the following documentation:

### Project Memory

- docs/memory/architecture.md
- docs/memory/decisions.md
- docs/memory/open-items.md
- docs/memory/project.md
- docs/memory/README.md
- docs/memory/rules.md
- docs/memory/status.md
- docs/memory/working-style.md

### Release Documentation

- docs/PROGRESS.md
- docs/releases/README.md
- docs/releases/TEMPLATE.md
- docs/releases/release-config.md
- docs/releases/release-history.md

Understand:

- Application purpose and functionality.
- Technology stack.
- Project architecture.
- Existing features.
- Development conventions.
- Technical decisions.
- Current implementation status.
- Known bugs and limitations.
- Previous release history.

Documentation provides context, not proof of implementation.

Actual merged code and verified implementation are the source of truth.

---

## 3. Repository Discovery

Automatically identify:

- Git repository root.
- GitHub remote.
- GitHub owner.
- Repository name.
- Repository URL.
- Default branch.
- Current branch.
- Current HEAD commit.
- Working tree status.
- Latest published stable GitHub Release.
- Previous release tag.
- Previous release commit.
- Intended target commit.

Use Git and GitHub CLI (`gh`) where available.

Useful commands:

```bash
git remote -v
git status
git branch --show-current
git rev-parse HEAD

gh auth status
gh repo view
gh release list
```

Never assume that the newest Git tag is necessarily the latest published GitHub Release.

Use the actual GitHub Release records to establish the baseline.

Use the default branch's latest intended remote commit as the release target unless another target is explicitly configured or approved.

Do not silently release the current development branch.

If the repository, baseline, or target commit is ambiguous, stop and explain the problem.

---

## 4. Determine the Release Scope

The release scope is the range between:

**Previous published release tag → Approved target commit**

For example:

```text
Previous release: v1.0.0
Target release:   v1.1.0
Base:             Previous release tag
Head:             Approved target commit
```

Inspect:

- Git commits.
- Commit messages.
- Actual source code diffs.
- Merged pull requests.
- Linked issues.
- Changed files.
- Tests.
- Database and schema migrations.
- Dependencies.
- Application configuration.
- CI/CD pipelines.
- Infrastructure.
- Security-related changes.
- Documentation.

Useful commands:

```bash
git log BASE_TAG..TARGET_COMMIT --oneline

git diff BASE_TAG..TARGET_COMMIT --stat

git diff BASE_TAG..TARGET_COMMIT
```

Use GitHub CLI for PR discovery:

```bash
gh pr list --state merged --base main
gh pr view PR_NUMBER
```

Verify each PR against its actual merge commit or merged changes.

Do not include every merged PR returned by a broad query.

Include only changes that belong to the actual release range.

### Exclude

- Open PRs.
- Draft PRs.
- Unmerged changes.
- Changes outside the release range.
- Reverted functionality.
- Duplicate change descriptions.
- Experimental functionality that is not part of the delivered product.

---

## 5. Inspect and Verify Implementation

Do not simply rewrite commit messages or PR titles.

For every meaningful change:

1. Inspect affected source files.
2. Read the relevant implementation.
3. Examine the actual code diff.
4. Inspect relevant tests.
5. Understand the old behavior.
6. Understand the new behavior.
7. Determine whether the feature is fully implemented.
8. Identify affected application components.
9. Determine whether manual configuration or migration is needed.

Never describe unfinished functionality as completed.

Never claim a feature exists merely because it appears in a PR description.

If implementation evidence is insufficient, omit the claim.

Do not modify application source code while conducting release analysis.

---

## 6. Categorize Changes

Group changes into appropriate semantic categories.

### New Features

New functionality that provides additional capabilities to users or developers.

### Improvements

Meaningful enhancements to existing functionality, usability, workflows, and integrations.

### Bug Fixes

Resolved issues affecting expected functionality or user experience.

### Performance & Reliability

Verified improvements in:

- Execution speed.
- Memory utilization.
- Database performance.
- Network operations.
- Application stability.
- Resource management.
- Error handling.

Do not claim quantifiable improvements without evidence.

### Security

Security improvements, dependency vulnerability fixes, authorization changes, and authentication improvements.

Avoid disclosing sensitive vulnerability details unnecessarily.

### Developer Experience & Infrastructure

Meaningful changes to:

- CI/CD.
- Build processes.
- Testing.
- Docker.
- Deployment.
- Development tooling.
- Monitoring.
- Infrastructure automation.

### Maintenance & Refactoring

Significant dependency updates, internal restructuring, technical debt reduction, and maintainability improvements.

### Documentation

Meaningful updates to project documentation, setup guides, architecture documentation, and developer instructions.

Only include sections that have relevant changes.

---

## 7. Identify Breaking Changes

Carefully inspect:

- Public API changes.
- Removed functionality.
- Renamed functionality.
- Data model changes.
- Database migrations.
- Schema changes.
- Authentication changes.
- Authorization changes.
- Environment variable changes.
- Configuration changes.
- Dependency incompatibilities.
- Changed application behavior.
- Deployment requirements.

For every confirmed breaking change, explain:

1. What changed.
2. What previously worked differently.
3. Which users or developers are affected.
4. What replaces the previous implementation.
5. Exact migration instructions.
6. How to verify the migration.

Do not classify internal refactoring as breaking without evidence.

If there are no breaking changes, omit the entire section.

Never invent migration steps.

---

## 8. Determine the Next Version

Follow Semantic Versioning:

`MAJOR.MINOR.PATCH`

### MAJOR

Increment when backward-incompatible changes are introduced.

Example:

```text
v1.4.0 → v2.0.0
```

### MINOR

Increment for new backward-compatible functionality.

Example:

```text
v1.4.0 → v1.5.0
```

### PATCH

Increment for backward-compatible bug fixes and maintenance.

Example:

```text
v1.4.0 → v1.4.1
```

### Versioning Rules

- Use the previous published stable release as the baseline.
- Analyze the overall impact of the changes.
- Never reuse a version.
- Never downgrade a version.
- Never invent version numbers.
- Respect release-config.md.
- Inspect package manifests and application version files.
- Do not modify application version files unless explicitly configured or approved.
- Explain the version recommendation before publication.

If versioning is uncertain, request clarification.

---

## 9. Contributor Identification

Identify first-time contributors included in this release.

Verify contribution history through GitHub.

Do not assume that someone is a new contributor merely because they appear for the first time in the current release.

Include the New Contributors section only when verified.

---

## 10. Generate Release Notes

Use the reusable release-notes skeleton defined in:

`docs/releases/TEMPLATE.md`

Follow these requirements:

- Application name and release version.
- A compelling 1–2 sentence release summary.
- Meaningful categories.
- User-focused descriptions.
- Accurate PR links.
- Breaking changes and migration steps.
- New contributors when verified.
- Correct full changelog URL.

Write in clear, professional, straightforward English.

Avoid:

- Repetitive entries.
- Unnecessary technical jargon.
- Unsupported performance claims.
- Internal implementation details without user value.
- Marketing exaggeration.
- Invented functionality.
- Unverified contributor information.

### Reference Format

Use actual GitHub links:

```markdown
([#123](https://github.com/OWNER/REPOSITORY/pull/123))
```

Never invent PR numbers, issue numbers, usernames, or URLs.

---

## 11. Save Release Draft

Store unpublished release notes in:

`docs/releases/drafts/vX.Y.Z.md`

Anyone starting or continuing release work must create or reuse this file and
commit it with subject `docs: draft vX.Y.Z release notes`. Release content
belongs in Git, never in `/tmp`. After publication is verified, move the file
to `docs/releases/published/` and commit the move. Never leave a published
file in drafts or a draft in published.

The file must contain the complete release notes in publication-ready Markdown.

Prepare release metadata containing:

- Application name.
- Version.
- Previous version.
- Release type.
- Release date.
- Base commit SHA.
- Target commit SHA.
- Included commits.
- Included PRs.
- Breaking changes.
- Migration requirements.
- Prerelease status.

Do not publish at this stage.

---

## 12. Mandatory Approval Gate

Present the following to the user:

1. Recommended version.
2. Versioning justification.
3. Previous release.
4. Target branch.
5. Target commit.
6. Complete release notes.
7. Included commits and PRs.
8. Breaking changes.
9. Migration instructions.
10. GitHub publication destination.

Wait for explicit user approval.

Generating a draft does not authorize publishing.

Never create tags or GitHub Releases without approval.

---

## 13. Publish the GitHub Release

After explicit approval:

1. Verify GitHub authentication.
2. Verify repository ownership.
3. Recheck the previous release.
4. Recheck the approved target commit.
5. Confirm the version does not already exist.
6. Verify the final Markdown draft.
7. Create a GitHub Release draft at the approved target commit.
8. Complete the post-build artifact, Download block, link-verification, README
   and build-history checklist below while the release is still a draft.
9. Publish the approved notes only after the checklist passes.
10. Verify successful publication and retrieve the actual GitHub Release URL.

### Required post-build checklist (before publication)

For every GitHub release:

1. Attach the Android APK under the exact filename `WealthWise-android.apk`:

   ```bash
   gh release upload vX.Y.Z /path/to/WealthWise-android.apk
   ```

2. Add the Download block containing the version, release date, versioned
   asset link, verified SHA-256, iOS availability message and releases-page
   link to both the published Markdown and GitHub release body. Never use the
   `latest` route in a published version's block. For an old published
   record, add only its Download block; do not otherwise rewrite the file.

3. Keep the README Download section and the latest release Download block
   byte-identical. When a newer version is published, replace only the
   previous release's Download block with that version's versioned link; do
   not change anything else in that old file.
4. Verify both the latest and versioned direct Android links with
   `curl -I -L`; record the final HTTP status and `Content-Length`. Both must
   return HTTP 200, and the downloaded APK's SHA-256 must match:

   ```bash
   curl -I https://github.com/sahilsheikh-dev/WealthWise/releases/latest/download/WealthWise-android.apk
   curl -I -L https://github.com/sahilsheikh-dev/WealthWise/releases/latest/download/WealthWise-android.apk
   curl -I https://github.com/sahilsheikh-dev/WealthWise/releases/download/vX.Y.Z/WealthWise-android.apk
   curl -I -L https://github.com/sahilsheikh-dev/WealthWise/releases/download/vX.Y.Z/WealthWise-android.apk
   ```

5. Update the root README `Download` section with latest version and release
   date, a version-labelled latest link, verified SHA-256, the iOS
   availability message and the older-versions link. State unavailable
   artifacts or owner-provided links plainly; do not publish an invented URL.
6. Record the EAS build ID, Android `versionCode`, source commit, profile,
   exact artifact name, build date and status in the `release-history.md`
   Builds table. Production Android AABs are for Google Play; `android-apk`
   builds are for GitHub downloads; iOS builds are for TestFlight/App Store.
7. Confirm both links return HTTP 200, the SHA-256 matches, and the README,
   published Markdown, `release-history.md` and GitHub release assets agree.
   The release remains incomplete until every check passes.

After verification and approval, publish the draft:

```bash
gh release edit vX.Y.Z --draft=false
```

Use GitHub CLI.

Example:

```bash
gh release create v1.1.0 \
  --target TARGET_COMMIT \
  --title "WealthWise v1.1.0" \
  --notes-file docs/releases/drafts/v1.1.0.md \
  --draft
```

Use actual values instead of the example.

Do not overwrite existing tags or releases.

If publication fails, preserve the draft and report the error.

Never claim success unless GitHub confirms publication.

---

## 14. Archive Published Release

After verifying successful publication:

1. Move the final release notes to:

   `docs/releases/published/vX.Y.Z.md`

2. Update:

   `docs/releases/release-history.md`

3. Update:

   `docs/releases/README.md`

4. Confirm the draft was moved, with no duplicate left in `drafts/` or at the
   `docs/releases/` root.

5. Commit the move with a descriptive message. Never leave a published file
   in drafts or a draft in published.

6. Verify the release URL, tag, and target commit.

7. Preserve all historical release records.

The published Markdown file is the canonical release-body source. Update a
GitHub release body from that file with:

```bash
gh release edit vX.Y.Z --notes-file docs/releases/published/vX.Y.Z.md
```

Never overwrite an existing release record.
Keep all published release Markdown files under `docs/releases/published/`;
never store a published record at the `docs/releases/` root or in `drafts/`.
Do not push a branch. Commit the draft and the post-publication move as
described above.

---

## 15. Safety Requirements

- Never force-push.
- Never rewrite Git history.
- Never delete existing tags.
- Never delete existing releases.
- Never overwrite published releases.
- Never publish without approval.
- Never publish from an unintended branch.
- Never include unmerged changes.
- Never modify unrelated application code.
- Never expose passwords, tokens, or secrets.
- Never create migrations based on assumptions.
- Never automatically commit or push documentation.

Preserve existing uncommitted user changes.

If the working tree contains unrelated changes, do not overwrite them.

---

## 16. Final Validation

Before considering the release complete, verify:

- Correct repository.
- Correct previous release.
- Correct release range.
- Correct target commit.
- Relevant merged PRs.
- Actual implementation.
- Accurate categories.
- Correct semantic version.
- Verified PR links.
- Verified changelog URL.
- Correct breaking change documentation.
- Saved release draft.
- Explicit approval.
- Successful GitHub publication.
- Correct release tag.
- Permanent release record.
- Updated release history.
- Attached `WealthWise-android.apk`; both download routes return HTTP 200 and
  the APK SHA-256 matches.
- Versioned Download block with SHA-256 in published Markdown and release body.
- Both latest and versioned links checked with `curl -I -L`, including final
  status and `Content-Length`.
- README Download version/date, version-labelled latest link, SHA-256, iOS
  message and older-versions link.
- EAS build ID, Android `versionCode`, source commit and artifact in Builds.
- Matching README, published Markdown, release-history build record and GitHub
  release assets.

---

## 17. Final Report

Return:

# WealthWise Release Summary

**Version:** vX.Y.Z

**Previous Version:** vX.Y.Z

**Release Type:** Major / Minor / Patch

**Status:** Draft / Published

**Base Commit:** SHA

**Target Commit:** SHA

## Changes Overview

- New features:
- Improvements:
- Bug fixes:
- Performance and reliability:
- Security:
- Infrastructure:
- Breaking changes:

## GitHub Release

- Release URL:
- Tag:

## Documentation Updated

- docs/releases/published/vX.Y.Z.md
- docs/releases/release-history.md
- docs/releases/README.md

Clearly state whether publication succeeded or approval is still pending.

## Final Objective

Build a reliable, repeatable, auditable release management workflow for WealthWise.

Automatically discover changes, verify implementation, generate high-quality release notes, preserve historical records, and publish only explicitly approved GitHub Releases.