import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '@/components/SearchBar';
import '@testing-library/jest-dom';

describe('SearchBar Component', () => {
  const mockProps = {
    searchTerm: '',
    onSearchChange: jest.fn(),
    showOnlyNew: false,
    onShowOnlyNewChange: jest.fn(),
    showOnlyWithLyrics: false,
    onShowOnlyWithLyricsChange: jest.fn(),
    isDarkMode: false,
  };

  it('renders search input', () => {
    render(<SearchBar {...mockProps} />);
    
    expect(screen.getByPlaceholderText('곡 검색...')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    render(<SearchBar {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('곡 검색...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('test');
  });

  it('toggles showOnlyNew when button is clicked', () => {
    render(<SearchBar {...mockProps} />);
    
    const newSongsButton = screen.getByText('신곡만 보기');
    fireEvent.click(newSongsButton);
    
    expect(mockProps.onShowOnlyNewChange).toHaveBeenCalledWith(true);
  });

  it('toggles showOnlyWithLyrics when button is clicked', () => {
    render(<SearchBar {...mockProps} />);
    
    const lyricsButton = screen.getByText('가사 있는 곡만');
    fireEvent.click(lyricsButton);
    
    expect(mockProps.onShowOnlyWithLyricsChange).toHaveBeenCalledWith(true);
  });
});
