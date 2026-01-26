import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";
import { test, expect } from "vitest";
import { AppContext } from "../context/AppContext";
import '@testing-library/jest-dom'
const renderNavbar = (contextValue) =>
  render(
    <AppContext.Provider value={contextValue}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </AppContext.Provider>
  );

test("renders 'Home' text in navbar", () => {
  renderNavbar({ token: null, setToken: () => {}, loading: false });
  expect(screen.getByText("Home")).toBeInTheDocument();
});

test("renders 'Home' text in navbar", () => {
  renderNavbar({ token: null, setToken: () => {}, loading: false });
  expect(screen.getByText("Home")).toBeInTheDocument();
});

test("renders 'Collection' text in navbar", () => {
  renderNavbar({ token: null, setToken: () => {}, loading: false });
  expect(screen.getByText("Collection")).toBeInTheDocument();
});

test("renders 'Contact' text in navbar", () => {
  renderNavbar({ token: null, setToken: () => {}, loading: false });
  expect(screen.getByText("Contact")).toBeInTheDocument();
});

test("renders 'About' text in navbar", () => {
  renderNavbar({ token: null, setToken: () => {}, loading: false });
  expect(screen.getByText("About")).toBeInTheDocument();
});
