#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scanRepository, cleanRepository, Issue } from 'codemelt-sanitize-core';

// Exported wrapper service to support test mocking/spying
export const repositoryService = {
  scanRepository,
  cleanRepository
};

export const program = new Command();

program
  .name('codemelt-sanitize')
  .description('Sanitize repositories before commit, publishing, or AI sharing.')
  .version('0.1.0');

program
  .command('analyze')
  .description('Scan target directory for development noise')
  .argument('[directory]', 'directory to analyze', '.')
  .action(async (directory) => {
    try {
      const result = await repositoryService.scanRepository({ root: directory });

      const countByType = (type: string) => result.issues.filter((i: Issue) => i.type === type).length;
      const comments = countByType('comment');
      const todos = countByType('todo');
      const fixmes = countByType('fixme');
      const logs = countByType('console_log');

      console.log(`Files scanned: ${result.filesScanned.length}`);
      console.log(`Files skipped: ${result.filesSkipped.length}`);
      console.log();
      console.log(`Comments: ${comments}`);
      console.log(`TODOs: ${todos}`);
      console.log(`FIXMEs: ${fixmes}`);
      console.log(`Console logs: ${logs}`);
      console.log();
      console.log(`Total issues: ${result.totalIssues}`);

      if (result.errors.length > 0) {
        console.log();
        console.log(chalk.red(`Errors (${result.errors.length}):`));
        for (const err of result.errors) {
          console.log(chalk.red(`  ${err.filePath}: ${err.error}`));
        }
      }
    } catch (err: any) {
      console.error(chalk.red(`Fatal error: ${err.message || err}`));
      process.exitCode = 1;
    }
  });

program
  .command('clean')
  .description('Clean development noise from source code in target directory')
  .argument('[directory]', 'directory to clean', '.')
  .option('--dry-run', 'simulate cleaning without modifying files')
  .action(async (directory, options) => {
    try {
      const dryRun = !!options.dryRun;

      if (dryRun) {
        console.log(chalk.yellow('DRY RUN MODE\nNo files were modified.\n'));
      }

      const result = await repositoryService.cleanRepository({
        root: directory,
        dryRun
      });

      console.log(`Files scanned: ${result.filesScanned.length}`);
      console.log(`Files cleaned: ${result.filesCleaned.length}`);
      console.log(`Files skipped: ${result.filesSkipped.length}`);
      console.log(`Bytes saved: ${result.bytesSaved}`);
      console.log(`Issues found: ${result.totalIssues}`);

      if (result.errors.length > 0) {
        console.log();
        console.log(chalk.red(`Errors (${result.errors.length}):`));
        for (const err of result.errors) {
          console.log(chalk.red(`  ${err.filePath}: ${err.error}`));
        }
      }
    } catch (err: any) {
      console.error(chalk.red(`Fatal error: ${err.message || err}`));
      process.exitCode = 1;
    }
  });

const isMain = import.meta.url.startsWith('file:') &&
               process.argv[1] &&
               (process.argv[1].endsWith('index.js') || process.argv[1].includes('codemelt-sanitize'));

if (isMain) {
  program.parse(process.argv);
}
