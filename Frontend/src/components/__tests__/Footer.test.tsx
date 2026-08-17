import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "../Footer";
import { BrowserRouter } from "react-router-dom";

describe("Footer Component", () => {
  it("renders footer brand and links", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    expect(screen.getByText(/QuickBite/i)).toBeInTheDocument();
    expect(screen.getByText(/for food lovers/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
  });
});

