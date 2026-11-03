import { describe, expect, it } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navbar } from '../src/components/Navbar';

describe('navbar mobile menu', () => {
  it('opens and closes the menu', async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    expect(document.getElementById('mobile-menu')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(document.getElementById('mobile-menu')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(document.getElementById('mobile-menu')).toBeNull();
  });
});
