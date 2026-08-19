/**
 * 自研最小测试框架（无 devDependencies）
 */
let failedCount = 0;

export function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    failedCount++;
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
  }
}

export function finish(label) {
  console.log(`\n=== ${label} ===`);
  if (failedCount > 0) {
    console.error(`${failedCount} 个测试失败`);
    process.exit(1);
  }
  console.log('全部通过!');
}
