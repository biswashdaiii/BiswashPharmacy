import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi,beforeEach } from "vitest";
import RelatedDoctors from "./RelatedDoctors";
import { AppContext } from "../context/AppContext";
import '@testing-library/jest-dom';


// Declare mockNavigate before mocking react-router
const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  ...vi.importActual("react-router"),
  useNavigate: () => mockNavigate, // use the declared mockNavigate here
}));

describe("RelatedDoctors Component", () => {
  const doctorsMock = [
    { _id: "1", name: "Dr. A", speciality: "Cardiology", image: "/imgA.jpg" },
    { _id: "2", name: "Dr. B", speciality: "Cardiology", image: "/imgB.jpg" },
    { _id: "3", name: "Dr. C", speciality: "Neurology", image: "/imgC.jpg" },
  ];

  beforeEach(() => {
    mockNavigate.mockClear(); // clear mocks before each test
  });

  test("renders heading and description text", () => {
    render(
      <AppContext.Provider value={{ doctors: doctorsMock }}>
        <MemoryRouter>
          <RelatedDoctors docId="1" speciality="Cardiology" />
        </MemoryRouter>
      </AppContext.Provider>
    );

    expect(screen.getByText(/Top Doctoes to Book/i)).toBeInTheDocument();
    expect(
      screen.getByText(/simply browse through our extensive list of doctors/i)
    ).toBeInTheDocument();
  });

  test("renders filtered doctors based on speciality and excludes current docId", () => {
    render(
      <AppContext.Provider value={{ doctors: doctorsMock }}>
        <MemoryRouter>
          <RelatedDoctors docId="1" speciality="Cardiology" />
        </MemoryRouter>
      </AppContext.Provider>
    );

    expect(screen.getByText("Dr. B")).toBeInTheDocument();
    expect(screen.queryByText("Dr. A")).toBeNull();
    expect(screen.queryByText("Dr. C")).toBeNull();
  });

  test("navigates on doctor card click", () => {
    render(
      <AppContext.Provider value={{ doctors: doctorsMock }}>
        <MemoryRouter>
          <RelatedDoctors docId="1" speciality="Cardiology" />
        </MemoryRouter>
      </AppContext.Provider>
    );

    const doctorCard = screen.getByText("Dr. B").closest("div");
    fireEvent.click(doctorCard);

    expect(mockNavigate).toHaveBeenCalledWith("/appointment/2");
  });

  test("navigates to /doctors on more button click", () => {
    render(
      <AppContext.Provider value={{ doctors: doctorsMock }}>
        <MemoryRouter>
          <RelatedDoctors docId="1" speciality="Cardiology" />
        </MemoryRouter>
      </AppContext.Provider>
    );

    fireEvent.click(screen.getByText(/more/i));
    expect(mockNavigate).toHaveBeenCalledWith("/doctors");
  });
});
