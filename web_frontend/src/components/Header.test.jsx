import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "./Header";
import { test, expect } from "vitest";
import '@testing-library/jest-dom';

test("renders main heading text", () => {
  render(<Header />);
  expect(screen.getByText(/Shop Quality Medicines/i)).toBeInTheDocument();
});

test("renders description text", () => {
  render(<Header />);
  expect(screen.getByText(/Simply browse through our extensive list of quality medicines/i)).toBeInTheDocument();
});

test("renders Shop now button text", () => {
  render(<Header />);
 expect(screen.getByRole('link', { name: /Shop now/i })).toBeInTheDocument();

});
