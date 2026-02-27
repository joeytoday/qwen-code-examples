'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      <div className="text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-semibold">{t('error.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {t('error.description')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {t('error.tryAgain')}
          </button>
          <a
            href="/"
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {t('error.backToHome')}
          </a>
        </div>
      </div>
    </div>
  );
}
