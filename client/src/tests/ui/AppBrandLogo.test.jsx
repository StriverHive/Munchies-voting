import React from "react";
import { render, screen } from "@testing-library/react";
import AppBrandLogo, {
  BRAND_NAME,
  BRAND_LOGO_SRC,
} from "../../components/AppBrandLogo";

describe("AppBrandLogo (UI)", () => {
  it("renders official logo path and accessible name", () => {
    render(<AppBrandLogo />);
    const img = screen.getByRole("img", { name: BRAND_NAME });
    expect(img).toHaveAttribute("src", BRAND_LOGO_SRC);
  });

  it("allows custom alt text", () => {
    render(<AppBrandLogo alt="Company" />);
    expect(screen.getByRole("img", { name: "Company" })).toBeInTheDocument();
  });
});
