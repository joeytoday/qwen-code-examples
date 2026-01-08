import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Qwen Chat',
  description: 'Chat interface for Qwen Code SDK',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}