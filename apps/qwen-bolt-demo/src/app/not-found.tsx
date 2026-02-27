'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      <div className="text-center space-y-6">
        <h2 className="text-8xl font-bold text-blue-500">{t('error.notFoundCode')}</h2>
        <p className="text-2xl font-semibold">{t('error.notFoundTitle')}</p>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {t('error.notFoundDescription')}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          ← {t('error.backToHome')}
        </Link>
      </div>
    </div>
  );
}
