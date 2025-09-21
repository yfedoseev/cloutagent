#!/usr/bin/env node

/**
 * Smart Commit & Push Command
 *
 * Intelligently groups changed files into logical commits and pushes them.
 * Groups files by:
 * - Documentation (*.md, *.txt, docs/)
 * - Configuration (package.json, *.config.*, .env*, Makefile, etc.)
 * - Source code by directory/feature
 * - Tests
 * - Build/CI files
 */

const { execSync } = require('child_process');
const path = require('path');

function execCommand(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', ...options }).trim();
  } catch (error) {
    if (options.allowFailure) return '';
    throw error;
  }
}

function getChangedFiles() {
  const status = execCommand('git status --porcelain', { allowFailure: true });
  if (!status) return [];

  return status.split('\n')
    .filter(line => line.trim())
    .map(line => {
      const status = line.substring(0, 2);
      const file = line.substring(3);
      return { status, file };
    });
}

function categorizeFiles(files) {
  const categories = {
    docs: { files: [], desc: 'Update documentation' },
    config: { files: [], desc: 'Update configuration' },
    build: { files: [], desc: 'Update build/CI configuration' },
    tests: { files: [], desc: 'Update tests' },
    source: { files: [], desc: 'Update source code' },
    other: { files: [], desc: 'Miscellaneous changes' }
  };

  files.forEach(({ file, status }) => {
    const ext = path.extname(file);
    const basename = path.basename(file);
    const dirname = path.dirname(file);

    // Documentation
    if (ext === '.md' || ext === '.txt' || dirname.includes('docs') ||
        basename === 'README' || basename === 'CHANGELOG') {
      categories.docs.files.push({ file, status });
    }
    // Configuration
    else if (basename === 'package.json' || basename === 'package-lock.json' ||
             basename.includes('config') || basename.startsWith('.env') ||
             basename === 'Makefile' || basename.startsWith('.') ||
             ext === '.json' || ext === '.yaml' || ext === '.yml' ||
             ext === '.toml' || ext === '.ini') {
      categories.config.files.push({ file, status });
    }
    // Build/CI
    else if (dirname.includes('.github') || dirname.includes('ci') ||
             basename.includes('docker') || basename.includes('build') ||
             ext === '.dockerfile' || basename === 'Dockerfile') {
      categories.build.files.push({ file, status });
    }
    // Tests
    else if (dirname.includes('test') || dirname.includes('spec') ||
             file.includes('.test.') || file.includes('.spec.') ||
             dirname.includes('__tests__')) {
      categories.tests.files.push({ file, status });
    }
    // Source code
    else if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx' ||
             ext === '.py' || ext === '.go' || ext === '.rs' || ext === '.java' ||
             ext === '.c' || ext === '.cpp' || ext === '.h' || ext === '.hpp') {
      categories.source.files.push({ file, status });
    }
    // Other
    else {
      categories.other.files.push({ file, status });
    }
  });

  return Object.entries(categories)
    .filter(([_, category]) => category.files.length > 0)
    .map(([name, category]) => ({ name, ...category }));
}

function createCommit(category) {
  const files = category.files.map(f => f.file);

  // Add files
  files.forEach(file => {
    execCommand(`git add "${file}"`);
  });

  // Generate commit message
  const fileList = files.length > 3
    ? `${files.slice(0, 3).join(', ')} and ${files.length - 3} more`
    : files.join(', ');

  const commitMsg = `${category.desc}

Modified files: ${fileList}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>`;

  // Commit
  execCommand(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);

  return commitMsg.split('\n')[0]; // Return first line for summary
}

function main() {
  try {
    // Check if we're in a git repository
    execCommand('git rev-parse --git-dir', { allowFailure: true });

    const changedFiles = getChangedFiles();

    if (changedFiles.length === 0) {
      console.log('No changes to commit.');
      return;
    }

    console.log(`Found ${changedFiles.length} changed files:`);
    changedFiles.forEach(({ file, status }) => {
      console.log(`  ${status} ${file}`);
    });

    const categories = categorizeFiles(changedFiles);

    console.log(`\nGrouped into ${categories.length} logical commits:`);

    const commitSummaries = [];

    for (const category of categories) {
      console.log(`\n📦 ${category.desc} (${category.files.length} files)`);
      category.files.forEach(({ file }) => console.log(`    ${file}`));

      const summary = createCommit(category);
      commitSummaries.push(summary);
      console.log(`✅ Committed: ${summary}`);
    }

    // Push to remote if available
    try {
      const remoteBranch = execCommand('git rev-parse --abbrev-ref --symbolic-full-name @{u}', { allowFailure: true });
      if (remoteBranch) {
        console.log('\n🚀 Pushing to remote...');
        execCommand('git push');
        console.log('✅ Pushed successfully!');
      } else {
        console.log('\n📝 No remote branch configured. Commits created locally.');
        console.log('   Run "git push" manually when ready.');
      }
    } catch (error) {
      console.log('\n📝 Could not push to remote. Commits created locally.');
    }

    console.log(`\n🎉 Created ${commitSummaries.length} commits successfully!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}