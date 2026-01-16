import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FontPicker } from '../src/components/editor/FontPicker';
import { getAvailableFonts } from '@remotion/google-fonts';

// Mock @remotion/google-fonts
jest.mock('@remotion/google-fonts', () => ({
  getAvailableFonts: jest.fn(),
  loadFont: jest.fn(),
}));

const mockFonts = [
  { fontFamily: 'Roboto' },
  { fontFamily: 'Open Sans' },
  { fontFamily: 'Inter' },
];

describe('FontPicker', () => {
  beforeEach(() => {
    (getAvailableFonts as jest.Mock).mockReturnValue(mockFonts);
  });

  it('renders available fonts', () => {
    render(<FontPicker onSelect={jest.fn()} selectedFont="Roboto" />);
    
    expect(screen.getByText('Roboto')).toBeInTheDocument();
    expect(screen.getByText('Open Sans')).toBeInTheDocument();
    expect(screen.getByText('Inter')).toBeInTheDocument();
  });

  it('calls onSelect when a font is clicked', () => {
    const onSelect = jest.fn();
    render(<FontPicker onSelect={onSelect} selectedFont="Roboto" />);
    
    const fontOption = screen.getByText('Open Sans');
    fireEvent.click(fontOption);
    
    expect(onSelect).toHaveBeenCalledWith('Open Sans');
  });

  it('highlights the selected font', () => {
    render(<FontPicker onSelect={jest.fn()} selectedFont="Roboto" />);
    
    const selectedOption = screen.getByText('Roboto');
    expect(selectedOption.closest('button')).toHaveAttribute('data-selected', 'true');
  });

  it('filters fonts when searching', () => {
    render(<FontPicker onSelect={jest.fn()} selectedFont="Roboto" />);
    
    const searchInput = screen.getByPlaceholderText('Search fonts...');
    fireEvent.change(searchInput, { target: { value: 'Inte' } });
    
    expect(screen.getByText('Inter')).toBeInTheDocument();
    expect(screen.queryByText('Open Sans')).not.toBeInTheDocument();
  });
});
