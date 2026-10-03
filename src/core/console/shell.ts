/**
 * Demo sign-in gate for the console. The markup lives in the page: a `[data-login]` form
 * (#console-email, #console-password, `[data-login-error]`) and a hidden `[data-app]`.
 * This is a demo gate only: the credentials are public and nothing here protects real data.
 */
import { getSessionStorage } from '../storage';

export interface ShellOptions {
  credentials: { email: string; password: string };
  sessionKey: string;
  onSignedIn: () => void;
}

export const WRONG_LOGIN = 'That email or password is not right. Use the demo sign-in shown on this page.';

export function initShell(root: HTMLElement, opts: ShellOptions): void {
  const storage = getSessionStorage();
  const form = root.querySelector<HTMLFormElement>('[data-login]')!;
  const app = root.querySelector<HTMLElement>('[data-app]')!;
  const error = root.querySelector<HTMLElement>('[data-login-error]')!;
  const email = form.querySelector<HTMLInputElement>('input[name=email]')!;
  const password = form.querySelector<HTMLInputElement>('input[name=password]')!;

  const show = (signedIn: boolean) => {
    form.hidden = signedIn;
    app.hidden = !signedIn;
  };
  const enter = () => {
    show(true);
    opts.onSignedIn();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (email.value.trim().toLowerCase() === opts.credentials.email && password.value === opts.credentials.password) {
      error.textContent = '';
      try { storage.setItem(opts.sessionKey, '1'); } catch { /* memory fallback keeps this page signed in */ }
      enter();
      return;
    }
    error.textContent = WRONG_LOGIN;
    email.setAttribute('aria-invalid', 'true');
    password.setAttribute('aria-invalid', 'true');
    password.focus();
  });

  root.querySelector('[data-signout]')?.addEventListener('click', () => {
    storage.removeItem(opts.sessionKey);
    password.value = '';
    show(false);
    email.focus();
  });

  if (storage.getItem(opts.sessionKey) === '1') enter();
  else show(false);
}
