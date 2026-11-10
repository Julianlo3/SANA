"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Defines the form errors type.
 */
type FormErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Defines the form options type.
 */
type UseFormOptions<T> = {
  initialValues: T;
  validate: (values: T) => FormErrors<T>;
};

/**
 * Reusable form state and validation hook.
 *
 * - Validates on every change but displays field errors only after interaction
 *   or submission.
 * - Exposes fields changed from their initial values to avoid unnecessary
 *   backend updates.
 * @param params Destructured operation parameters.
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const errors = useMemo(() => validate(values), [values, validate]);

  const visibleErrors = useMemo(() => {
    const result: FormErrors<T> = {};

    for (const key of Object.keys(errors) as (keyof T)[]) {
      if (wasSubmitted || touched[key]) {
        result[key] = errors[key];
      }
    }

    return result;
  }, [errors, touched, wasSubmitted]);

  const changedFields = useMemo(() => {
    return (Object.keys(initialValues) as (keyof T)[]).filter(
      (key) =>
        JSON.stringify(values[key]) !== JSON.stringify(initialValues[key]),
    );
  }, [values, initialValues]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const reset = useCallback((nextValues: T) => {
    setValues(nextValues);
    setTouched({});
    setWasSubmitted(false);
  }, []);

  const isValid = Object.keys(errors).length === 0;
  const isDirty = changedFields.length > 0;

  /** Returns form values only when validation succeeds. */
  const submit = useCallback((): T | null => {
    setWasSubmitted(true);
    return Object.keys(validate(values)).length === 0 ? values : null;
  }, [validate, values]);

  return {
    values,
    errors: visibleErrors,
    changedFields,
    isValid,
    isDirty,
    wasSubmitted,
    setValue,
    setFieldTouched,
    submit,
    reset,
  };
}