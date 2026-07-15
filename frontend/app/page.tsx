import { I18nProvider } from '@/components/I18nProvider';
import { RegistrationWizard } from '@/components/RegistrationWizard';

export default function HomePage() {
  return (
    <main>
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-xl font-bold">Student Registration Portal</h1>
          <p className="text-sm text-muted-foreground">Complete your admission application below.</p>
        </div>
      </header>

      <I18nProvider>
        <RegistrationWizard />
      </I18nProvider>
    </main>
  );
}
