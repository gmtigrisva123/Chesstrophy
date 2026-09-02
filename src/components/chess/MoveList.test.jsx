import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MoveList } from "./MoveList.jsx";

const LINE = [{ san: "e4" }, { san: "e5" }, { san: "Nf3" }, { san: "Nc6" }, { san: "Bc4" }];

const COLORS = { doneColor: "#2563EB", currentColor: "#C9A84C", mutedColor: "#888" };

describe("MoveList", () => {
  it("numbers White's moves and leaves Black's unnumbered", () => {
    render(<MoveList moves={LINE} currentIdx={0} {...COLORS} />);
    expect(screen.getByText("1.e4")).toBeInTheDocument();
    expect(screen.getByText("e5")).toBeInTheDocument();
    expect(screen.getByText("2.Nf3")).toBeInTheDocument();
    expect(screen.getByText("3.Bc4")).toBeInTheDocument();
  });

  it("renders plain text when it is not clickable", () => {
    render(<MoveList moves={LINE} currentIdx={2} {...COLORS} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders buttons and reports the clicked ply", async () => {
    const user = userEvent.setup();
    const onClickMove = vi.fn();
    render(<MoveList moves={LINE} currentIdx={0} onClickMove={onClickMove} {...COLORS} />);

    await user.click(screen.getByRole("button", { name: "2.Nf3" }));
    expect(onClickMove).toHaveBeenCalledWith(2);
  });

  it("marks the current ply for assistive technology", () => {
    render(<MoveList moves={LINE} currentIdx={3} onClickMove={vi.fn()} {...COLORS} />);
    expect(screen.getByRole("button", { name: "Nc6" })).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "1.e4" })).not.toHaveAttribute("aria-current");
  });

  // Regression: `key` used to be spread in via a props object, which React 18
  // warns about and React 19 ignores outright.
  it("renders without React key warnings", () => {
    const errors = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => errors.push(args.join(" ")));
    render(<MoveList moves={LINE} currentIdx={1} onClickMove={vi.fn()} {...COLORS} />);
    spy.mockRestore();
    expect(errors.filter(e => e.includes("key"))).toEqual([]);
  });

  it("renders nothing for an empty line", () => {
    const { container } = render(<MoveList moves={[]} currentIdx={0} {...COLORS} />);
    expect(container.querySelector("div").children).toHaveLength(0);
  });
});
