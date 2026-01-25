import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "./Header";
import { test, expect } from "vitest";
import '@testing-library/jest-dom';

test("renders main heading text", () => {
  render(<Header />);
  expect(screen.getByText(/With Trusted Doctor/i)).toBeInTheDocument();
});

test("renders description text", () => {
  render(<Header />);
  expect(screen.getByText(/Simply browse through our extensive list of trused doctors/i)).toBeInTheDocument();
});

test("renders Book appointment button text", () => {
  render(<Header />);
 expect(screen.getByRole('link', { name: /Book appointment/i })).toBeInTheDocument();

});
