export const conventionalCommitTemplate = [
    'Choose a type from the following options that best describes the git diff:',
    '- build: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)',
    '- chore: Updating libraries, copyrights or other repo setting, includes updating dependencies.',
    '- ci: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, GitHub Actions)',
    '- docs: Non-code changes, such as fixing typos or adding new documentation (example scopes: Markdown file)',
    '- feat: a commit of the type feat introduces a new feature to the codebase',
    '- fix: A commit of the type fix patches a bug in your codebase',
    '- perf: A code change that improves performance',
    '- refactor: A code change that neither fixes a bug nor adds a feature',
    '- style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
    '- test: Adding missing tests or correcting existing tests\n',
    'Provide a summary in the format: `<type>(<optional scope>): <commit message>`'
].join('\n');