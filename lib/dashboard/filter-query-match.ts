import {
  isMultiValueOperator,
  operatorTakesValue,
  type FilterQuery,
  type FilterRule
} from "@/lib/dashboard/filter-query";

export function readRowField<T extends object>(row: T, path: string): unknown {
  return (row as Record<string, unknown>)[path];
}

export function filterTableRows<T extends object>(
  rows: T[],
  query: FilterQuery,
  search: string,
  readField: (row: T, path: string) => unknown = readRowField,
  searchText?: (row: T) => string
): T[] {
  const term = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (!matchesFilterQuery(row, query, readField)) return false;
    if (!term) return true;
    return (searchText?.(row) ?? "").toLowerCase().includes(term);
  });
}

export function tableEmptyMessage(
  sourceCount: number,
  visibleCount: number,
  emptyLabel: string
) {
  if (visibleCount === 0 && sourceCount > 0) return "No results match these filters.";
  return emptyLabel;
}

export function matchesFilterQuery<T>(
  row: T,
  query: FilterQuery,
  readField: (row: T, path: string) => unknown
): boolean {
  if (query.rules.length === 0) return true;
  return query.rules.every((rule) => {
    if (isIncomplete(rule)) return true;
    return matchesRule(row, rule, readField);
  });
}

function isIncomplete(rule: FilterRule): boolean {
  if (!operatorTakesValue(rule.operator)) return false;
  return (
    rule.value === undefined ||
    (Array.isArray(rule.value) && rule.value.length === 0) ||
    rule.value === ""
  );
}

function matchesRule<T>(
  row: T,
  rule: FilterRule,
  readField: (row: T, path: string) => unknown
): boolean {
  const actual = readField(row, rule.path[0] ?? "");
  const value = rule.value;

  switch (rule.operator) {
    case "contains":
      return String(actual).toLowerCase().includes(String(value).toLowerCase());
    case "not_contains":
      return !String(actual).toLowerCase().includes(String(value).toLowerCase());
    case "is":
      return String(actual) === String(value);
    case "is_not":
      return String(actual) !== String(value);
    case "is_any_of":
      return (value as string[] | undefined)?.includes(String(actual)) ?? true;
    case "is_none_of":
      return !((value as string[] | undefined)?.includes(String(actual)) ?? false);
    case "empty":
      return actual === undefined || actual === null || actual === "";
    case "not_empty":
      return !(actual === undefined || actual === null || actual === "");
    default:
      return true;
  }
}

export function normalizeRuleValue(
  operator: FilterRule["operator"],
  value: unknown
): unknown {
  if (!operatorTakesValue(operator)) return undefined;
  if (isMultiValueOperator(operator)) {
    if (Array.isArray(value)) return value.map(String);
    if (value == null || value === "") return [];
    return [String(value)];
  }
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
