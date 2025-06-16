import { render, screen, fireEvent } from '@testing-library/react';
import { Button, IconButton } from './Button';

describe('Button Component', () => {
  it('renders button with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByText('Click me');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('text');
  });

  it('renders button with primary variant', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByText('Primary Button');
    expect(button).toHaveClass('primary');
  });

  it('renders button with secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByText('Secondary Button');
    expect(button).toHaveClass('secondary');
  });

  it('renders button with outline variant', () => {
    render(<Button variant="outline">Outline Button</Button>);
    const button = screen.getByText('Outline Button');
    expect(button).toHaveClass('outline');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled button', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });

  it('renders button with full width', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    const button = screen.getByText('Full Width Button');
    expect(button).toHaveStyle({ width: '100%' });
  });

  it('renders button with different sizes', () => {
    const { rerender } = render(<Button size="small">Small Button</Button>);
    expect(screen.getByText('Small Button')).toHaveStyle({ padding: '6px 12px' });

    rerender(<Button size="medium">Medium Button</Button>);
    expect(screen.getByText('Medium Button')).toHaveStyle({ padding: '8px 16px' });

    rerender(<Button size="large">Large Button</Button>);
    expect(screen.getByText('Large Button')).toHaveStyle({ padding: '12px 24px' });
  });
});

describe('IconButton Component', () => {
  it('renders icon button', () => {
    render(<IconButton>🔍</IconButton>);
    const button = screen.getByText('🔍');
    expect(button).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<IconButton onClick={handleClick}>🔍</IconButton>);
    fireEvent.click(screen.getByText('🔍'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled icon button', () => {
    render(<IconButton disabled>🔍</IconButton>);
    const button = screen.getByText('🔍');
    expect(button).toBeDisabled();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    render(<IconButton style={customStyle}>🔍</IconButton>);
    const button = screen.getByText('🔍');
    expect(button).toHaveStyle(customStyle);
  });
}); 