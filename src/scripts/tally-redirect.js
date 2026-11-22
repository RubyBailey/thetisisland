// Only a successful submission from the expected embedded form can redirect.
export function redirectAfterTallySubmission(event) {
  if (event.origin !== "https://tally.so") return;
  let message;
  try {
    message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  } catch {
    return;
  }
  if (message?.event !== "Tally.FormSubmitted") return;
  for (const frame of document.querySelectorAll("iframe[data-tally-form-id]")) {
    if (event.source !== frame.contentWindow ||
        message.payload?.formId !== frame.dataset.tallyFormId) continue;
    const target = frame.dataset.thankYouUrl;
    if (target === "/thank-you/contact/" || target === "/thank-you/membership/") {
      window.location.assign(target);
    }
    return;
  }
}
