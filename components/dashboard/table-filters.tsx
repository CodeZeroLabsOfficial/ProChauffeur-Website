"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CheckIcon, ListFilterIcon, XIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  clearFilterQuery,
  countFilterRules,
  createFilterRule,
  defaultOperatorForField,
  fieldById,
  isMultiValueOperator,
  operatorLabel,
  operatorTakesValue,
  operatorsForField,
  removeFilterRule,
  upsertFilterRule,
  type FilterField,
  type FilterOperatorId,
  type FilterQuery,
  type FilterRule
} from "@/lib/dashboard/filter-query";
import { normalizeRuleValue } from "@/lib/dashboard/filter-query-match";
import { cn } from "@/lib/utils";

type DraftStep = "field" | "operator" | "value";

type Draft = {
  step: DraftStep;
  fieldId?: string;
  operator?: FilterOperatorId;
  value?: unknown;
};

function valueDisplay(field: FilterField | undefined, rule: FilterRule): string {
  if (!operatorTakesValue(rule.operator)) return "";
  if (!field) return String(rule.value ?? "");
  const options = field.options ?? [];
  if (Array.isArray(rule.value)) {
    const values = rule.value.map(String);
    if (values.length === 0) return "Select value";
    if (values.length === 1) {
      return options.find((option) => option.value === values[0])?.label ?? values[0];
    }
    return `${values.length} selected`;
  }
  if (rule.value == null || rule.value === "") return field.placeholder ?? "Enter value";
  const raw = String(rule.value);
  return options.find((option) => option.value === raw)?.label ?? raw;
}

function MenuList({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex max-h-64 min-w-44 flex-col gap-0.5 overflow-y-auto p-1", className)}>
      {children}
    </div>
  );
}

function MenuItem({
  selected,
  onSelect,
  children,
  icon
}: {
  selected?: boolean;
  onSelect: () => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        selected && "bg-muted"
      )}
      onClick={onSelect}>
      {icon ? <span className="[&_svg]:size-3.5">{icon}</span> : null}
      <span className="flex-1 truncate">{children}</span>
      {selected ? <CheckIcon className="text-muted-foreground size-3.5" /> : null}
    </button>
  );
}

function FieldPicker({
  fields,
  onSelect
}: {
  fields: FilterField[];
  onSelect: (fieldId: string) => void;
}) {
  return (
    <MenuList>
      {fields.map((field) => (
        <MenuItem key={field.id} icon={field.icon} onSelect={() => onSelect(field.id)}>
          {field.label}
        </MenuItem>
      ))}
    </MenuList>
  );
}

function OperatorPicker({
  field,
  value,
  onSelect
}: {
  field: FilterField;
  value?: FilterOperatorId;
  onSelect: (operator: FilterOperatorId) => void;
}) {
  return (
    <MenuList>
      {operatorsForField(field).map((operator) => (
        <MenuItem
          key={operator.value}
          selected={value === operator.value}
          onSelect={() => onSelect(operator.value)}>
          {operator.label}
        </MenuItem>
      ))}
    </MenuList>
  );
}

