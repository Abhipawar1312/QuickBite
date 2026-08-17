import { act } from "react";
import axios from "axios";
import { useCouponStore } from "../useCouponStore";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("useCouponStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCouponStore.setState({
      activeCoupons: [],
      allCoupons: [],
      loading: false,
    });
  });

  it("fetches active coupons", async () => {
    const mockCoupons = [
      {
        _id: "c1",
        code: "WELCOME50",
        discountType: "percentage",
        discountValue: 50,
        minOrderAmount: 200,
        maxDiscountAmount: 100,
        isActive: true,
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, coupons: mockCoupons },
    });

    await act(async () => {
      await useCouponStore.getState().getActiveCoupons();
    });

    expect(useCouponStore.getState().activeCoupons).toHaveLength(1);
    expect(useCouponStore.getState().activeCoupons[0].code).toBe("WELCOME50");
  });

  it("applies coupon successfully and returns discountAmount", async () => {
    const mockCoupon: any = {
      code: "FLAT100",
      discountAmount: 100,
    };

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Coupon applied!",
        coupon: mockCoupon,
      },
    });

    let res: any;
    await act(async () => {
      res = await useCouponStore.getState().applyCoupon("FLAT100", 400);
    });

    expect(res.success).toBe(true);
    expect(res.discountAmount).toBe(100);
  });
});

