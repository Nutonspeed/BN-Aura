import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect root URL to Thai locale as default
  redirect('/th')
}
