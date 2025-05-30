import { render, screen, waitFor } from '@testing-library/react';
import { describe, it } from 'vitest';
import PageLayout from '@/components/page-layout/PageLayout.component';

describe('PageLayout component', () => {
  it('should display the page layout', async () => {
    render(<PageLayout />);
    await waitFor(() => {
      expect(screen.getByTestId('pageLayout')).toBeTruthy();
    });
  });
});
