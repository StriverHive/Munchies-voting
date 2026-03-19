import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PublicVotePage from "../../pages/PublicVotePage";
import api from "../../api";

jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

function renderVotePage(voteId = "507f1f77bcf86cd799439011") {
  return render(
    <MemoryRouter initialEntries={[`/vote/${voteId}`]}>
      <Routes>
        <Route path="/vote/:voteId" element={<PublicVotePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PublicVotePage (UI)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({
      data: { name: "Manager of the Month", phase: "open" },
    });
  });

  it("loads public summary and shows verification step", async () => {
    renderVotePage();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/votes/507f1f77bcf86cd799439011/public-summary"
      );
    });
    expect(
      await screen.findByRole("heading", { name: /manager of the month/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/employee id/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^continue$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/private employee ballot/i)
    ).toBeInTheDocument();
  });
});
