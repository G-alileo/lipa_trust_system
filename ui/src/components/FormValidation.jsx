import React, { useState, useEffect, useCallback } from "react";
import { Input } from "./base";

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function FormField({
  label,
  name,
  value,
  onChange,
  onBlur,
  validation,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  className = "",
  ...inputProps
}) {
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const debouncedValue = useDebounce(value, debounceMs);

  const validateField = useCallback(async (val, shouldShowError = true) => {
    if (!validation) return true;

    setIsValidating(true);

    try {
      let validationResult = true;

      if (typeof validation === 'function') {
        validationResult = await validation(val);
      } else if (Array.isArray(validation)) {
        for (const validator of validation) {
          const result = await validator(val);
          if (result !== true) {
            validationResult = result;
            break;
          }
        }
      }

      if (shouldShowError) {
        setError(validationResult === true ? "" : validationResult);
      }

      return validationResult === true;
    } catch (err) {
      if (shouldShowError) {
        setError("Validation error occurred");
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [validation]);

  useEffect(() => {
    if (validateOnChange && touched) {
      validateField(debouncedValue);
    }
  }, [debouncedValue, validateOnChange, touched, validateField]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(e);

    if (error && newValue !== value) {
      setError("");
    }
  };

  const handleBlur = (e) => {
    setTouched(true);

    if (validateOnBlur) {
      validateField(e.target.value);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  const getFieldState = () => {
    if (isValidating) return "validating";
    if (error && touched) return "error";
    if (touched && !error && validation) return "success";
    return "default";
  };

  const fieldState = getFieldState();

  return (
    <div className={`form-field ${className}`}>
      <Input
        label={
          <div className="flex items-center justify-between">
            <span>{label}</span>
            {isValidating && (
              <span className="text-xs text-muted flex items-center gap-1">
                <div className="validation-spinner"></div>
                Checking...
              </span>
            )}
            {fieldState === "success" && (
              <span className="text-xs text-success">✓</span>
            )}
          </div>
        }
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched ? error : ""}
        className={`form-field-input ${fieldState}`}
        {...inputProps}
      />
    </div>
  );
}

export const validators = {
  required: (message = "This field is required") => (value) => {
    return value && value.toString().trim() ? true : message;
  },

  minLength: (min, message) => (value) => {
    const msg = message || `Must be at least ${min} characters`;
    return !value || value.length >= min ? true : msg;
  },

  maxLength: (max, message) => (value) => {
    const msg = message || `Must be no more than ${max} characters`;
    return !value || value.length <= max ? true : msg;
  },

  email: (message = "Please enter a valid email address") => (value) => {
    if (!value) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? true : message;
  },

  phoneNumber: (message = "Please enter a valid phone number") => (value) => {
    if (!value) return true;
    const phoneRegex = /^(\+?254|0)?[1-9]\d{8}$/;
    return phoneRegex.test(value.replace(/\s/g, '')) ? true : message;
  },

  number: (message = "Please enter a valid number") => (value) => {
    if (!value) return true;
    return !isNaN(Number(value)) ? true : message;
  },

  min: (minVal, message) => (value) => {
    const msg = message || `Must be at least ${minVal}`;
    if (!value) return true;
    return Number(value) >= minVal ? true : msg;
  },

  max: (maxVal, message) => (value) => {
    const msg = message || `Must be no more than ${maxVal}`;
    if (!value) return true;
    return Number(value) <= maxVal ? true : msg;
  },

  unique: (checkFunction, message = "This value is already taken") => async (value) => {
    if (!value) return true;

    try {
      const isUnique = await checkFunction(value);
      return isUnique ? true : message;
    } catch (error) {
      return "Could not verify uniqueness";
    }
  }
};

export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback(async (name, value) => {
    const rules = validationRules[name];
    if (!rules) return true;

    const validators = Array.isArray(rules) ? rules : [rules];

    for (const validator of validators) {
      const result = await validator(value);
      if (result !== true) {
        return result;
      }
    }

    return true;
  }, [validationRules]);

  const validateForm = useCallback(async () => {
    const newErrors = {};

    for (const [name, value] of Object.entries(values)) {
      const error = await validateField(name, value);
      if (error !== true) {
        newErrors[name] = error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField]);

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    reset,
    isValid: Object.keys(errors).length === 0
  };
}