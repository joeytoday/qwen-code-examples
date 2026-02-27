'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Code2, Eye, Terminal, Download, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ONBOARDING_KEY = 'qwen-onboarding-dismissed';

interface GuideStep {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

export function OnboardingGuide() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem(ONBOARDING_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const steps: GuideStep[] = [
    {
      icon: <MessageSquare className="w-6 h-6 text-blue-500" />,
      titleKey: 'onboarding.step1Title',
      descKey: 'onboarding.step1Desc',
    },
    {
      icon: <Code2 className="w-6 h-6 text-emerald-500" />,
      titleKey: 'onboarding.step2Title',
      descKey: 'onboarding.step2Desc',
    },
    {
      icon: <Eye className="w-6 h-6 text-purple-500" />,
      titleKey: 'onboarding.step3Title',
      descKey: 'onboarding.step3Desc',
    },
    {
      icon: <Terminal className="w-6 h-6 text-amber-500" />,
      titleKey: 'onboarding.step4Title',
      descKey: 'onboarding.step4Desc',
    },
    {
      icon: <Keyboard className="w-6 h-6 text-cyan-500" />,
      titleKey: 'onboarding.step5Title',
      descKey: 'onboarding.step5Desc',
    },
  ];

  if (!isVisible) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('onboarding.title')}
          </h3>
          <button
            onClick={dismiss}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 py-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep
                  ? 'bg-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {step.icon}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {t(step.titleKey)}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t(step.descKey)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={dismiss}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {t('onboarding.skip')}
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('onboarding.back')}
              </button>
            )}
            <button
              onClick={() => {
                if (isLastStep) {
                  dismiss();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              {isLastStep ? t('onboarding.getStarted') : t('onboarding.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