function ValuePicker({
  field,
  operator,
  value,
  onChange,
  onCommit
}: {
  field: FilterField;
  operator: FilterOperatorId;
  value: unknown;
  onChange: (value: unknown) => void;
  onCommit: (value: unknown) => void;
}) {
  const multi = isMultiValueOperator(operator);
  const selected = useMemo(() => {
    if (multi) {
      return new Set(Array.isArray(value) ? value.map(String) : []);
    }
    return new Set(value == null || value === "" ? [] : [String(value)]);
  }, [multi, value]);

  if (field.type === "text") {
    const text = typeof value === "string" ? value : "";
    return (
      <div className="flex min-w-56 flex-col gap-2 p-2">
        <Input
          autoFocus
          placeholder={field.placeholder ?? "Enter value"}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onCommit(text);
          }}
        />
        <Button type="button" size="sm" onClick={() => onCommit(text)}>
          Apply
        </Button>
      </div>
    );
  }

  const options = field.options ?? [];

  return (
    <div className="flex flex-col">
      <MenuList className="min-w-48">
        {options.map((option) => {
          const isSelected = selected.has(option.value);
          return (
            <MenuItem
              key={option.value}
              icon={option.icon}
              selected={isSelected}
              onSelect={() => {
                if (multi) {
                  const next = new Set(selected);
                  if (isSelected) next.delete(option.value);
                  else next.add(option.value);
                  onChange(Array.from(next));
                  return;
                }
                onChange(option.value);
                onCommit(option.value);
              }}>
              {option.label}
            </MenuItem>
          );
        })}
      </MenuList>
      {multi ? (
        <div className="border-t p-2">
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={selected.size === 0}
            onClick={() => onCommit(Array.from(selected))}>
            Apply
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  rule,
  fields,
  onChange,
  onRemove
}: {
  rule: FilterRule;
  fields: FilterField[];
  onChange: (rule: FilterRule) => void;
  onRemove: () => void;
}) {
  const field = fieldById(fields, rule.path[0] ?? "");
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  const needsValue = operatorTakesValue(rule.operator);

  return (
    <ButtonGroup className="h-7">
      <ButtonGroupText className="h-7 gap-1.5 rounded-none border px-2 text-xs font-medium first:rounded-l-lg">
        {field?.icon}
        {field?.label ?? rule.path[0]}
      </ButtonGroupText>

      <Popover open={operatorOpen} onOpenChange={setOperatorOpen}>
        <PopoverTrigger
          type="button"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-7 rounded-none border-l-0 px-2 text-xs font-normal"
          )}>
          {operatorLabel(rule.operator)}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          {field ? (
            <OperatorPicker
              field={field}
              value={rule.operator}
              onSelect={(operator) => {
                onChange({
                  ...rule,
                  operator,
                  value: normalizeRuleValue(operator, rule.value)
                });
                setOperatorOpen(false);
                if (operatorTakesValue(operator)) setValueOpen(true);
              }}
            />
          ) : null}
        </PopoverContent>
      </Popover>

      {needsValue ? (
        <Popover open={valueOpen} onOpenChange={setValueOpen}>
          <PopoverTrigger
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-muted-foreground h-7 max-w-40 truncate rounded-none border-l-0 px-2 text-xs font-normal"
            )}>
            {valueDisplay(field, rule)}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            {field ? (
              <ValuePicker
                field={field}
                operator={rule.operator}
                value={rule.value}
                onChange={(value) =>
                  onChange({ ...rule, value: normalizeRuleValue(rule.operator, value) })
                }
                onCommit={(value) => {
                  onChange({ ...rule, value: normalizeRuleValue(rule.operator, value) });
                  if (field.type !== "text" && !isMultiValueOperator(rule.operator)) {
                    setValueOpen(false);
                  }
                }}
              />
            ) : null}
          </PopoverContent>
        </Popover>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="h-7 w-7 rounded-none rounded-r-lg border-l-0"
        onClick={onRemove}
        aria-label="Remove filter">
        <XIcon />
      </Button>
    </ButtonGroup>
  );
}

export function TableFilters({
  fields,
  query,
  onQueryChange,
  showClear = true,
  className
}: {
  fields: FilterField[];
  query: FilterQuery;
  onQueryChange: (query: FilterQuery) => void;
  showClear?: boolean;
  className?: string;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const ruleCount = countFilterRules(query);
  const draftField = draft?.fieldId ? fieldById(fields, draft.fieldId) : undefined;

  const commitDraft = (next: Draft) => {
    if (!next.fieldId || !next.operator) return;
    if (operatorTakesValue(next.operator)) {
      const incomplete =
        next.value === undefined ||
        next.value === "" ||
        (Array.isArray(next.value) && next.value.length === 0);
      if (incomplete) return;
    }
    const rule = createFilterRule(
      [next.fieldId],
      next.operator,
      normalizeRuleValue(next.operator, next.value)
    );
    onQueryChange(upsertFilterRule(query, rule));
    setDraft(null);
    setAddOpen(false);
  };

  return (
    <div className={cn("flex flex-1 flex-wrap items-center gap-1.5", className)}>
      {query.rules.map((rule) => (
        <FilterChip
          key={rule.id}
          rule={rule}
          fields={fields}
          onChange={(next) => onQueryChange(upsertFilterRule(query, next))}
          onRemove={() => onQueryChange(removeFilterRule(query, rule.id))}
        />
      ))}

      <Popover
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (open) setDraft({ step: "field" });
          else setDraft(null);
        }}>
        <PopoverTrigger
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
          <ListFilterIcon /> Filters
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          {!draft || draft.step === "field" ? (
            <FieldPicker
              fields={fields}
              onSelect={(fieldId) => {
                const field = fieldById(fields, fieldId);
                if (!field) return;
                setDraft({
                  step: "operator",
                  fieldId,
                  operator: defaultOperatorForField(field)
                });
              }}
            />
          ) : null}

          {draft?.step === "operator" && draftField ? (
            <OperatorPicker
              field={draftField}
              value={draft.operator}
              onSelect={(operator) => {
                if (!operatorTakesValue(operator)) {
                  commitDraft({ ...draft, operator, value: undefined });
                  return;
                }
                setDraft({
                  ...draft,
                  operator,
                  value: normalizeRuleValue(operator, draft.value),
                  step: "value"
                });
              }}
            />
          ) : null}

          {draft?.step === "value" && draftField && draft.operator ? (
            <ValuePicker
              field={draftField}
              operator={draft.operator}
              value={draft.value}
              onChange={(value) => setDraft({ ...draft, value })}
              onCommit={(value) => commitDraft({ ...draft, value })}
            />
          ) : null}
        </PopoverContent>
      </Popover>

      {showClear && ruleCount > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onQueryChange(clearFilterQuery())}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}
