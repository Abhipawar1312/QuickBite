import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MerchantAnalytics } from "../MerchantAnalytics";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("MerchantAnalytics Component", () => {
  const mockAnalyticsData = {
    totalRevenue: 45000,
    totalOrders: 120,
    completedOrdersCount: 115,
    cancelledOrdersCount: 5,
    averageOrderValue: 375,
    last7Days: [
      { date: "Aug 15", revenue: 6500, orders: 18 },
      { date: "Aug 16", revenue: 8200, orders: 22 },
    ],
    hourlyDistribution: [
      { hour: 12, label: "12:00", count: 14 },
      { hour: 19, label: "19:00", count: 28 },
    ],
    topSellingItems: [
      { name: "Butter Chicken", quantity: 45, revenue: 14400 },
      { name: "Garlic Naan", quantity: 70, revenue: 4200 },
    ],
    uniqueCustomers: 80,
    repeatCustomers: 32,
    retentionRate: 40,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and renders analytics KPI metrics and top selling dishes", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        analytics: mockAnalyticsData,
      },
    });

    render(<MerchantAnalytics />);

    await waitFor(() => {
      expect(screen.getByText("Merchant Sales & Revenue Analytics")).toBeInTheDocument();
    });

    expect(screen.getByText("₹45,000")).toBeInTheDocument();
    expect(screen.getByText("115")).toBeInTheDocument();
    expect(screen.getByText("₹375")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Butter Chicken")).toBeInTheDocument();
    expect(screen.getByText("45 orders sold")).toBeInTheDocument();
  });

  it("handles CSV export report download", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          analytics: mockAnalyticsData,
        },
      })
      .mockResolvedValueOnce({
        data: "Order ID,Date,Customer,Total,Status\n101,2026-08-17,John,500,delivered",
      });

    // Mock window.URL.createObjectURL
    window.URL.createObjectURL = jest.fn().mockReturnValue("blob:mock-csv-url");

    render(<MerchantAnalytics />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Export CSV Report/i })).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Export CSV Report/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/export"),
        expect.objectContaining({ responseType: "blob" })
      );
    });
  });
});
