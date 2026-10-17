const TEXT = {
  idle: 'Your answers save automatically.',
  saving: 'Saving…',
  saved: 'Saved',
  error: "Couldn't save. Check your connection — we'll try again when you make a change.",
};

export default function SaveStatus({ status }) {
  return (
    <p className={`save-status ${status}`} role="status" aria-live="polite">{TEXT[status]}</p>
  );
}
