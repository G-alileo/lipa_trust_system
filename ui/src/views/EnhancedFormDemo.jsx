import React, { useState } from "react";
import { FormField, validators, useFormValidation } from "../components/FormValidation";
import { Button, Card } from "../components/base";

export function EnhancedFormDemo() {
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Form validation rules
  const validationRules = {
    email: [
      validators.required("Email is required"),
      validators.email("Please enter a valid email address")
    ],
    phone: [
      validators.required("Phone number is required"),
      validators.phoneNumber("Please enter a valid Kenyan phone number (+254)")
    ],
    campaignTitle: [
      validators.required("Campaign title is required"),
      validators.minLength(10, "Title must be at least 10 characters"),
      validators.maxLength(100, "Title must be no more than 100 characters")
    ],
    targetAmount: [
      validators.required("Target amount is required"),
      validators.number("Please enter a valid number"),
      validators.min(1000, "Minimum target amount is KES 1,000"),
      validators.max(10000000, "Maximum target amount is KES 10,000,000")
    ],
    description: [
      validators.required("Description is required"),
      validators.minLength(50, "Description must be at least 50 characters"),
      validators.maxLength(1000, "Description must be no more than 1000 characters")
    ]
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    reset,
    isValid
  } = useFormValidation(
    {
      email: "",
      phone: "",
      campaignTitle: "",
      targetAmount: "",
      description: ""
    },
    validationRules
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    const isFormValid = await validateForm();

    if (isFormValid) {
      setTimeout(() => {
        setSubmitResult({
          success: true,
          message: " Campaign created successfully! Your campaign is now pending review."
        });
        setSubmitting(false);
        reset();
      }, 2000);
    } else {
      setSubmitResult({
        success: false,
        message: "Please fix the errors above before submitting."
      });
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setSubmitResult(null);
  };

  return (
    <div className="enhanced-form-demo max-w-2xl mx-auto p-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-ink-900 mb-4">
           Enhanced Form Validation Demo
        </h1>
        <p className="text-muted">
          Experience real-time validation, smart error messages, and improved UX patterns.
        </p>
      </header>

      <Card className="glass p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Field */}
            <FormField
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              validation={validationRules.email}
              validateOnChange={true}
              debounceMs={300}
            />

            {/* Phone Field */}
            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="+254 712 345 678"
              value={values.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              validation={validationRules.phone}
              validateOnChange={true}
              debounceMs={300}
            />
          </div>

          {/* Campaign Title */}
          <FormField
            label="Campaign Title"
            name="campaignTitle"
            type="text"
            placeholder="Help us build a better future..."
            value={values.campaignTitle}
            onChange={(e) => handleChange('campaignTitle', e.target.value)}
            onBlur={() => handleBlur('campaignTitle')}
            validation={validationRules.campaignTitle}
            validateOnChange={true}
            debounceMs={500}
          />

          {/* Target Amount */}
          <FormField
            label="Target Amount (KES)"
            name="targetAmount"
            type="number"
            placeholder="100000"
            value={values.targetAmount}
            onChange={(e) => handleChange('targetAmount', e.target.value)}
            onBlur={() => handleBlur('targetAmount')}
            validation={validationRules.targetAmount}
            validateOnChange={true}
            debounceMs={300}
          />

          {/* Description */}
          <div className="form-field">
            <label className="label block mb-2">
              Campaign Description
              <span className="text-xs text-muted ml-2">
                ({values.description.length}/1000 characters)
              </span>
            </label>
            <textarea
              name="description"
              placeholder="Share your story and explain why this campaign matters..."
              value={values.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              rows={4}
              className={`input w-full resize-none ${touched.description && errors.description ? 'error' : ''
                } ${touched.description && !errors.description && values.description ? 'success' : ''
                }`}
            />
            {touched.description && errors.description && (
              <span className="error-text text-xs mt-1 block">{errors.description}</span>
            )}
            {touched.description && !errors.description && values.description && (
              <span className="text-xs text-success mt-1 block">Success Looks great!</span>
            )}
          </div>

          {/* Form Status */}
          {submitResult && (
            <div className={`p-4 rounded-lg border ${submitResult.success
                ? 'bg-success-50 border-success-200 text-success-800'
                : 'bg-error-50 border-error-200 text-error-800'
              }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {submitResult.success ? 'Yes' : 'No'}
                </span>
                <span className="font-medium">{submitResult.message}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Creating Campaign...' : 'Create Campaign'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset Form
            </Button>
          </div>

          {/* Form Validation Status */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isValid && Object.keys(touched).length > 0
                ? 'bg-success-100 text-success-700'
                : 'bg-warning-100 text-warning-700'
              }`}>
              <span>
                {isValid && Object.keys(touched).length > 0 ? 'Yes' : 'Wait'}
              </span>
              <span>
                {isValid && Object.keys(touched).length > 0
                  ? 'Form is valid and ready to submit!'
                  : 'Fill out the form to continue'}
              </span>
            </div>
          </div>
        </form>
      </Card>

      {/* Feature Highlights */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-ink-900"> Enhanced Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-ink-50 rounded-lg">
            <h4 className="font-semibold mb-2"> Real-time Validation</h4>
            <p className="text-muted">
              Fields validate as you type with smart debouncing to avoid flickering errors.
            </p>
          </div>

          <div className="p-4 bg-ink-50 rounded-lg">
            <h4 className="font-semibold mb-2"> Smart Error States</h4>
            <p className="text-muted">
              Errors only show after interaction, with immediate clearing when fixed.
            </p>
          </div>

          <div className="p-4 bg-ink-50 rounded-lg">
            <h4 className="font-semibold mb-2">Success Feedback</h4>
            <p className="text-muted">
              Visual confirmation when fields are correctly filled out.
            </p>
          </div>

          <div className="p-4 bg-ink-50 rounded-lg">
            <h4 className="font-semibold mb-2">Loading States</h4>
            <p className="text-muted">
              Clear feedback during validation and form submission processes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}