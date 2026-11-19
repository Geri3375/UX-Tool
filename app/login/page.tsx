import { BookOpenText, Mail } from "lucide-react";

import { requestSignIn } from "@/app/login/actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const messages: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  missing_code: "The sign-in link is incomplete. Request a new one.",
  invalid_link: "That sign-in link is invalid or expired.",
  email_rate_limited: "Too many sign-in emails were requested. Wait up to one hour, then request one new link.",
  sign_in_failed: "Sign-in could not be started. Confirm that this user already exists.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-heading">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>Clarity</span>
        </div>
        <BookOpenText className="login-icon" aria-hidden="true" size={24} strokeWidth={1.6} />
        <h1 id="login-heading">Access your private UX library</h1>
        <p>Sign in with an approved email address. New accounts cannot be created from this form.</p>

        {params.status === "check_email" ? (
          <div className="login-message success" role="status">
            Check your inbox for a secure sign-in link.
          </div>
        ) : null}
        {params.error ? (
          <div className="login-message error" role="alert">
            {messages[params.error] ?? "Sign-in failed. Try again."}
          </div>
        ) : null}

        <form action={requestSignIn} className="login-form">
          <label htmlFor="email">Email address</label>
          <div className="email-field">
            <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <button type="submit">Send secure sign-in link</button>
        </form>
      </section>
    </main>
  );
}
