import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
export type AlertTone = 'neutral' | 'success' | 'error';
export function Alert({ tone = 'neutral', title, children }: { tone?: AlertTone; title?: string; children?: ReactNode }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} aria-atomic="true"
    className={cx('rounded-lg border bg-white px-4 py-3 text-sm text-gray-700', tone === 'error' ? 'border-gray-900' : 'border-gray-200')}>
    {title && <p className="font-semibold text-gray-900">{title}</p>}
    {children && <div className={cx(title && 'mt-1')}>{children}</div>}
  </div>;
}
