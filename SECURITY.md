# Security Policy

## Supported Versions

Security fixes are applied to the latest commit on `main`. Older commits,
forks, and self-hosted deployments are not maintained by this repository.

## Reporting a Vulnerability

Do not report security vulnerabilities in a public issue or pull request.
Use the repository's **Security** tab and select **Report a vulnerability**
to open a private GitHub Security Advisory:

https://github.com/Jascenn/CloudMeet/security/advisories/new

Please include:

- the affected commit or version
- deployment platform and configuration relevant to the issue
- reproduction steps or a minimal proof of concept
- the expected and actual impact
- any suggested mitigation

Do not include real user data, OAuth tokens, API keys, or other live secrets in
the report. If a credential may have been exposed, revoke or rotate it before
sharing evidence.

This is a self-hosted project. Maintainers can fix the repository code, but
each deployment operator is responsible for applying updates, rotating
credentials, and reviewing their Cloudflare, Google, Microsoft, and GitHub
configuration.

## Secure Deployment Checklist

- Keep secrets in GitHub Actions or Cloudflare secret storage, never in Git.
- Use unique values for `JWT_SECRET` and `CRON_SECRET`.
- Restrict OAuth applications to the expected callback URLs.
- Do not connect a public demo to a production calendar or mailbox.
- Review dependency updates and deployment logs before publishing changes.
