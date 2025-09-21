# Smart Commit and Push

Intelligently analyze changed files, group them into logical commits, and push to remote repository

## Instructions

1. **Initialize Smart Commit Analysis**
   - Acknowledge the request for intelligent commit grouping
   - Analyze the current git repository state
   - Prepare to examine changed files systematically

2. **Analyze Changed Files**
   - Execute `git status --porcelain` to identify all changed files
   - Categorize files by their modification status (modified, added, deleted)
   - Identify file types and directory structures
   - Note any untracked files that should be included

3. **Group Files by Logical Changes**
   Analyze file relationships and group by logical purpose:

   ### Feature-Based Grouping
   - Related component files (component + test + docs for same feature)
   - API changes with corresponding frontend updates
   - Database migrations with related application code
   - New features with complete implementation

   ### Change Type Grouping
   - Bug fixes (fix + related tests + documentation updates)
   - Refactoring changes (code improvements without feature changes)
   - Performance optimizations (code + tests + benchmarks)
   - Security updates (fixes + tests + security documentation)

   ### Infrastructure Grouping
   - Configuration updates (setup, tooling, environment)
   - Build/deployment changes (CI, Docker, deployment configs)
   - Dependency updates (package files + lock files)
   - Documentation-only changes (separate from code changes)

4. **Generate Semantic Commit Messages**
   For each logical group:
   - Create descriptive commit messages that explain the "why"
   - Follow conventional commit format when applicable
   - Include affected components or features
   - Add file count and summary for context
   - Include Claude Code signature

5. **Execute Git Workflow**
   Follow complete git synchronization process:

   ### Pre-commit Synchronization
   - `git fetch origin` - Fetch all remote references
   - `git pull origin <current-branch>` - Pull latest changes from current branch
   - `git merge origin/main` - Merge latest changes from main branch
   - Resolve any merge conflicts if they arise

   ### Commit Process
   - `git add <files>` - Stage files for each logical group
   - `git commit -m "<message>"` - Commit with semantic message
   - Repeat for each logical group

   ### Post-commit Push
   - `git push origin <current-branch>` - Push all commits to remote
   - Verify successful push and remote synchronization

6. **Validate and Report**
   - Confirm all changes have been committed
   - Report number of commits created
   - Show commit messages and affected files
   - Provide git log summary
   - Report push status and remote synchronization

## Usage Examples

```bash
# Basic usage - commit all changes intelligently
/smart-commit

# After making multiple related changes
/smart-commit

# When working on feature branch with multiple logical changes
/smart-commit
```

## Key Principles

- **Atomic Commits**: Each commit represents a complete, independent change
- **Logical Grouping**: Files are grouped by purpose, not file type
- **Semantic Messages**: Commit messages explain the change, not just list files
- **Remote Sync**: Always sync with remote before and after commits
- **Conflict Prevention**: Merge remote changes before pushing
- **Complete Workflow**: Handle entire git workflow automatically

## Output Expectations

- Analysis of all changed files with categorization
- 1-5 logical commits based on change complexity
- Descriptive commit messages explaining the purpose of each change
- Complete git synchronization with remote repository
- Clear reporting of actions taken and final state
- Conflict resolution guidance if merge conflicts occur
/
## Prerequisites

- Must be in a git repository with remote origin configured
- Files should be saved before running (unsaved changes won't be included)
- Current branch should be tracked by remote (or will be set up automatically)
- Internet connection required for remote synchronization
