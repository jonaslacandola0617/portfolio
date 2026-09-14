# GitHub Project Sync

Project Management can discover repositories from the GitHub profile configured in Site Settings and import them as portfolio drafts.

## Default behavior

No additional credentials are required for public repositories. `/admin/projects` reads the GitHub profile URL from Site Settings, loads that account's public repositories, sorts them by recent activity, and marks repositories whose GitHub URL is already attached to a portfolio project as linked.

Importing a repository creates a **draft** project. GitHub supplies the initial repository title, description, repository URL, homepage, topics, and language data, but the project stays unpublished so the portfolio copy, category, thumbnail, skills, dates, and documentation can be reviewed first.

Syncing an already linked repository is deliberately non-destructive. It refreshes the GitHub URL, adds newly detected languages to Technologies, adds GitHub topics to Tags, and fills the live site URL only when the portfolio project does not already have one. It does **not** overwrite the project's title, summary, publish/progress state, or TipTap documentation.

## Optional GitHub App access

To include private repositories or limit the integration to specifically selected repositories, create a GitHub App and configure these environment variables in Vercel:

```env
GITHUB_PROJECT_APP_ID="..."
GITHUB_PROJECT_APP_SLUG="..."
GITHUB_PROJECT_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Recommended GitHub App repository permissions:

- **Metadata:** Read-only
- **Contents:** Read-only

Do not request write permissions. The portfolio only needs to discover repository metadata and language information.

Install the GitHub App on the personal account or organization that owns the repositories you want the portfolio to see. GitHub lets you grant access to all repositories or only selected repositories. Once installed, Project Management automatically detects the installation through the app credentials and switches from public discovery to GitHub App access.

The private key must remain server-only. Never expose it through a `NEXT_PUBLIC_` environment variable or client component.

## Repository lifecycle

The intended workflow is:

**Available on GitHub → Imported as Draft → Edited in CMS → Published**

A repository never becomes public on the portfolio simply because it exists on GitHub.
