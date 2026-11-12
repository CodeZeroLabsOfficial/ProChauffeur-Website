import type { ReactNode } from "react";

export type FilterOperatorId =
  | "is"
  | "is_not"
  | "is_any_of"
  | "is_none_of"
  | "contains"
  | "not_contains"
  | "empty"
  | "not_empty";

export type FilterOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export type FilterField = {
  id: string;
  label: string;
  type: "select" | "text";
  defaultOperator?: FilterOperatorId;
  options?: FilterOption[];
  searchable?: boolean;
  icon?: ReactNode;
  placeholder?: string;
};

export type FilterRule = {
  id: string;
  path: string[];
  operator: FilterOperatorId;
  value?: unknown;
};

export type FilterQuery = {
  id: string;
  combinator: "and";
  rules: FilterRule[];
};

let filterIdSeq = 0;

export function nextFilterId(prefix = "f"): string {
  filterIdSeq += 1;
  return `${prefix}_${filterIdSeq}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createFilterQuery(): FilterQuery {
  return { id: nextFilterId("q"), combinator: "and", rules: [] };
}

export function createFilterRule(
  path: string[],
  operator: FilterOperatorId,
  value?: unknown
): FilterRule {
  return { id: nextFilterId("r"), path, operator, value };
}

export function clearFilterQuery(): FilterQuery {
  return createFilterQuery();
}

export function upsertFilterRule(query: FilterQuery, rule: FilterRule): FilterQuery {
  const index = query.rules.findIndex((entry) => entry.id === rule.id);
  if (index < 0) {
    return { ...query, rules: [...query.rules, rule] };
  }
  const rules = query.rules.slice();
  rules[index] = rule;
  return { ...query, rules };
}

export function removeFilterRule(query: FilterQuery, ruleId: string): FilterQuery {
  return { ...query, rules: query.rules.filter((rule) => rule.id !== ruleId) };
}

export function countFilterRules(query: FilterQuery): number {
  return query.rules.length;
}

export const SELECT_OPERATORS: { value: FilterOperatorId; label: string }[] = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "is_any_of", label: "is any of" },
  { value: "is_none_of", label: "is none of" },
  { value: "empty", label: "is empty" },
  { value: "not_empty", label: "is not empty" }
];

export const TEXT_OPERATORS: { value: FilterOperatorId; label: string }[] = [
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "empty", label: "is empty" },
  { value: "not_empty", label: "is not empty" }
];

export function operatorsForField(field: FilterField) {
  return field.type === "text" ? TEXT_OPERATORS : SELECT_OPERATORS;
}

export function operatorLabel(operator: FilterOperatorId): string {
  return (
    SELECT_OPERATORS.find((entry) => entry.value === operator)?.label ??
    TEXT_OPERATORS.find((entry) => entry.value === operator)?.label ??
    operator
  );
}

export function operatorTakesValue(operator: FilterOperatorId): boolean {
  return operator !== "empty" && operator !== "not_empty";
}

export function isMultiValueOperator(operator: FilterOperatorId): boolean {
  return operator === "is_any_of" || operator === "is_none_of";
}

export function defaultOperatorForField(field: FilterField): FilterOperatorId {
  if (field.defaultOperator) return field.defaultOperator;
  return field.type === "text" ? "contains" : "is_any_of";
}

export function fieldById(fields: FilterField[], id: string): FilterField | undefined {
  return fields.find((field) => field.id === id);
}
