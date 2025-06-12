import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders unit converter', () => {
  render(<App />);
  const converterElement = screen.getByText(/Unit Converter/i);
  expect(converterElement).toBeInTheDocument();
});
