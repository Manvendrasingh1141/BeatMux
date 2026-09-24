import { useState, useCallback, useRef } from 'react';

// Generic form hook with validation and double-submission prevention
export const useForm = (initialValues, validators = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const validateField = useCallback((name, value) => {
    const validator = validators[name];
    if (!validator) return null;
    return validator(value, values);
  }, [validators, values]);

  const handleChange = useCallback((name) => (e) => {
    const value = e.target ? e.target.value : e;
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing again
    if (touched[name]) {
      const error = validators[name]?.(value, { ...values, [name]: value });
      setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }
  }, [touched, validators, values]);

  const handleBlur = useCallback((name) => () => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validators[name]?.(values[name], values);
    setErrors(prev => ({ ...prev, [name]: error || undefined }));
  }, [validators, values]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    let hasErrors = false;
    for (const [name, validator] of Object.entries(validators)) {
      const error = validator(values[name], values);
      if (error) {
        newErrors[name] = error;
        hasErrors = true;
      }
    }
    setErrors(newErrors);
    setTouched(Object.keys(validators).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    return !hasErrors;
  }, [validators, values]);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e?.preventDefault();
    if (submittingRef.current) return; // prevent double-submit
    if (!validateAll()) return;
    
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [validateAll, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    submittingRef.current = false;
  }, [initialValues]);

  const isValid = Object.keys(errors).filter(k => errors[k]).length === 0;

  return { values, errors, touched, isSubmitting, isValid, handleChange, handleBlur, handleSubmit, reset, setValues };
};
