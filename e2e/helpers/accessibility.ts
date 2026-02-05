import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 접근성 위반 심각도 레벨
 */
export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

/**
 * 접근성 검사 옵션
 */
export interface AccessibilityCheckOptions {
  /** 검사할 최소 심각도 레벨 (기본: 'moderate') */
  minSeverity?: Severity;
  /** 포함할 규칙 태그 (예: ['wcag2a', 'wcag2aa']) */
  includeTags?: string[];
  /** 제외할 규칙 태그 */
  excludeTags?: string[];
  /** 제외할 규칙 ID */
  disableRules?: string[];
  /** 검사할 특정 CSS 선택자 (기본: 전체 페이지) */
  includeSelector?: string;
  /** 제외할 CSS 선택자 */
  excludeSelectors?: string[];
}

/**
 * 접근성 위반 정보
 */
export interface AccessibilityViolation {
  id: string;
  impact: Severity;
  description: string;
  help: string;
  helpUrl: string;
  nodes: {
    html: string;
    target: string[];
    failureSummary?: string;
  }[];
}

/**
 * 접근성 검사 결과
 */
export interface AccessibilityResult {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
}

/**
 * 접근성 보고서
 */
export interface AccessibilityReport {
  url: string;
  timestamp: string;
  summary: {
    totalViolations: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  violations: AccessibilityViolation[];
}

/**
 * 심각도 레벨 우선순위 맵
 */
const SEVERITY_PRIORITY: Record<Severity, number> = {
  critical: 4,
  serious: 3,
  moderate: 2,
  minor: 1,
};

/**
 * 페이지의 접근성을 검사합니다.
 *
 * @param page - Playwright Page 객체
 * @param options - 검사 옵션
 * @returns 접근성 검사 결과
 *
 * @example
 * ```typescript
 * import { checkAccessibility } from './helpers/accessibility';
 *
 * test('페이지 접근성 검사', async ({ page }) => {
 *   await page.goto('/');
 *   const result = await checkAccessibility(page);
 *   expect(result.violations).toHaveLength(0);
 * });
 * ```
 */
export async function checkAccessibility(
  page: Page,
  options: AccessibilityCheckOptions = {}
): Promise<AccessibilityResult> {
  const {
    minSeverity = 'moderate',
    includeTags,
    excludeTags,
    disableRules,
    includeSelector,
    excludeSelectors,
  } = options;

  let builder = new AxeBuilder({ page });

  // 규칙 태그 설정
  if (includeTags?.length) {
    builder = builder.withTags(includeTags);
  }

  if (excludeTags?.length) {
    // axe-core는 excludeTags를 직접 지원하지 않으므로 withTags로 포함할 태그만 지정
    // 또는 disableRules로 특정 규칙 비활성화
  }

  // 비활성화할 규칙 설정
  if (disableRules?.length) {
    builder = builder.disableRules(disableRules);
  }

  // 검사 범위 설정
  if (includeSelector) {
    builder = builder.include(includeSelector);
  }

  if (excludeSelectors?.length) {
    for (const selector of excludeSelectors) {
      builder = builder.exclude(selector);
    }
  }

  const results = await builder.analyze();

  // 심각도별 필터링
  const minPriority = SEVERITY_PRIORITY[minSeverity];
  const filteredViolations = results.violations.filter(
    (v) => SEVERITY_PRIORITY[v.impact as Severity] >= minPriority
  );

  return {
    violations: filteredViolations.map((v) => ({
      id: v.id,
      impact: v.impact as Severity,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        html: n.html,
        target: n.target as string[],
        failureSummary: n.failureSummary,
      })),
    })),
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
  };
}

/**
 * 심각도별로 위반 사항을 필터링합니다.
 *
 * @param violations - 위반 사항 배열
 * @param severity - 필터링할 심각도
 * @returns 필터링된 위반 사항 배열
 */
export function filterBySeverity(
  violations: AccessibilityViolation[],
  severity: Severity
): AccessibilityViolation[] {
  return violations.filter((v) => v.impact === severity);
}

/**
 * 심각도별로 위반 사항을 그룹화합니다.
 *
 * @param violations - 위반 사항 배열
 * @returns 심각도별로 그룹화된 위반 사항
 */
export function groupBySeverity(
  violations: AccessibilityViolation[]
): Record<Severity, AccessibilityViolation[]> {
  return {
    critical: filterBySeverity(violations, 'critical'),
    serious: filterBySeverity(violations, 'serious'),
    moderate: filterBySeverity(violations, 'moderate'),
    minor: filterBySeverity(violations, 'minor'),
  };
}

/**
 * 접근성 검사 결과를 보고서 형식으로 생성합니다.
 *
 * @param page - Playwright Page 객체
 * @param result - 접근성 검사 결과
 * @returns 접근성 보고서
 */
export function generateReport(
  page: Page,
  result: AccessibilityResult
): AccessibilityReport {
  const grouped = groupBySeverity(result.violations);

  return {
    url: page.url(),
    timestamp: new Date().toISOString(),
    summary: {
      totalViolations: result.violations.length,
      critical: grouped.critical.length,
      serious: grouped.serious.length,
      moderate: grouped.moderate.length,
      minor: grouped.minor.length,
    },
    violations: result.violations,
  };
}

/**
 * 접근성 보고서를 콘솔에 출력합니다.
 *
 * @param report - 접근성 보고서
 */
