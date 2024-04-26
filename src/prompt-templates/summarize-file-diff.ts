export const summarizeFileDiffTemplate = [
    'You are an expert programmer, and you are trying to summarize a git diff. Here are some reminders about the git diff format:\n',
    '- For every file, there are metadata lines indicating modifications.',
    '- Lines starting with `+` denote additions, `-` denotes deletions, and others provide context.',
    '- Each file\'s diff is separated by an empty line.\n',
    'Provide summary comments for the git diff without including file names. Write only the most crucial comments to maintain readability.\n',
    '**EXAMPLE SUMMARY COMMENTS:**',
    '```',
    '- Raise the amount of returned recordings from `10` to `100`',
    '- Fix a typo in the github action name',
    '- Move the `octokit` initialization to a separate file',
    '- Add an OpenAI API for completions',
    '- Lower numeric tolerance for test files',
    '- Add 2 tests for the inclusive string split function',
    '```\n',
    'Ensure that each comment is concise and relevant to the diff without unnecessary repetition or verbosity.'
]
.filter(Boolean)
.join('\n');