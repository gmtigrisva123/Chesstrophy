import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary.jsx";

function Boom() {
  throw new Error("kaboom");
}

/** React logs caught errors to console.error; silence it for these tests. */
function silenceReactErrorLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

describe("ErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(<ErrorBoundary><p>All good</p></ErrorBoundary>);
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("shows a recovery screen instead of unmounting the tree", () => {
    const spy = silenceReactErrorLog();
    render(<ErrorBoundary><Boom /></ErrorBoundary>);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("reports the error to onError", () => {
    const spy = silenceReactErrorLog();
    const onError = vi.fn();
    render(<ErrorBoundary onError={onError}><Boom /></ErrorBoundary>);

    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    spy.mockRestore();
  });

  it("clears the error and calls onReset when the user retries", async () => {
    const spy = silenceReactErrorLog();
    const onReset = vi.fn();
    const user = userEvent.setup();

    function Flaky({ shouldThrow }) {
      if (shouldThrow) throw new Error("kaboom");
      return <p>Recovered</p>;
    }

    const { rerender } = render(
      <ErrorBoundary onReset={onReset}><Flaky shouldThrow /></ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(<ErrorBoundary onReset={onReset}><Flaky shouldThrow={false} /></ErrorBoundary>);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(onReset).toHaveBeenCalledOnce();
    expect(screen.getByText("Recovered")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("uses a custom title when given one", () => {
    const spy = silenceReactErrorLog();
    render(<ErrorBoundary title="Puzzles are unavailable"><Boom /></ErrorBoundary>);
    expect(screen.getByText("Puzzles are unavailable")).toBeInTheDocument();
    spy.mockRestore();
  });
});
