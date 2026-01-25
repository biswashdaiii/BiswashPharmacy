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

test("renders 'All Doctors' text in navbar", () => {
  renderNavbar({ token: null, setToken: () => {}, loading: false });
  expect(screen.getByText("All Doctors")).toBeInTheDocument();
});

test("renders 'Chat' text in navbar", () => {
  renderNavbar({ token: null, setToken: () => {}, loading: false });
  expect(screen.getByText("Chat")).toBeInTheDocument();
});

test("renders 'Contact' text in navbar", () => {
  renderNavbar({ token: null, setToken: () => {}, loading: false });
  expect(screen.getByText("Contact")).toBeInTheDocument();
});

test("renders 'About' text in navbar", () => {
  renderNavbar({ token: null, setToken: () => {}, loading: false });
  expect(screen.getByText("About")).toBeInTheDocument();
});
