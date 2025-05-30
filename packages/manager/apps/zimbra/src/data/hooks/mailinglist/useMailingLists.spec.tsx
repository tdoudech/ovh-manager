import { describe, expect } from 'vitest';
import '@testing-library/jest-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { mailingListsMock } from '@/data/api';
import { useMailingLists } from '@/data/hooks';
import { wrapper } from '@/utils/test.provider';

describe('useMailingLists', () => {
  it('should return mailing lists', async () => {
    const { result } = renderHook(() => useMailingLists(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mailingListsMock);
  });
});
