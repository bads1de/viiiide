import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FontPicker } from '@/components/editor/FontPicker';
import * as GoogleFontsUtils from '@/utils/googleFonts';

// Mock the utils
jest.mock('@/utils/googleFonts', () => ({
  loadGoogleFont: jest.fn(),
  POPULAR_FONTS: ['Roboto', 'Open Sans', 'Inter'],
}));

describe('FontPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders available fonts', () => {
    render(<FontPicker onSelect={jest.fn()} selectedFont="Roboto" />);
    
    expect(screen.getByText('Roboto')).toBeInTheDocument();
    expect(screen.getByText('Open Sans')).toBeInTheDocument();
    expect(screen.getByText('Inter')).toBeInTheDocument();
    expect(screen.getByText('3 fonts')).toBeInTheDocument();
  });

  it('calls onSelect when a font is clicked', () => {
    const onSelect = jest.fn();
    render(<FontPicker onSelect={onSelect} selectedFont="Roboto" />);
    
    const fontOption = screen.getByText('Open Sans');
    fireEvent.click(fontOption);
    
    expect(onSelect).toHaveBeenCalledWith('Open Sans');
    expect(GoogleFontsUtils.loadGoogleFont).toHaveBeenCalledWith('Open Sans');
  });

  it('highlights the selected font', () => {
    render(<FontPicker onSelect={jest.fn()} selectedFont="Roboto" />);
    
    const selectedOption = screen.getByText('Roboto').closest('button');
    expect(selectedOption).toHaveClass('bg-blue-600/20');
  });

  it('filters fonts when searching', () => {
    render(<FontPicker onSelect={jest.fn()} selectedFont="Roboto" />);
    
    const searchInput = screen.getByPlaceholderText('Search fonts...');
    fireEvent.change(searchInput, { target: { value: 'Inte' } });
    
    expect(screen.getByText('Inter')).toBeInTheDocument();
    expect(screen.queryByText('Open Sans')).not.toBeInTheDocument();
  });
});