export function printReport(report: AccessibilityReport): void {
  console.log('\n========================================');
  console.log('접근성 검사 보고서');
  console.log('========================================');
  console.log(`URL: ${report.url}`);
  console.log(`검사 시간: ${report.timestamp}`);
  console.log('\n--- 요약 ---');
  console.log(`총 위반 사항: ${report.summary.totalViolations}개`);
  console.log(`  - Critical: ${report.summary.critical}개`);
  console.log(`  - Serious: ${report.summary.serious}개`);
  console.log(`  - Moderate: ${report.summary.moderate}개`);
  console.log(`  - Minor: ${report.summary.minor}개`);

  if (report.violations.length > 0) {
    console.log('\n--- 상세 위반 사항 ---');
    report.violations.forEach((v, index) => {
      console.log(`\n[${index + 1}] ${v.id} (${v.impact})`);
      console.log(`    설명: ${v.description}`);
      console.log(`    도움말: ${v.help}`);
      console.log(`    참조: ${v.helpUrl}`);
      console.log(`    영향받는 요소: ${v.nodes.length}개`);
      v.nodes.slice(0, 3).forEach((n, i) => {
        console.log(`      ${i + 1}. ${n.target.join(' > ')}`);
        if (n.failureSummary) {
          console.log(`         문제: ${n.failureSummary.split('\n')[0]}`);
        }
      });
      if (v.nodes.length > 3) {
        console.log(`      ... 외 ${v.nodes.length - 3}개`);
      }
    });
  }
  console.log('\n========================================\n');
}

/**
 * WCAG 2.1 AA 기준으로 페이지 접근성을 검사합니다.
 * 가장 일반적인 접근성 기준입니다.
 *
 * @param page - Playwright Page 객체
 * @param excludeSelectors - 제외할 CSS 선택자 배열
 * @returns 접근성 검사 결과
 *
 * @example
 * ```typescript
 * test('WCAG 2.1 AA 준수 검사', async ({ page }) => {
 *   await page.goto('/');
 *   const result = await checkWcag21AA(page);
 *   expect(result.violations).toHaveLength(0);
 * });
 * ```
 */
export async function checkWcag21AA(
  page: Page,
  excludeSelectors?: string[]
): Promise<AccessibilityResult> {
  return checkAccessibility(page, {
    includeTags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    minSeverity: 'moderate',
    excludeSelectors,
  });
}

/**
 * Critical 및 Serious 수준의 위반 사항만 검사합니다.
 * 빠른 검사나 CI/CD 파이프라인에 적합합니다.
 *
 * @param page - Playwright Page 객체
 * @returns 접근성 검사 결과
 *
 * @example
 * ```typescript
 * test('심각한 접근성 문제 검사', async ({ page }) => {
 *   await page.goto('/');
 *   const result = await checkCriticalIssues(page);
 *   expect(result.violations).toHaveLength(0);
 * });
 * ```
 */
export async function checkCriticalIssues(
  page: Page
): Promise<AccessibilityResult> {
  return checkAccessibility(page, {
    minSeverity: 'serious',
  });
}

/**
 * 특정 컴포넌트의 접근성을 검사합니다.
 *
 * @param page - Playwright Page 객체
 * @param selector - 검사할 요소의 CSS 선택자
 * @param options - 추가 검사 옵션
 * @returns 접근성 검사 결과
 *
 * @example
 * ```typescript
 * test('네비게이션 접근성 검사', async ({ page }) => {
 *   await page.goto('/');
 *   const result = await checkComponentAccessibility(page, 'nav');
 *   expect(result.violations).toHaveLength(0);
 * });
 * ```
 */
export async function checkComponentAccessibility(
  page: Page,
  selector: string,
  options: Omit<AccessibilityCheckOptions, 'includeSelector'> = {}
): Promise<AccessibilityResult> {
  return checkAccessibility(page, {
    ...options,
    includeSelector: selector,
  });
}

/**
 * 접근성 테스트 결과를 단언(assert)합니다.
 * 위반 사항이 있으면 상세 정보와 함께 에러를 발생시킵니다.
 *
 * @param result - 접근성 검사 결과
 * @param customMessage - 사용자 정의 에러 메시지
 * @throws 위반 사항이 있을 경우 에러
 *
 * @example
 * ```typescript
 * test('접근성 준수 확인', async ({ page }) => {
 *   await page.goto('/');
 *   const result = await checkAccessibility(page);
 *   assertNoViolations(result, '홈페이지 접근성 검사 실패');
 * });
 * ```
 */
export function assertNoViolations(
  result: AccessibilityResult,
  customMessage?: string
): void {
  if (result.violations.length === 0) {
    return;
  }

  const grouped = groupBySeverity(result.violations);
  const summary = [
    `Critical: ${grouped.critical.length}`,
    `Serious: ${grouped.serious.length}`,
    `Moderate: ${grouped.moderate.length}`,
    `Minor: ${grouped.minor.length}`,
  ].join(', ');

  const details = result.violations
    .slice(0, 5)
    .map((v) => `  - [${v.impact}] ${v.id}: ${v.help}`)
    .join('\n');

  const moreInfo =
    result.violations.length > 5
      ? `\n  ... 외 ${result.violations.length - 5}개 위반 사항`
      : '';

  const message = customMessage
    ? `${customMessage}\n\n`
    : '접근성 위반 사항이 발견되었습니다.\n\n';

  throw new Error(
    `${message}요약: ${summary}\n\n상세:\n${details}${moreInfo}`
  );
}
