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

Merge owner-approved changes through task -> phase -> `develop` using PRs.
Then create `release/vX.Y.Z` from the merged `develop` commit and create the
GitHub Release draft at that exact release-branch commit. Draft creation may
create the version tag; do not retarget it. Wait for the owner's APK upload
and confirmation, verify the artifact, and obtain separate publication
approval. Only then merge the release branch into `main` with `--no-ff`,
verify the tag target and back-merge into `develop`.

If the repository, baseline, or target commit is ambiguous, stop and explain the problem.

---

## 4. Determine the Release Scope

The release scope is the range between:

**Previous published release tag → Approved target commit**

For example:

```text
Previous release: v1.1.0
Target release:   v1.2.0
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
- Bug-fix-only releases bump PATCH; a release with visible new features bumps
  MINOR; breaking changes bump MAJOR.
- Release 2 is planned as v1.1.0 if it includes the Budget Pace graph,
  otherwise v1.0.1. Confirm with the owner when preparing Release 2.
- Never reuse a version.
- Never downgrade a version.
- Never invent version numbers.
- Respect release-config.md.
- Inspect package manifests and application version files.
- Change `app.json`, `package.json` and `package-lock.json` versions only in
  the release-preparation task for that version.
- Explain the version recommendation before publication.

If versioning is uncertain, request clarification.

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
request the owner's approval before committing it. After approval, finalize
all release details and screenshots, move the note to
`docs/releases/published/vX.Y.Z.md`, then include it with the approved work in
the task -> phase -> `develop` PR path, using subject
`docs: draft vX.Y.Z release notes`. The finalized note must be in
`published/` before GitHub Release draft creation. Release content belongs in
Git, never in `/tmp`. Never leave an approved release note in `drafts/` or an
unapproved draft in `published/`.

The file must contain the complete release notes in publication-ready Markdown.

Prepare release metadata containing:

- Application name.
- Version.
- Previous version.
- Release type.
- Release date.
- Base and target commit identifiers for internal range analysis only.
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

## 13. Merge, build and publish the GitHub Release

After the owner explicitly approves the Markdown release draft:

1. Verify GitHub authentication.
2. Verify repository ownership.
3. Recheck the previous release.
4. Recheck the approved target commit.
5. Confirm the version does not already exist.
6. Verify the final Markdown draft.
7. Commit the approved release work on its task branch and merge task ->
   phase -> `develop` through pull requests, following the repository branch
   rules. Run all six gates and complete required device checks before merge.
8. Create `release/vX.Y.Z` from the merged `develop` commit. Create the
   GitHub Release draft at that exact release-branch commit, attach every
   supplied screenshot and use each absolute asset URL in the draft body.
   Immediately use the ask-user dialogue to request the absolute local path
   to the owner's built APK and state its exact required filename. Wait for
   the owner to provide the path or confirm manual upload. Do not start EAS
   or Gradle builds.
9. The owner builds the application from that merged source and uploads the
   APK to this GitHub Release draft under the exact versioned filename, then
   confirms the upload is complete.
10. After confirmation, verify the uploaded APK privately against its build
    artifact and complete the post-build artifact, Download block, link,
    README and build-history checks below while the release remains a draft.
11. After explicit publication approval and successful verification, merge
    the release branch `--no-ff` into `main`, verify its tag target and publish.
    The fully reviewed note is already in `published/` before draft creation;
    record final publication details there without moving or duplicating it.
12. Verify successful publication and retrieve the actual GitHub Release URL.

Do not commit a release candidate before approval of its Markdown draft. The
owner's APK build/upload confirmation is a separate gate and does not by itself
authorize publication.

### Required post-build checklist (before publication)

For every GitHub release:

1. The owner attaches the current release Android APK under the versioned
   latest filename `WealthWise-android-latest-vX.Y.Z.apk`:

   ```bash
   gh release upload vX.Y.Z /path/to/WealthWise-android-latest-vX.Y.Z.apk
   ```

2. Add the version, release date, asset link, iOS availability message and
   releases-page link to the Download block in the published Markdown and
   GitHub release body. Verify the APK digest privately against the build
   artifact, but never include it in human-authored release material. GitHub
   may expose a platform-generated asset digest that cannot be removed by
   editing the release. The latest published block must match the README and
   use the latest route.
   When a newer version is published, remove `latest` from the previous
   release asset name, using `WealthWise-android-vX.Y.Z.apk`, and update the
   old Download block to its matching versioned asset URL. Never use
   `/latest/` for an older release. When adding a block to an existing
   published note, add or replace only that block; do not otherwise rewrite
   the file.

3. Keep the README Download section and the latest release Download block
   byte-identical. When a newer version is published, rename only the previous
   release asset by removing `latest` from its filename, then replace only
   that release's Download block with its version-specific URL and filename;
   do not change anything else in that old note.
4. Verify the current latest link and every affected versioned direct Android
   link with `curl -I -L`; record final HTTP status and `Content-Length`. Each
   must return HTTP 200 with the expected artifact size. Verify digests
   privately against the build artifact and never include them in
   human-authored release material:

   ```bash
   curl -I https://github.com/sahilsheikh-dev/WealthWise/releases/latest/download/WealthWise-android-latest-vX.Y.Z.apk
   curl -I -L https://github.com/sahilsheikh-dev/WealthWise/releases/latest/download/WealthWise-android-latest-vX.Y.Z.apk
   curl -I https://github.com/sahilsheikh-dev/WealthWise/releases/download/vX.Y.Z/WealthWise-android-vX.Y.Z.apk
   curl -I -L https://github.com/sahilsheikh-dev/WealthWise/releases/download/vX.Y.Z/WealthWise-android-vX.Y.Z.apk
   ```

5. Update the root README Download and What's new sections and its
   releases-page link for every release. The latest README Download block and
   published release Download block must be identical; older notes use their
   matching versioned release URL and filename, never the latest route. State
   unavailable artifacts plainly; do not publish an invented URL.
6. Record the verified owner-supplied build ID, Android `versionCode`,
   profile, date and status in the `release-history.md` Builds table. Do not
   record source commits or digests there. Production Android AABs are for
   Google Play; `android-apk` builds are for GitHub downloads; iOS distribution
   is not offered.
7. Confirm both links return HTTP 200 with the expected size and that the
   README, published Markdown, `release-history.md` and GitHub release assets
   agree. The release remains incomplete until every check passes.
8. Add every supplied screenshot to the release's published Markdown and
   GitHub Release body. Keep only the latest release's complete screenshot set
   in the README Screenshots section, without a version title. Store only
   reviewed images under `docs/releases/screenshots/vX.Y.Z/`, attach them to
   the matching GitHub Release, and verify that each rendered image link
   works. Display thumbnails at 150 pixels wide, with no more than four per
   row, ordered Home, Assets, Liabilities, Emergency Fund, Goals, Insurance,
   Budget, Transactions; omit unavailable screens. For v1.0.0, v1.1.0 and future releases, use screenshots from
   the matching release build, not a newer app. Exception: the owner has
   explicitly confirmed that the same supplied image is intentional for
   v1.0.0, v1.1.0 and approved v1.1.1; preserve that image for those versions.
   Capture with synthetic demo data on the owner-designated test setup; never
   capture personal phone data. Keep any one-off capture script outside the
   repository, do not upload or package it, and delete it after capture. The
   owner explicitly authorizes screenshot-only additions to the existing
   v1.0.0 and v1.1.0 published notes and GitHub Release bodies; make no other
   historical edits.

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

## 14. Pre-draft Release Note Finalization

Complete this section after Markdown approval and before the PR integration
and GitHub Release draft steps in Section 13.

1. Move the complete, final release notes to:

   `docs/releases/published/vX.Y.Z.md`

2. Update:

   `docs/releases/release-history.md`

3. Update:

   `docs/releases/README.md`

4. Confirm the draft was moved, with no duplicate left in `drafts/` or at the
   `docs/releases/` root.

5. Commit the approved note with the release work. Never leave an approved
   release note in drafts or an unapproved draft in published.

6. Verify the target commit and that the note is ready to serve as the
   canonical GitHub release-body source. Record final release URL and
   publication details only after the release is published.

7. Preserve all historical release records.

The published Markdown file is the canonical release-body source. Update a
GitHub release body from that file with:

```bash
gh release edit vX.Y.Z --notes-file docs/releases/published/vX.Y.Z.md
```

Never overwrite an existing release record.
Keep all published release Markdown files under `docs/releases/published/`;
never store a published record at the `docs/releases/` root or in `drafts/`.
Push branches only with the owner's explicit authorization. Never force-push.
Commit the approved, finalized note with its release task. There is no
post-publication note move.

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
- Attached `WealthWise-android-latest-vX.Y.Z.apk` to the current release; the `/latest/`
  route and each affected version-specific route return HTTP 200 with the
  expected artifact size. When superseding a release, rename that older asset
  to `WealthWise-android-vX.Y.Z.apk` and update its Download block. Verify the
  APK digest privately; do not include it in human-authored release material.
- Download block in published Markdown and release body; the latest block
  matches the README and older release blocks use versioned links.
- The current `/latest/` link and each affected version-specific link checked
  with `curl -I -L`, including final status and `Content-Length`.
- README Download and What's new sections and releases-page link are current.
- EAS build ID, Android `versionCode`, profile, date and status in Builds;
  no source commit or digest is published.
- Matching README, published Markdown, release-history build record and GitHub
  release assets.
- Every supplied version-specific screenshot appears in that release's
  published Markdown and GitHub Release body and is attached to that GitHub
  Release. The README Screenshots section contains only the latest release's
  complete screenshot set and has no version title. If none were supplied,
  reuse the previous release's complete screenshot set for the new release
  and README. Order thumbnails Home, Assets, Liabilities, Emergency Fund,
  Goals, Insurance, Budget, Transactions. Each image renders. Release notes
  and GitHub release bodies omit a Contributors section. No capture script or
  personal data is included.

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