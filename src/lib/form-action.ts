type FormActionResult = (formData: FormData) => Promise<void>

/**
 * Adapts a server action that returns error/success objects so it can be
 * passed to <form action>. The original action still runs unchanged.
 */
export function asFormAction(
  action: (formData: FormData) => Promise<unknown> | unknown,
): FormActionResult {
  return async (formData: FormData) => {
    await action(formData)
  }
}
