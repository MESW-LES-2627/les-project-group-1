import { describe, it, expect, beforeEach, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import { ShippingAddresses } from "../src/components/ShippingAddresses";

describe("ShippingAddresses Component", () => {
  const mockToken = "fake-jwt-token";

  beforeEach(() => {
    mock.restore();
  });

  it("shows loading state and then empty message when no addresses exist", async () => {
    global.fetch = mock(async () => ({
      ok: true,
      json: async () => [],
    })) as any;

    render(<ShippingAddresses token={mockToken} />);

    expect(screen.getByText("Loading addresses…")).toBeDefined();

    await waitFor(() => { expect(screen.getByText("No shipping addresses saved yet.")).toBeDefined();});
  });

  it("renders shipping addresses when successfully fetched", async () => {
    const mockAddresses = [
      {
        id: 1,
        fullName: "Maria Silva",
        street: "Avenida Central 42",
        city: "Porto",
        state: "Porto",
        postalCode: "4000-100",
        country: "PT",
        isDefault: true,
      },
    ];

    global.fetch = mock(async () => ({
      ok: true,
      json: async () => mockAddresses,
    })) as any;

    render(<ShippingAddresses token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeDefined();
      expect(screen.getByText("Default")).toBeDefined();
      expect(screen.getByText("Avenida Central 42, Porto 4000-100")).toBeDefined();
    });
  });

  it("allows opening the new address form", async () => {
    global.fetch = mock(async () => ({
      ok: true,
      json: async () => [],
    })) as any;

    render(<ShippingAddresses token={mockToken} />);
    
    const addButton = await waitFor(() => screen.getByText("+ ADD ADDRESS"));
    addButton.click();
    await waitFor(() => {
      expect(screen.getByText("New Address")).toBeDefined();
      expect(screen.getByText("Full Name")).toBeDefined();
      expect(screen.getByText("Street Address")).toBeDefined();
    });
  });
});