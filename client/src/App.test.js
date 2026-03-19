import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
});

test("App loads and shows login when not authenticated", async () => {
  render(<App />);

  await waitFor(
    () => {
      expect(
        screen.getByText(/Sign in to access your voting dashboard/i)
      ).toBeInTheDocument();
    },
    { timeout: 8000 }
  );
});
