# Memoria Release Checklist

The Git checkout is the release source of truth. Do not overwrite it from a stale local mirror.

1. Inspect `git status`, review the complete diff, and compare `main` with the remote.
2. Run `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
3. Update the version in `manifest.json`, `package.json`, both root entries in `package-lock.json`, and `versions.json`. Keep the declared minimum Obsidian version accurate.
4. Update `CHANGELOG.md`, release notes, and user documentation for changed interactions.
5. Back up the active vault's plugin installation before local testing. Determine the current vault path from the running Obsidian app; never assume an old NAS or sync path is still active. Copy only `main.js`, `manifest.json`, and `styles.css`, preserving `data.json` and all notes.
6. Test in Obsidian: new capture, edit/cancel, text selection, sidebar locations and reopening, search/review, report/calendar navigation, and URL tags. Test destructive operations using an isolated in-memory vault. Native iOS/Android behavior is separate from desktop or simulated tests.
7. Confirm repeated production builds give the same `main.js` SHA-256. Stage only reviewed source, tests, documentation, metadata, and the three plugin assets.
8. Commit, create an annotated tag matching the manifest **without a `v` prefix**, and push the tag. Create a **draft** GitHub release with that exact tag and upload all three assets before publishing it. Include a manual-install ZIP if desired; it must not contain user data.
9. Download the draft assets and compare SHA-256 with the local files. Publish the release, then push `main` to the same commit so the default-branch manifest cannot point to a missing release.
10. Verify the published release is not a draft or prerelease, its tag and `main` identify the same commit, and its manifest matches the tag. Download published assets again and compare hashes. Only then report success.

For a beta, use a separate branch and prerelease tag. Do not change the stable default-branch manifest to a prerelease version. Preserve previous releases for rollback.

`publish.ps1` is a legacy source-mirror workflow. Inspect its configured paths and behavior before use; it is not the guarded draft-first process above. Local `.tmp/` artifacts and `RELEASE_NOTES_*.md` are intentionally ignored by Git.
