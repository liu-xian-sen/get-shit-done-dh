/**
 * Execute-phase active flag prompt tests
 *
 * Guards against prompt wording that makes optional flags look active by default.
 * This is especially important for weaker runtimes that may infer `--gaps-only`
 * from the command docs instead of the literal user arguments.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const COMMAND_PATH = path.join(__dirname, '..', 'commands', 'gsd', 'execute-phase.md');

describe('execute-phase command: active flags are explicit', () => {
  test('command file exists', () => {
    assert.ok(fs.existsSync(COMMAND_PATH), 'commands/gsd/execute-phase.md should exist');
  });

  test('objective says documented flags are not implied active', () => {
    const content = fs.readFileSync(COMMAND_PATH, 'utf-8');
    const objectiveMatch = content.match(/<objective>([\s\S]*?)<\/objective>/);
    assert.ok(objectiveMatch, 'should have <objective> section');
    assert.ok(
      objectiveMatch[1].includes('可用行为，并非暗示的活动行为'),
      'objective should state that documented flags are not automatically active'
    );
    assert.ok(
      objectiveMatch[1].includes('`$ARGUMENTS`'),
      'objective should tie flag activation to literal $ARGUMENTS presence'
    );
  });

  test('context separates available flags from active flags', () => {
    const content = fs.readFileSync(COMMAND_PATH, 'utf-8');
    assert.ok(
      content.includes('可用可选标志（仅限文档'),
      'context should clearly label flags as documentation only'
    );
    assert.ok(
      content.includes('活动标志必须源自 `$ARGUMENTS`'),
      'context should have a separate active-flags section'
    );
  });

  test('context explicitly warns against inferring inactive flags', () => {
    const content = fs.readFileSync(COMMAND_PATH, 'utf-8');
    assert.ok(
      content.includes('不要仅仅因为某个标志记录在此提示中就推断它是活动的'),
      'context should forbid inferring flags from documentation alone'
    );
    assert.ok(
      content.includes('`--interactive` 令牌出现在 `$ARGUMENTS` 中时'),
      'context should apply the same active-flag rule to --interactive'
    );
    assert.ok(
      content.includes('如果这些令牌都没有出现，则运行标准的完整阶段执行流程'),
      'context should define the no-flags fallback behavior'
    );
  });
});
