import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to the login page as the primary entry point.
  // The login page will then redirect to the dashboard if the user is already authenticated.
  redirect('/login');
}
